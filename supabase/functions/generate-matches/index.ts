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

interface EmployerData {
  user_id: string;
  req_komunikacja: number | null;
  req_myslenie_analityczne: number | null;
  req_out_of_the_box: number | null;
  req_determinacja: number | null;
  req_adaptacja: number | null;
  culture_relacja_wspolpraca: number | null;
  culture_elastycznosc_innowacyjnosc: number | null;
  culture_wyniki_cele: number | null;
  culture_stabilnosc_struktura: number | null;
  culture_autonomia_styl_pracy: number | null;
  culture_wlb_dobrostan: number | null;
  industry: string | null;
  required_experience: string | null;
  position_level: string | null;
  accepted_industries: string[] | null;
}

// Calculate dimension match (scale 0-1)
const calculateDimensionMatch = (candidateValue: number, employerValue: number): number => {
  const diff = Math.abs(candidateValue - employerValue);
  return Math.max(0, 1 - diff / 4);
};

// Calculate competence match
const calculateCompetenceMatch = (candidate: CandidateData, employer: EmployerData) => {
  const competencies = [
    { key: 'komunikacja', cKey: 'komunikacja_score', eKey: 'req_komunikacja' },
    { key: 'myslenie_analityczne', cKey: 'myslenie_analityczne_score', eKey: 'req_myslenie_analityczne' },
    { key: 'out_of_the_box', cKey: 'out_of_the_box_score', eKey: 'req_out_of_the_box' },
    { key: 'determinacja', cKey: 'determinacja_score', eKey: 'req_determinacja' },
    { key: 'adaptacja', cKey: 'adaptacja_score', eKey: 'req_adaptacja' },
  ] as const;

  const details = competencies.map(comp => {
    const candidateScore = (candidate as any)[comp.cKey] || 3;
    const employerReq = (employer as any)[comp.eKey] || 3;
    const matchScore = calculateDimensionMatch(candidateScore, employerReq);
    const matchPercent = matchScore * 100;
    
    let status: 'excellent' | 'good' | 'needs_work';
    if (matchPercent >= 80) status = 'excellent';
    else if (matchPercent >= 60) status = 'good';
    else status = 'needs_work';
    
    return {
      competency: comp.key,
      candidateScore,
      employerRequirement: employerReq,
      matchPercent,
      status,
    };
  });
  
  const avgScore = details.reduce((sum, d) => sum + d.matchPercent, 0) / details.length;
  return { percent: avgScore, details };
};

// Calculate culture match
const calculateCultureMatch = (candidate: CandidateData, employer: EmployerData) => {
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
const calculateExtraMatch = (candidate: CandidateData, employer: EmployerData) => {
  const details: { field: string; matched: boolean }[] = [];
  
  // Industry match
  const industryMatch = 
    candidate.industry === employer.industry ||
    (employer.accepted_industries?.includes(candidate.industry || '') ?? false);
  details.push({ field: 'Branża', matched: industryMatch });
  
  // Experience match
  const experienceMatch = candidate.experience === employer.required_experience;
  details.push({ field: 'Doświadczenie', matched: experienceMatch });
  
  // Position level match
  const positionMatch = candidate.position_level === employer.position_level;
  details.push({ field: 'Poziom stanowiska', matched: positionMatch });
  
  // Industry flexibility
  const openToChange = 
    candidate.wants_to_change_industry === 'Tak' ||
    candidate.wants_to_change_industry === 'Jestem otwarty/a';
  const industryFlexibility = !industryMatch && openToChange;
  details.push({ field: 'Elastyczność branżowa', matched: industryFlexibility || industryMatch });
  
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

// Weights
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { employer_user_id } = await req.json();

    if (!employer_user_id) {
      return new Response(JSON.stringify({ error: 'employer_user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get employer data
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

    // Get all candidates with completed tests
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

    const matches: any[] = [];
    const newMatchCandidates: { user_id: string; overall_percent: number }[] = [];

    for (const candidate of candidates || []) {
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('match_results')
        .select('id')
        .eq('employer_user_id', employer_user_id)
        .eq('candidate_user_id', candidate.user_id)
        .single();

      const isNewMatch = !existingMatch;

      // Calculate matches
      const competence = calculateCompetenceMatch(candidate as CandidateData, employer as EmployerData);
      const culture = calculateCultureMatch(candidate as CandidateData, employer as EmployerData);
      const extra = calculateExtraMatch(candidate as CandidateData, employer as EmployerData);
      
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

      // Upsert match result
      const { error: upsertError } = await supabase
        .from('match_results')
        .upsert({
          employer_user_id,
          candidate_user_id: candidate.user_id,
          overall_percent: Math.round(overallPercent),
          competence_percent: Math.round(competence.percent),
          culture_percent: Math.round(culture.percent),
          extra_percent: Math.round(extra.percent),
          match_details: matchDetails,
          status: 'pending',
        }, {
          onConflict: 'employer_user_id,candidate_user_id',
        });

      if (!upsertError) {
        matches.push({
          candidate_user_id: candidate.user_id,
          overall_percent: Math.round(overallPercent),
        });

        // Track new matches for email notifications
        if (isNewMatch) {
          newMatchCandidates.push({
            user_id: candidate.user_id,
            overall_percent: Math.round(overallPercent),
          });
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
          .single();

        if (candidateEmail) {
          // Call send-match-notification function with detailed info
          const notificationResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-match-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
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
                role_description: employer.role_description,
                role_responsibilities: employer.role_responsibilities,
                industry: employer.industry,
                position_level: employer.position_level,
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

      if (employerEmail) {
        const summaryResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-employer-match-summary`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
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
      matches_count: matches.length,
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
