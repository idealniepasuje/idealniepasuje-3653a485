import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import {
  calculateMatch,
  checkOfferEligibility,
  type CandidateData,
  type JobOfferData,
  type EmployerCultureData,
} from '../_shared/matching.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to validate auth
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate JWT and get user claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub;

    const { candidate_user_id } = await req.json();

    if (!candidate_user_id) {
      return new Response(JSON.stringify({ error: 'candidate_user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user can only trigger matches for themselves
    if (authenticatedUserId !== candidate_user_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: can only generate matches for own account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('candidate_test_results')
      .select('*')
      .eq('user_id', candidate_user_id)
      .single();

    if (candidateError || !candidate) {
      return new Response(JSON.stringify({ error: 'Candidate not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Require tests completed; profile_ready is NOT a hard filter (used for UI status only)
    if (!candidate.all_tests_completed) {
      return new Response(JSON.stringify({
        success: true,
        matches_count: 0,
        matches: [],
        message: 'Candidate has not completed all tests yet',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active job offers with employer profiles (culture data)
    const { data: jobOffers, error: offersError } = await supabase
      .from('job_offers')
      .select('*')
      .eq('is_active', true);

    if (offersError) {
      console.error('Failed to fetch job offers:', offersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch job offers' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!jobOffers || jobOffers.length === 0) {
      console.log('No active job offers found');
      return new Response(JSON.stringify({ 
        success: true, 
        matches_count: 0,
        matches: [],
        message: 'No active job offers available'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get employer profiles for culture data
    const employerUserIds = [...new Set(jobOffers.map(o => o.user_id))];
    const { data: employerProfiles, error: profilesError } = await supabase
      .from('employer_profiles')
      .select('*')
      .in('user_id', employerUserIds);

    if (profilesError) {
      console.error('Failed to fetch employer profiles:', profilesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch employer profiles' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a map for quick lookup
    const employerProfileMap = new Map(
      (employerProfiles || []).map(p => [p.user_id, p])
    );

    const matches: any[] = [];
    const newReliableMatches: any[] = [];
    const skippedOffers: { job_offer_id: string; title: string; reason: string }[] = [];

    for (const offer of jobOffers) {
      // Oferta bez kompletu wymagań kompetencyjnych nie generuje dopasowań
      const eligibility = checkOfferEligibility(offer as JobOfferData);
      if (!eligibility.eligible) {
        skippedOffers.push({ job_offer_id: offer.id, title: offer.title, reason: eligibility.reason! });
        continue;
      }

      const employerProfile = employerProfileMap.get(offer.user_id);
      
      if (!employerProfile) {
        console.log(`No employer profile found for offer ${offer.id}, skipping`);
        continue;
      }


      const employerCultureCompleted = (employerProfile as any).culture_completed === true;
      const outcome = calculateMatch(
        candidate as CandidateData,
        offer as JobOfferData,
        employerCultureCompleted ? (employerProfile as EmployerCultureData) : null,
      );

      if (outcome.matchStatus === 'insufficient_data') {
        continue;
      }

      const matchDetails = {
        competenceDetails: outcome.competenceDetails,
        cultureDetails: outcome.cultureDetails,
        extraDetails: outcome.extraDetails,
        matchStatus: outcome.matchStatus,
        reliable: outcome.reliable,
        availableSections: outcome.availableSections,
        technicalPercent: outcome.technicalPercent,
        extraStatus: outcome.extraStatus,
        extraAvailableCriteria: outcome.extraAvailableCriteria,
        extraTotalCriteria: outcome.extraTotalCriteria,
        extraCoveragePercent: outcome.extraCoveragePercent,
        appliedWeights: outcome.appliedWeights,
        strengths: outcome.strengths,
        risks: outcome.risks,
        profile_ready: (candidate as any).profile_ready === true,
        candidate_profile_status: (candidate as any).profile_ready === true ? 'complete' : 'incomplete',
      };

      // Preserve any existing lifecycle status (viewed/considering/rejected)
      const { data: existingMatch } = await supabase
        .from('match_results')
        .select('id, status')
        .eq('employer_user_id', offer.user_id)
        .eq('candidate_user_id', candidate_user_id)
        .eq('job_offer_id', offer.id)
        .maybeSingle();

      const { error: upsertError } = await supabase
        .from('match_results')
        .upsert({
          employer_user_id: offer.user_id,
          candidate_user_id,
          job_offer_id: offer.id,
          overall_percent: outcome.overallPercent,
          competence_percent: outcome.competencePercent,
          culture_percent: outcome.culturePercent,
          extra_percent: outcome.extraPercent,
          match_details: matchDetails,
          status: existingMatch?.status ?? 'pending',
        }, {
          onConflict: 'employer_user_id,candidate_user_id,job_offer_id',
        });

      if (upsertError) {
        console.error(`Failed to upsert match for offer ${offer.id}:`, upsertError);
      } else {
        const entry = {
          employer_user_id: offer.user_id,
          job_offer_id: offer.id,
          job_offer_title: offer.title,
          overall_percent: outcome.overallPercent,
          competence_percent: outcome.competencePercent,
          culture_percent: outcome.culturePercent,
          extra_percent: outcome.extraPercent,
          role_description: offer.role_description,
          role_responsibilities: offer.role_responsibilities,
          industry: offer.industry,
          position_level: offer.position_level,
          company_name: employerProfile.company_name,
        };
        matches.push(entry);

        const isNew = !existingMatch;
        const isReliable =
          outcome.reliable !== false &&
          outcome.matchStatus !== 'low_confidence' &&
          outcome.matchStatus !== 'insufficient_data';
        if (isNew && isReliable) {
          newReliableMatches.push(entry);
        }
      }
    }

    // Send email notifications to candidate
    if (newReliableMatches.length > 0) {
      // Get candidate email
      const { data: candidateAuth } = await supabase.auth.admin.getUserById(candidate_user_id);
      const candidateEmail = candidateAuth?.user?.email;

      if (candidateEmail) {
        // Send notification for the best match
        const bestMatch = newReliableMatches.reduce((best, current) =>
          current.overall_percent > best.overall_percent ? current : best
        , newReliableMatches[0]);
        
        try {
          const notificationResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-match-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                candidate_user_id: candidate_user_id,
                candidate_email: candidateEmail,
                employer_user_id: bestMatch.employer_user_id,
                employer_company_name: bestMatch.company_name || 'Nowy pracodawca',
                match_percent: bestMatch.overall_percent,
                competence_percent: bestMatch.competence_percent,
                culture_percent: bestMatch.culture_percent,
                extra_percent: bestMatch.extra_percent,
                role_description: bestMatch.role_description,
                role_responsibilities: bestMatch.role_responsibilities,
                industry: bestMatch.industry,
                position_level: bestMatch.position_level,
                dashboard_url: 'https://idealniepasuje.lovable.app/candidate/matches',
              }),
            }
          );

          if (!notificationResponse.ok) {
            console.error(`Failed to send candidate notification:`, await notificationResponse.text());
          } else {
            console.log(`Match notification sent to candidate ${candidateEmail}`);
          }
        } catch (emailError) {
          console.error(`Error sending candidate notification:`, emailError);
        }
      }
    } else if (matches.length === 0) {
      // No matches found - send no-match email
      try {
        const { data: candidateAuth } = await supabase.auth.admin.getUserById(candidate_user_id);
        const candidateEmail = candidateAuth?.user?.email;

        if (candidateEmail) {
          const noMatchResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-no-match-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                user_id: candidate_user_id,
                user_email: candidateEmail,
                user_type: 'candidate',
              }),
            }
          );

          if (!noMatchResponse.ok) {
            console.error(`Failed to send no-match notification:`, await noMatchResponse.text());
          } else {
            console.log(`No-match notification sent to ${candidateEmail}`);
          }
        }
      } catch (emailError) {
        console.error(`Error sending no-match notification:`, emailError);
      }
    }

    console.log(`Generated ${matches.length} matches for candidate ${candidate_user_id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      matches_count: matches.length,
      new_reliable_matches: newReliableMatches.length,
      skipped_offers: skippedOffers,
      matches 

    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
