// Algorytm dopasowania kandydat ↔ pracodawca

import { getLevel, FeedbackLevel } from './feedbackData';

export interface CandidateProfile {
  id: string;
  userId: string;
  // Wyniki kompetencji (średnie 1-5)
  competencyScores: {
    komunikacja: number;
    myslenie_analityczne: number;
    out_of_the_box: number;
    determinacja: number;
    adaptacja: number;
  };
  // Wyniki kultury (średnie 1-5)
  cultureScores: Record<string, number>;
  // Dane dodatkowe
  additionalData: {
    industry: string;
    experience: string;
    positionLevel: string;
    wantsToChangeIndustry: string;
  };
  testsCompleted: boolean;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName?: string;
  // Wymagania kompetencji (ważność 1-5)
  competencyRequirements: {
    komunikacja: number;
    myslenie_analityczne: number;
    out_of_the_box: number;
    determinacja: number;
    adaptacja: number;
  };
  // Kultura organizacji (średnie 1-5)
  cultureScores: Record<string, number>;
  // Dane dodatkowe
  additionalData: {
    industry: string;
    requiredExperience: string;
    positionLevel: string;
    acceptedIndustries: string[];
    roleDescription: string;
    roleResponsibilities: string;
  };
  profileCompleted: boolean;
}

export interface MatchResult {
  candidateId: string;
  employerId: string;
  overallPercent: number;
  competencePercent: number;
  culturePercent: number;
  extraPercent: number;
  competenceDetails: {
    competency: string;
    candidateScore: number;
    employerRequirement: number;
    matchPercent: number;
    status: 'excellent' | 'good' | 'needs_work';
  }[];
  cultureDetails: {
    dimension: string;
    candidateScore: number;
    employerScore: number;
    matchPercent: number;
    status: 'aligned' | 'partial' | 'divergent';
  }[];
  extraDetails: {
    field: string;
    matched: boolean;
  }[];
  strengths: string[];
  risks: string[];
}

// Wagi dopasowania
const WEIGHTS = {
  competence: 0.50,
  culture: 0.35,
  extra: 0.15,
};

// Oblicz dopasowanie dla pojedynczego wymiaru (skala 0-1)
const calculateDimensionMatch = (candidateValue: number, employerValue: number): number => {
  const diff = Math.abs(candidateValue - employerValue);
  return Math.max(0, 1 - diff / 4); // max różnica w skali 1-5 to 4
};

// Oblicz dopasowanie kompetencji
const calculateCompetenceMatch = (
  candidate: CandidateProfile,
  employer: EmployerProfile
): { percent: number; details: MatchResult['competenceDetails'] } => {
  const competencies = ['komunikacja', 'myslenie_analityczne', 'out_of_the_box', 'determinacja', 'adaptacja'] as const;
  
  const details: MatchResult['competenceDetails'] = competencies.map(comp => {
    const candidateScore = candidate.competencyScores[comp];
    const employerRequirement = employer.competencyRequirements[comp];
    const matchScore = calculateDimensionMatch(candidateScore, employerRequirement);
    const matchPercent = matchScore * 100;
    
    let status: 'excellent' | 'good' | 'needs_work';
    if (matchPercent >= 80) status = 'excellent';
    else if (matchPercent >= 60) status = 'good';
    else status = 'needs_work';
    
    return {
      competency: comp,
      candidateScore,
      employerRequirement,
      matchPercent,
      status,
    };
  });
  
  const avgScore = details.reduce((sum, d) => sum + d.matchPercent, 0) / details.length;
  
  return { percent: avgScore, details };
};

// Oblicz dopasowanie kultury
const calculateCultureMatch = (
  candidate: CandidateProfile,
  employer: EmployerProfile
): { percent: number; details: MatchResult['cultureDetails'] } => {
  const dimensions = Object.keys(candidate.cultureScores);
  
  const details: MatchResult['cultureDetails'] = dimensions.map(dim => {
    const candidateScore = candidate.cultureScores[dim] || 3;
    const employerScore = employer.cultureScores[dim] || 3;
    const matchScore = calculateDimensionMatch(candidateScore, employerScore);
    const matchPercent = matchScore * 100;
    
    let status: 'aligned' | 'partial' | 'divergent';
    if (matchPercent >= 75) status = 'aligned';
    else if (matchPercent >= 50) status = 'partial';
    else status = 'divergent';
    
    return {
      dimension: dim,
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

// Oblicz dopasowanie dodatkowe
const calculateExtraMatch = (
  candidate: CandidateProfile,
  employer: EmployerProfile
): { percent: number; details: MatchResult['extraDetails'] } => {
  const details: MatchResult['extraDetails'] = [];
  
  // Branża
  const industryMatch = 
    candidate.additionalData.industry === employer.additionalData.industry ||
    employer.additionalData.acceptedIndustries.includes(candidate.additionalData.industry);
  details.push({ field: 'Branża', matched: industryMatch });
  
  // Doświadczenie
  const experienceMatch = candidate.additionalData.experience === employer.additionalData.requiredExperience;
  details.push({ field: 'Doświadczenie', matched: experienceMatch });
  
  // Poziom stanowiska
  const positionMatch = candidate.additionalData.positionLevel === employer.additionalData.positionLevel;
  details.push({ field: 'Poziom stanowiska', matched: positionMatch });
  
  // Gotowość do zmiany branży (jeśli branża nie pasuje, ale kandydat jest otwarty)
  const openToChange = 
    candidate.additionalData.wantsToChangeIndustry === 'Tak' ||
    candidate.additionalData.wantsToChangeIndustry === 'Jestem otwarty/a';
  const industryFlexibility = !industryMatch && openToChange;
  details.push({ field: 'Elastyczność branżowa', matched: industryFlexibility || industryMatch });
  
  const matchedCount = details.filter(d => d.matched).length;
  const percent = (matchedCount / details.length) * 100;
  
  return { percent, details };
};

// Generuj opis mocnych stron
const generateStrengths = (result: MatchResult): string[] => {
  const strengths: string[] = [];
  
  // Top kompetencje
  const topCompetencies = result.competenceDetails
    .filter(d => d.status === 'excellent')
    .slice(0, 2);
  
  topCompetencies.forEach(comp => {
    const competencyNames: Record<string, string> = {
      komunikacja: 'Komunikacja',
      myslenie_analityczne: 'Myślenie analityczne',
      out_of_the_box: 'Kreatywność',
      determinacja: 'Determinacja',
      adaptacja: 'Adaptacja do zmian',
    };
    strengths.push(`Doskonałe dopasowanie w obszarze: ${competencyNames[comp.competency]}`);
  });
  
  // Kultura
  const alignedCulture = result.cultureDetails.filter(d => d.status === 'aligned');
  if (alignedCulture.length >= 3) {
    strengths.push('Wysoka zgodność wartości i kultury organizacyjnej');
  }
  
  // Dodatkowe
  const matchedExtras = result.extraDetails.filter(d => d.matched);
  if (matchedExtras.length === result.extraDetails.length) {
    strengths.push('Pełna zgodność wymagań formalnych (branża, doświadczenie, poziom)');
  }
  
  return strengths;
};

// Generuj opis ryzyk
const generateRisks = (result: MatchResult): string[] => {
  const risks: string[] = [];
  
  // Słabe kompetencje
  const weakCompetencies = result.competenceDetails
    .filter(d => d.status === 'needs_work')
    .slice(0, 2);
  
  weakCompetencies.forEach(comp => {
    const competencyNames: Record<string, string> = {
      komunikacja: 'Komunikacja',
      myslenie_analityczne: 'Myślenie analityczne',
      out_of_the_box: 'Kreatywność',
      determinacja: 'Determinacja',
      adaptacja: 'Adaptacja do zmian',
    };
    risks.push(`Warto omówić na rozmowie: ${competencyNames[comp.competency]}`);
  });
  
  // Rozbieżności kulturowe
  const divergentCulture = result.cultureDetails.filter(d => d.status === 'divergent');
  if (divergentCulture.length > 0) {
    risks.push('Istnieją rozbieżności w oczekiwaniach dotyczących kultury pracy');
  }
  
  return risks;
};

// Główna funkcja dopasowania
export const calculateMatch = (
  candidate: CandidateProfile,
  employer: EmployerProfile
): MatchResult => {
  const competence = calculateCompetenceMatch(candidate, employer);
  const culture = calculateCultureMatch(candidate, employer);
  const extra = calculateExtraMatch(candidate, employer);
  
  const overallPercent = 
    WEIGHTS.competence * competence.percent +
    WEIGHTS.culture * culture.percent +
    WEIGHTS.extra * extra.percent;
  
  const result: MatchResult = {
    candidateId: candidate.id,
    employerId: employer.id,
    overallPercent: Math.round(overallPercent),
    competencePercent: Math.round(competence.percent),
    culturePercent: Math.round(culture.percent),
    extraPercent: Math.round(extra.percent),
    competenceDetails: competence.details,
    cultureDetails: culture.details,
    extraDetails: extra.details,
    strengths: [],
    risks: [],
  };
  
  result.strengths = generateStrengths(result);
  result.risks = generateRisks(result);
  
  return result;
};

// Oblicz średnią z odpowiedzi
export const calculateAverage = (
  answers: Record<string, number>,
  questionIds: string[],
  reversedIds: string[] = []
): number => {
  let sum = 0;
  let count = 0;
  
  questionIds.forEach(id => {
    if (answers[id] !== undefined) {
      const value = reversedIds.includes(id) ? (6 - answers[id]) : answers[id];
      sum += value;
      count++;
    }
  });
  
  return count > 0 ? sum / count : 0;
};
