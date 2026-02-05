import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Calculate dimension match (scale 0-1)
const calculateDimensionMatch = (candidateValue: number, employerValue: number): number => {
  const diff = Math.abs(candidateValue - employerValue);
  return Math.max(0, 1 - diff / 4);
};

// Weights
const WEIGHTS = { competence: 0.50, culture: 0.35, extra: 0.15 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub;
    const { employer_user_id, job_offer_id } = await req.json();

    if (!employer_user_id || authenticatedUserId !== employer_user_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Get job offers
    let offersQuery = supabase
      .from('job_offers')
      .select('*')
      .eq('user_id', employer_user_id)
      .eq('is_active', true);
    
    if (job_offer_id) {
      offersQuery = offersQuery.eq('id', job_offer_id);
    }

    const { data: jobOffers, error: offersError } = await offersQuery;

    if (offersError || !jobOffers || jobOffers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        matches_count: 0,
        message: 'No active job offers' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all candidates
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

    const allMatches: any[] = [];

    for (const offer of jobOffers) {
      for (const candidate of candidates || []) {
        // Calculate competence match
        const competencies = [
          { c: candidate.komunikacja_score || 3, e: offer.req_komunikacja || 3 },
          { c: candidate.myslenie_analityczne_score || 3, e: offer.req_myslenie_analityczne || 3 },
          { c: candidate.out_of_the_box_score || 3, e: offer.req_out_of_the_box || 3 },
          { c: candidate.determinacja_score || 3, e: offer.req_determinacja || 3 },
          { c: candidate.adaptacja_score || 3, e: offer.req_adaptacja || 3 },
        ];
        const competencePercent = competencies.reduce((sum, comp) => 
          sum + calculateDimensionMatch(comp.c, comp.e) * 100, 0) / competencies.length;

        // Calculate culture match
        const cultureDims = [
          { c: candidate.culture_relacja_wspolpraca || 3, e: employer.culture_relacja_wspolpraca || 3 },
          { c: candidate.culture_elastycznosc_innowacyjnosc || 3, e: employer.culture_elastycznosc_innowacyjnosc || 3 },
          { c: candidate.culture_wyniki_cele || 3, e: employer.culture_wyniki_cele || 3 },
          { c: candidate.culture_stabilnosc_struktura || 3, e: employer.culture_stabilnosc_struktura || 3 },
          { c: candidate.culture_autonomia_styl_pracy || 3, e: employer.culture_autonomia_styl_pracy || 3 },
          { c: candidate.culture_wlb_dobrostan || 3, e: employer.culture_wlb_dobrostan || 3 },
        ];
        const culturePercent = cultureDims.reduce((sum, dim) => 
          sum + calculateDimensionMatch(dim.c, dim.e) * 100, 0) / cultureDims.length;

        // Calculate extra match
        let extraMatched = 0;
        const extraTotal = 3;
        
        // Industry
        if (candidate.industry === offer.industry || 
            (offer.accepted_industries?.includes(candidate.industry) ?? false)) {
          extraMatched++;
        }
        
        // Experience
        const candidateExp = parseInt(candidate.experience || '0') || 0;
        const requiredExp = parseInt(offer.required_experience || '0') || 0;
        if (offer.no_experience_required || candidateExp >= requiredExp) {
          extraMatched++;
        }
        
        // Position level
        if (candidate.position_level === offer.position_level) {
          extraMatched++;
        }
        
        const extraPercent = (extraMatched / extraTotal) * 100;

        const overallPercent = 
          WEIGHTS.competence * competencePercent +
          WEIGHTS.culture * culturePercent +
          WEIGHTS.extra * extraPercent;

        // Upsert match
        const { error: upsertError } = await supabase
          .from('match_results')
          .upsert({
            employer_user_id,
            candidate_user_id: candidate.user_id,
            job_offer_id: offer.id,
            overall_percent: Math.round(overallPercent),
            competence_percent: Math.round(competencePercent),
            culture_percent: Math.round(culturePercent),
            extra_percent: Math.round(extraPercent),
            status: 'pending',
          }, {
            onConflict: 'employer_user_id,candidate_user_id,job_offer_id',
          });

        if (!upsertError) {
          allMatches.push({
            candidate_user_id: candidate.user_id,
            job_offer_id: offer.id,
            overall_percent: Math.round(overallPercent),
          });
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      matches_count: allMatches.length,
      matches: allMatches 
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
