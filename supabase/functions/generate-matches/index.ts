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
  no_experience_required: boolean | null;
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

// Calculate competence match - using job offer requirements
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

// Calculate culture match - using employer profile culture
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

// Calculate extra match - using job offer requirements
const calculateExtraMatch = (candidate: CandidateData, offer: JobOfferData) => {
  const details: { 
    field: string; 
    matched: boolean;
    candidateValue?: string | null;
    employerValue?: string | null;
    acceptedValues?: string[];
  }[] = [];
  
  // Industry match
  const industryMatch = 
    candidate.industry === offer.industry ||
    (offer.accepted_industries?.includes(candidate.industry || '') ?? false);
  details.push({ 
    field: 'Branża', 
    matched: industryMatch,
    candidateValue: candidate.industry,
    employerValue: offer.industry,
    acceptedValues: offer.accepted_industries || [],
  });
  
  // Experience match - compare years
  if (offer.no_experience_required) {
    details.push({ 
      field: 'Doświadczenie', 
      matched: true,
      candidateValue: candidate.experience,
      employerValue: 'Nie wymagane',
    });
  } else {
    const candidateExp = parseInt(candidate.experience || '0') || 0;
    const requiredExp = parseInt(offer.required_experience || '0') || 0;
    const experienceMatch = candidateExp >= requiredExp;
    details.push({ 
      field: 'Doświadczenie', 
      matched: experienceMatch,
      candidateValue: candidate.experience,
      employerValue: offer.required_experience,
    });
  }
  
  // Position level match
  const positionLevelOrder = ['junior', 'mid', 'senior', 'lead', 'manager', 'director'];
  const candidateLevelIndex = positionLevelOrder.indexOf(candidate.position_level || '');
  const offerLevelIndex = positionLevelOrder.indexOf(offer.position_level || '');
  const positionMatch = candidate.position_level === offer.position_level || 
    (candidateLevelIndex >= offerLevelIndex && offerLevelIndex !== -1);
  details.push({ 
    field: 'Poziom stanowiska', 
    matched: positionMatch,
    candidateValue: candidate.position_level,
    employerValue: offer.position_level,
  });
  
  // Industry flexibility
  const openToChange = 
    candidate.wants_to_change_industry === 'Tak' ||
    candidate.wants_to_change_industry === 'Jestem otwarty/a';
  const industryFlexibility = !industryMatch && openToChange;
  details.push({ 
    field: 'Elastyczność branżowa', 
    matched: industryFlexibility || industryMatch,
    candidateValue: openToChange ? 'Tak' : 'Nie',
    employerValue: offer.accepted_industries && offer.accepted_industries.length > 0 ? 'Akceptuje inne branże' : 'Tylko wybrana branża',
  });
  
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

    const allMatches: any[] = [];
    const newMatchCandidates: { user_id: string; overall_percent: number; job_offer_id: string; offer_title: string }[] = [];

    // Generate matches for each job offer
    for (const offer of jobOffers) {
      for (const candidate of candidates || []) {
        // Check if match already exists for this offer-candidate pair
        const { data: existingMatch } = await supabase
          .from('match_results')
          .select('id')
          .eq('employer_user_id', employer_user_id)
          .eq('candidate_user_id', candidate.user_id)
          .eq('job_offer_id', offer.id)
          .single();

        const isNewMatch = !existingMatch;

        // Calculate matches using offer requirements + employer culture
        const competence = calculateCompetenceMatch(candidate as CandidateData, offer as JobOfferData);
        const culture = calculateCultureMatch(candidate as CandidateData, employer as EmployerProfileData);
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

        // Upsert match result with job_offer_id
        const { error: upsertError } = await supabase
          .from('match_results')
          .upsert({
            employer_user_id,
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

        if (!upsertError) {
          allMatches.push({
            candidate_user_id: candidate.user_id,
            job_offer_id: offer.id,
            overall_percent: Math.round(overallPercent),
          });

          // Track new matches for email notifications
          if (isNewMatch) {
            newMatchCandidates.push({
              user_id: candidate.user_id,
              overall_percent: Math.round(overallPercent),
              job_offer_id: offer.id,
              offer_title: offer.title,
            });
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
