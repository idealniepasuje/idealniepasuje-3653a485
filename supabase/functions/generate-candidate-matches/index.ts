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
  role_description: string | null;
  role_responsibilities: string | null;
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

// Calculate extra match using job offer requirements
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
  const candidateExp = parseInt(candidate.experience || '0') || 0;
  const requiredExp = parseInt(offer.required_experience || '0') || 0;
  const experienceMatch = candidateExp >= requiredExp;
  details.push({ 
    field: 'Doświadczenie', 
    matched: experienceMatch,
    candidateValue: candidate.experience,
    employerValue: offer.required_experience,
  });
  
  // Position level match
  const positionLevelOrder = ['junior', 'mid', 'senior', 'lead', 'manager', 'director'];
  const candidateLevelIndex = positionLevelOrder.indexOf(candidate.position_level || '');
  const employerLevelIndex = positionLevelOrder.indexOf(offer.position_level || '');
  const positionMatch = candidate.position_level === offer.position_level || 
    (candidateLevelIndex >= employerLevelIndex && employerLevelIndex !== -1);
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

    for (const offer of jobOffers) {
      const employerProfile = employerProfileMap.get(offer.user_id);
      
      if (!employerProfile) {
        console.log(`No employer profile found for offer ${offer.id}, skipping`);
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
          candidate_user_id,
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
        console.error(`Failed to upsert match for offer ${offer.id}:`, upsertError);
      } else {
        matches.push({
          employer_user_id: offer.user_id,
          job_offer_id: offer.id,
          job_offer_title: offer.title,
          overall_percent: Math.round(overallPercent),
          competence_percent: Math.round(competence.percent),
          culture_percent: Math.round(culture.percent),
          extra_percent: Math.round(extra.percent),
          role_description: offer.role_description,
          role_responsibilities: offer.role_responsibilities,
          industry: offer.industry,
          position_level: offer.position_level,
          company_name: employerProfile.company_name,
        });
      }
    }

    // Send email notifications to candidate
    if (matches.length > 0) {
      // Get candidate email
      const { data: candidateAuth } = await supabase.auth.admin.getUserById(candidate_user_id);
      const candidateEmail = candidateAuth?.user?.email;

      if (candidateEmail) {
        // Send notification for the best match
        const bestMatch = matches.reduce((best, current) => 
          current.overall_percent > best.overall_percent ? current : best
        , matches[0]);
        
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
    } else {
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
