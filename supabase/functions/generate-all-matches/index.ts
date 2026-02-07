import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CandidateData {
  user_id: string;
  komunikacja_score: number | null;
  myslenie_analityczne_score: number | null;
  out_of_the_box_score: number | null;
  determinacja_score: number | null;
  adaptacja_score: number | null;
  culture_relacja_wspolpraca: number | null;
  culture_elastycznosc_innowacyjnosc: number | null;
  culture_wyniki_cele: number | null;
  culture_stabilnosc_struktura: number | null;
  culture_autonomia_styl_pracy: number | null;
  culture_wlb_dobrostan: number | null;
  industry: string | null;
  experience: string | null;
  position_level: string | null;
  wants_to_change_industry: string | null;
}

interface JobOfferData {
  id: string;
  user_id: string;
  title: string;
  req_komunikacja: number | null;
  req_myslenie_analityczne: number | null;
  req_out_of_the_box: number | null;
  req_determinacja: number | null;
  req_adaptacja: number | null;
  industry: string | null;
  required_experience: string | null;
  position_level: string | null;
  accepted_industries: string[] | null;
}

interface EmployerProfileData {
  user_id: string;
  company_name: string | null;
  culture_relacja_wspolpraca: number | null;
  culture_elastycznosc_innowacyjnosc: number | null;
  culture_wyniki_cele: number | null;
  culture_stabilnosc_struktura: number | null;
  culture_autonomia_styl_pracy: number | null;
  culture_wlb_dobrostan: number | null;
}

// Calculate dimension match (scale 0-1)
const calculateDimensionMatch = (candidateValue: number, employerValue: number): number => {
  const diff = Math.abs(candidateValue - employerValue);
  return Math.max(0, 1 - diff / 4);
};

// Calculate competence match using job offer requirements
const calculateCompetenceMatch = (candidate: CandidateData, offer: JobOfferData) => {
  const competencies = [
    { key: 'komunikacja', cKey: 'komunikacja_score', eKey: 'req_komunikacja' },
    { key: 'myslenie_analityczne', cKey: 'myslenie_analityczne_score', eKey: 'req_myslenie_analityczne' },
    { key: 'out_of_the_box', cKey: 'out_of_the_box_score', eKey: 'req_out_of_the_box' },
    { key: 'determinacja', cKey: 'determinacja_score', eKey: 'req_determinacja' },
    { key: 'adaptacja', cKey: 'adaptacja_score', eKey: 'req_adaptacja' },
  ] as const;

  const details = competencies.map(comp => {
    const candidateScore = (candidate as any)[comp.cKey] || 3;
    const offerReq = (offer as any)[comp.eKey] || 3;
    const matchScore = calculateDimensionMatch(candidateScore, offerReq);
    const matchPercent = matchScore * 100;
    
    let status: 'excellent' | 'good' | 'needs_work';
    if (matchPercent >= 80) status = 'excellent';
    else if (matchPercent >= 60) status = 'good';
    else status = 'needs_work';
    
    return {
      competency: comp.key,
      candidateScore,
      employerRequirement: offerReq,
      matchPercent,
      status,
    };
  });
  
  const avgScore = details.reduce((sum, d) => sum + d.matchPercent, 0) / details.length;
  return { percent: avgScore, details };
};

// Calculate culture match using employer profile
const calculateCultureMatch = (candidate: CandidateData, employer: EmployerProfileData) => {
  const dimensions = [
    'culture_relacja_wspolpraca',
    'culture_elastycznosc_innowacyjnosc',
    'culture_wyniki_cele',
    'culture_stabilnosc_struktura',
    'culture_autonomia_styl_pracy',
    'culture_wlb_dobrostan',
  ] as const;

  const details = dimensions.map(dim => {
    const candidateScore = (candidate as any)[dim] || 3;
    const employerScore = (employer as any)[dim] || 3;
    const matchScore = calculateDimensionMatch(candidateScore, employerScore);
    const matchPercent = matchScore * 100;
    
    let status: 'aligned' | 'partial' | 'divergent';
    if (matchPercent >= 75) status = 'aligned';
    else if (matchPercent >= 50) status = 'partial';
    else status = 'divergent';
    
    return {
      dimension: dim.replace('culture_', ''),
      candidateScore,
      employerScore,
      matchPercent,
      status,
    };
  });
  
  const avgScore = details.length > 0
    ? details.reduce((sum, d) => sum + d.matchPercent, 0) / details.length
    : 50;
  
  return { percent: avgScore, details };
};

// Calculate extra match
const calculateExtraMatch = (candidate: CandidateData, offer: JobOfferData) => {
  const details: { field: string; matched: boolean }[] = [];
  
  const industryMatch = 
    candidate.industry === offer.industry ||
    (offer.accepted_industries?.includes(candidate.industry || '') ?? false);
  details.push({ field: 'Branża', matched: industryMatch });
  
  const candidateExp = parseInt(candidate.experience || '0') || 0;
  const requiredExp = parseInt(offer.required_experience || '0') || 0;
  const experienceMatch = candidateExp >= requiredExp;
  details.push({ field: 'Doświadczenie', matched: experienceMatch });
  
  const positionLevelOrder = ['junior', 'mid', 'senior', 'lead', 'manager', 'director'];
  const candidateLevelIndex = positionLevelOrder.indexOf(candidate.position_level || '');
  const employerLevelIndex = positionLevelOrder.indexOf(offer.position_level || '');
  const positionMatch = candidate.position_level === offer.position_level || 
    (candidateLevelIndex >= employerLevelIndex && employerLevelIndex !== -1);
  details.push({ field: 'Poziom stanowiska', matched: positionMatch });
  
  const openToChange = 
    candidate.wants_to_change_industry === 'Tak' ||
    candidate.wants_to_change_industry === 'Jestem otwarty/a';
  details.push({ field: 'Elastyczność branżowa', matched: !industryMatch && openToChange || industryMatch });
  
  const matchedCount = details.filter(d => d.matched).length;
  const percent = (matchedCount / details.length) * 100;
  
  return { percent, details };
};

// Generate strengths
const generateStrengths = (competenceDetails: any[], cultureDetails: any[], extraDetails: any[]): string[] => {
  const strengths: string[] = [];
  const competencyNames: Record<string, string> = {
    komunikacja: 'Komunikacja',
    myslenie_analityczne: 'Myślenie analityczne',
    out_of_the_box: 'Kreatywność',
    determinacja: 'Determinacja',
    adaptacja: 'Adaptacja do zmian',
  };
  
  const topCompetencies = competenceDetails.filter(d => d.status === 'excellent').slice(0, 2);
  topCompetencies.forEach(comp => {
    strengths.push(`Doskonałe dopasowanie: ${competencyNames[comp.competency] || comp.competency}`);
  });
  
  const alignedCulture = cultureDetails.filter(d => d.status === 'aligned');
  if (alignedCulture.length >= 3) {
    strengths.push('Wysoka zgodność wartości i kultury organizacyjnej');
  }
  
  const matchedExtras = extraDetails.filter(d => d.matched);
  if (matchedExtras.length === extraDetails.length) {
    strengths.push('Pełna zgodność wymagań formalnych');
  }
  
  return strengths;
};

// Generate risks
const generateRisks = (competenceDetails: any[], cultureDetails: any[]): string[] => {
  const risks: string[] = [];
  const competencyNames: Record<string, string> = {
    komunikacja: 'Komunikacja',
    myslenie_analityczne: 'Myślenie analityczne',
    out_of_the_box: 'Kreatywność',
    determinacja: 'Determinacja',
    adaptacja: 'Adaptacja do zmian',
  };
  
  const weakCompetencies = competenceDetails.filter(d => d.status === 'needs_work').slice(0, 2);
  weakCompetencies.forEach(comp => {
    risks.push(`Warto omówić: ${competencyNames[comp.competency] || comp.competency}`);
  });
  
  const divergentCulture = cultureDetails.filter(d => d.status === 'divergent');
  if (divergentCulture.length > 0) {
    risks.push('Rozbieżności w oczekiwaniach dot. kultury pracy');
  }
  
  return risks;
};

const WEIGHTS = {
  competence: 0.50,
  culture: 0.35,
  extra: 0.15,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // This function uses service role - validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all candidates with completed tests
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidate_test_results')
      .select('*')
      .eq('all_tests_completed', true);

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
      .eq('is_active', true);

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

    for (const candidate of candidates) {
      for (const offer of jobOffers) {
        const employerProfile = employerProfileMap.get(offer.user_id);
        
        if (!employerProfile) {
          continue;
        }

        const competence = calculateCompetenceMatch(candidate as CandidateData, offer as JobOfferData);
        const culture = calculateCultureMatch(candidate as CandidateData, employerProfile as EmployerProfileData);
        const extra = calculateExtraMatch(candidate as CandidateData, offer as JobOfferData);
        
        const overallPercent = 
          WEIGHTS.competence * competence.percent +
          WEIGHTS.culture * culture.percent +
          WEIGHTS.extra * extra.percent;

        const strengths = generateStrengths(competence.details, culture.details, extra.details);
        const risks = generateRisks(competence.details, culture.details);

        const matchDetails = {
          competenceDetails: competence.details,
          cultureDetails: culture.details,
          extraDetails: extra.details,
          strengths,
          risks,
        };

        const { error: upsertError } = await supabase
          .from('match_results')
          .upsert({
            employer_user_id: offer.user_id,
            candidate_user_id: candidate.user_id,
            job_offer_id: offer.id,
            overall_percent: Math.round(overallPercent),
            competence_percent: Math.round(competence.percent),
            culture_percent: Math.round(culture.percent),
            extra_percent: Math.round(extra.percent),
            match_details: matchDetails,
            status: 'pending',
          }, {
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
      offers_processed: jobOffers.length,
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
