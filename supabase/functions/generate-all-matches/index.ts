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

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service-role only: this function recomputes ALL employer-candidate matches
    // system-wide and must never be callable by ordinary employer JWTs.
    const token = authHeader.replace('Bearer ', '');
    if (token !== supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - service role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all candidates with completed tests
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidate_test_results')
      .select('*')
      .eq('all_tests_completed', true)
      .eq('open_to_external_offers', true);

    if (candidatesError) {
      console.error('Failed to fetch candidates:', candidatesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch candidates' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active job offers
    const { data: jobOffers, error: offersError } = await supabase
      .from('job_offers')
      .select('*')
      .eq('is_active', true)
      .eq('recruit_external_candidates', true);

    if (offersError) {
      console.error('Failed to fetch job offers:', offersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch job offers' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!candidates || candidates.length === 0 || !jobOffers || jobOffers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No candidates or job offers to process',
        candidates_count: candidates?.length || 0,
        offers_count: jobOffers?.length || 0,
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

    const employerProfileMap = new Map(
      (employerProfiles || []).map(p => [p.user_id, p])
    );

    let totalMatches = 0;
    const errors: string[] = [];
    const skippedOffers: { job_offer_id: string; title: string; reason: string }[] = [];

    // Oferty bez kompletu wymagań kompetencyjnych nie generują dopasowań
    const eligibleOffers = jobOffers.filter((o) => {
      const check = checkOfferEligibility(o as JobOfferData);
      if (!check.eligible) {
        skippedOffers.push({ job_offer_id: o.id, title: o.title, reason: check.reason! });
      }
      return check.eligible;
    });

    for (const candidate of candidates) {
      for (const offer of eligibleOffers) {
        const employerProfile = employerProfileMap.get(offer.user_id);
        
        if (!employerProfile) {
          continue;
        }


        const outcome = calculateMatch(
          candidate as CandidateData,
          offer as JobOfferData,
          employerProfile as EmployerCultureData,
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
        };

        // Check if a match already exists; preserve employer-set status (interested/considering/rejected/viewed)
        const { data: existingMatch } = await supabase
          .from('match_results')
          .select('id, status')
          .eq('employer_user_id', offer.user_id)
          .eq('candidate_user_id', candidate.user_id)
          .eq('job_offer_id', offer.id)
          .maybeSingle();

        const payload = {
          employer_user_id: offer.user_id,
          candidate_user_id: candidate.user_id,
          job_offer_id: offer.id,
          overall_percent: outcome.overallPercent,
          competence_percent: outcome.competencePercent,
          culture_percent: outcome.culturePercent,
          extra_percent: outcome.extraPercent,
          match_details: matchDetails,
          // Only set status='pending' for brand-new matches; never overwrite an existing status
          ...(existingMatch ? { status: existingMatch.status } : { status: 'pending' }),
        };

        const { error: upsertError } = await supabase
          .from('match_results')
          .upsert(payload, {
            onConflict: 'employer_user_id,candidate_user_id,job_offer_id',
          });

        if (upsertError) {
          errors.push(`Failed match for candidate ${candidate.user_id} x offer ${offer.id}: ${upsertError.message}`);
        } else {
          totalMatches++;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total_matches_created: totalMatches,
      candidates_processed: candidates.length,
      offers_processed: eligibleOffers.length,
      skipped_offers: skippedOffers,

      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
