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

import {
  EXTERNAL_MATCHING_OR_FILTER,
} from '../_shared/candidate-marketplace-eligibility.ts'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const padded = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      '=',
    )

    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authorization' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const payload = decodeJwtPayload(token)

    if (!payload || payload.role !== 'service_role') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - service role required' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({}))
    const candidateUserId = body?.candidate_user_id as string | undefined

    let candidatesQuery = supabase
      .from('candidate_test_results')
      .select('*')
      .or(EXTERNAL_MATCHING_OR_FILTER)
      .eq('open_to_external_offers', true)

    if (candidateUserId) {
      candidatesQuery = candidatesQuery.eq('user_id', candidateUserId)
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery

    if (candidatesError) {
      console.error('Failed to fetch candidates:', candidatesError)

      return new Response(
        JSON.stringify({ error: 'Failed to fetch candidates' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const { data: jobOffers, error: offersError } = await supabase
      .from('job_offers')
      .select('*')
      .eq('is_active', true)
      .eq('recruit_external_candidates', true)

    if (offersError) {
      console.error('Failed to fetch job offers:', offersError)

      return new Response(
        JSON.stringify({ error: 'Failed to fetch job offers' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    if (
      !candidates ||
      candidates.length === 0 ||
      !jobOffers ||
      jobOffers.length === 0
    ) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No candidates or job offers to process',
          candidates_count: candidates?.length || 0,
          offers_count: jobOffers?.length || 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const employerUserIds = [...new Set(jobOffers.map((o) => o.user_id))]

    const {
      data: employerProfiles,
      error: profilesError,
    } = await supabase
      .from('employer_profiles')
      .select('*')
      .in('user_id', employerUserIds)

    if (profilesError) {
      console.error('Failed to fetch employer profiles:', profilesError)

      return new Response(
        JSON.stringify({ error: 'Failed to fetch employer profiles' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const employerProfileMap = new Map(
      (employerProfiles || []).map((p) => [p.user_id, p]),
    )

    let totalMatches = 0
    const errors: string[] = []

    const skippedOffers: {
      job_offer_id: string
      title: string
      reason: string
    }[] = []

    const eligibleOffers = jobOffers.filter((offer) => {
      const check = checkOfferEligibility(offer as JobOfferData)

      if (!check.eligible) {
        skippedOffers.push({
          job_offer_id: offer.id,
          title: offer.title,
          reason: check.reason!,
        })
      }

      return check.eligible
    })

    for (const candidate of candidates) {
      for (const offer of eligibleOffers) {
        const employerProfile = employerProfileMap.get(offer.user_id)

        if (!employerProfile) {
          continue
        }

        const employerCultureCompleted =
          (employerProfile as any).culture_completed === true

        const outcome = calculateMatch(
          candidate as CandidateData,
          offer as JobOfferData,
          employerCultureCompleted
            ? (employerProfile as EmployerCultureData)
            : null,
        )

        if (outcome.matchStatus === 'insufficient_data') {
          continue
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
          candidate_profile_status:
            (candidate as any).profile_ready === true
              ? 'complete'
              : 'incomplete',
        }

        const { data: existingMatch } = await supabase
          .from('match_results')
          .select('id, status')
          .eq('employer_user_id', offer.user_id)
          .eq('candidate_user_id', candidate.user_id)
          .eq('job_offer_id', offer.id)
          .maybeSingle()

        const payload = {
          employer_user_id: offer.user_id,
          candidate_user_id: candidate.user_id,
          job_offer_id: offer.id,
          overall_percent: outcome.overallPercent,
          competence_percent: outcome.competencePercent,
          culture_percent: outcome.culturePercent,
          extra_percent: outcome.extraPercent,
          match_details: matchDetails,
          status: existingMatch?.status ?? 'pending',
        }

        const { error: upsertError } = await supabase
          .from('match_results')
          .upsert(payload, {
            onConflict:
              'employer_user_id,candidate_user_id,job_offer_id',
          })

        if (upsertError) {
          errors.push(
            `Failed match for candidate ${candidate.user_id} x offer ${offer.id}: ${upsertError.message}`,
          )
        } else {
          totalMatches++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_matches_created: totalMatches,
        candidates_processed: candidates.length,
        offers_processed: eligibleOffers.length,
        skipped_offers: skippedOffers,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('generate-all-matches error:', error)

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})