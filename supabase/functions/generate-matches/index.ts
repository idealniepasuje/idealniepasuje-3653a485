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

    const { employer_user_id, job_offer_id } = await req.json();

    if (!employer_user_id) {
      return new Response(JSON.stringify({ error: 'employer_user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user can only trigger matches for themselves
    if (authenticatedUserId !== employer_user_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: can only generate matches for own account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get employer profile (for culture data)
    const { data: employer, error: employerError } = await supabase
      .from('employer_profiles')
      .select('*')
      .eq('user_id', employer_user_id)
      .single();

    if (employerError || !employer) {
      return new Response(JSON.stringify({ error: 'Employer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get job offers to generate matches for
    let offersQuery = supabase
      .from('job_offers')
      .select('*')
      .eq('user_id', employer_user_id)
      .eq('is_active', true);
    
    // If specific offer ID provided, only process that one
    if (job_offer_id) {
      offersQuery = offersQuery.eq('id', job_offer_id);
    }

    const { data: jobOffers, error: offersError } = await offersQuery;

    if (offersError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch job offers' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!jobOffers || jobOffers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        matches_count: 0,
        message: 'No active job offers found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Oferty bez kompletu wymagań kompetencyjnych nie generują dopasowań
    const skippedOffers: { job_offer_id: string; title: string; reason: string; missing: string[] }[] = [];
    const eligibleOffers = jobOffers.filter((o) => {
      const check = checkOfferEligibility(o as JobOfferData);
      if (!check.eligible) {
        skippedOffers.push({
          job_offer_id: o.id,
          title: o.title,
          reason: check.reason!,
          missing: check.missingCompetencies,
        });
      }
      return check.eligible;
    });

    if (eligibleOffers.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        matches_count: 0,
        skipped_offers: skippedOffers,
        message: skippedOffers[0]?.reason
          ?? 'Oferta wymaga uzupełnienia oczekiwanych poziomów kompetencji przed rozpoczęciem dopasowywania.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }



    // Stats counters
    const { count: totalCandidates } = await supabase
      .from('candidate_test_results')
      .select('*', { count: 'exact', head: true });
    const { count: completedTestsCandidates } = await supabase
      .from('candidate_test_results')
      .select('*', { count: 'exact', head: true })
      .eq('all_tests_completed', true);
    const { count: profileReadyCandidates } = await supabase
      .from('candidate_test_results')
      .select('*', { count: 'exact', head: true })
      .eq('profile_ready', true);

    // Get eligible candidates: completed tests (profile_ready is NOT a hard filter)
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidate_test_results')
      .select('*')
      .eq('all_tests_completed', true);

    if (candidatesError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch candidates' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eligibleCandidates = candidates?.length || 0;
    let createdMatches = 0;
    let updatedMatches = 0;

    // NOTE: historical matches are intentionally never deleted here.
    // Candidates may fail the current (stricter) `all_tests_completed` definition
    // while still having legitimate historical matches with lifecycle statuses.
    const eligibleIds = new Set((candidates || []).map((c) => c.user_id));
    let preservedHistoricalMatches = 0;
    {
      const { data: existingForOffers } = await supabase
        .from('match_results')
        .select('candidate_user_id')
        .eq('employer_user_id', employer_user_id)
        .in('job_offer_id', eligibleOffers.map((o) => o.id));
      preservedHistoricalMatches = (existingForOffers || []).filter(
        (m) => !eligibleIds.has(m.candidate_user_id),
      ).length;
    }

    const employerCultureCompleted = (employer as any).culture_completed === true;
    const allMatches: any[] = [];
    const newMatchCandidates: { user_id: string; overall_percent: number; job_offer_id: string; offer_title: string }[] = [];

    // Generate matches for each job offer
    for (const offer of eligibleOffers) {
      for (const candidate of candidates || []) {
        // Single lookup: gives both id and lifecycle status
        const { data: existingMatch } = await supabase
          .from('match_results')
          .select('id, status')
          .eq('employer_user_id', employer_user_id)
          .eq('candidate_user_id', candidate.user_id)
          .eq('job_offer_id', offer.id)
          .maybeSingle();

        const isNewMatch = !existingMatch;

        // Calculate matches using offer requirements + employer culture
        const outcome = calculateMatch(
          candidate as CandidateData,
          offer as JobOfferData,
          employerCultureCompleted ? (employer as EmployerCultureData) : null,
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

        // Upsert match result with job_offer_id (lifecycle status preserved)
        const { error: upsertError } = await supabase
          .from('match_results')
          .upsert({
            employer_user_id,
            candidate_user_id: candidate.user_id,
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

        if (!upsertError) {
          allMatches.push({
            candidate_user_id: candidate.user_id,
            job_offer_id: offer.id,
            overall_percent: outcome.overallPercent,
          });

          // Track new matches for email notifications
          if (isNewMatch) {
            createdMatches++;
            newMatchCandidates.push({
              user_id: candidate.user_id,
              overall_percent: outcome.overallPercent,
              job_offer_id: offer.id,
              offer_title: offer.title,
            });
          } else {
            updatedMatches++;
          }
        }
      }
    }

    // Send email notifications for new matches
    const companyName = employer.company_name || 'Nowy pracodawca';
    for (const newMatch of newMatchCandidates) {
      try {
        // Get candidate email from auth.users
        const { data: userData } = await supabase.auth.admin.getUserById(newMatch.user_id);
        const candidateEmail = userData?.user?.email;

        // Get match details from database
        const { data: matchData } = await supabase
          .from('match_results')
          .select('*')
          .eq('employer_user_id', employer_user_id)
          .eq('candidate_user_id', newMatch.user_id)
          .eq('job_offer_id', newMatch.job_offer_id)
          .single();

        if (candidateEmail) {
          // Call send-match-notification function with detailed info
          const notificationResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-match-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                candidate_user_id: newMatch.user_id,
                candidate_email: candidateEmail,
                employer_user_id: employer_user_id,
                employer_company_name: companyName,
                match_percent: newMatch.overall_percent,
                competence_percent: matchData?.competence_percent,
                culture_percent: matchData?.culture_percent,
                extra_percent: matchData?.extra_percent,
                job_offer_title: newMatch.offer_title,
                dashboard_url: 'https://idealniepasuje.lovable.app/candidate/dashboard',
              }),
            }
          );

          if (!notificationResponse.ok) {
            console.error(`Failed to send notification to ${candidateEmail}:`, await notificationResponse.text());
          } else {
            console.log(`Match notification sent to ${candidateEmail}`);
          }
        }
      } catch (emailError) {
        console.error(`Error sending notification for candidate ${newMatch.user_id}:`, emailError);
      }
    }

    // Send employer match summary email
    try {
      const { data: employerAuth } = await supabase.auth.admin.getUserById(employer_user_id);
      const employerEmail = employerAuth?.user?.email;

      if (employerEmail && newMatchCandidates.length > 0) {
        const summaryResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-employer-match-summary`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              employer_user_id: employer_user_id,
              employer_email: employerEmail,
              dashboard_url: 'https://idealniepasuje.lovable.app/employer/candidates',
            }),
          }
        );

        if (!summaryResponse.ok) {
          console.error(`Failed to send employer summary:`, await summaryResponse.text());
        } else {
          console.log(`Employer match summary sent to ${employerEmail}`);
        }
      }
    } catch (summaryError) {
      console.error(`Error sending employer summary:`, summaryError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      matches_count: allMatches.length,
      matches: allMatches,
      skipped_offers: skippedOffers,
      stats: {

        totalCandidates: totalCandidates || 0,
        completedTestsCandidates: completedTestsCandidates || 0,
        profileReadyCandidates: profileReadyCandidates || 0,
        eligibleCandidates,
        createdMatches,
        updatedMatches,
        preservedHistoricalMatches,
        insertedMatches: allMatches.length,
      },
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
