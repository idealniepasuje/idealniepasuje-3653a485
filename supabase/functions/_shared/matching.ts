// ============================================================
// WSPÓLNY MODUŁ ALGORYTMU DOPASOWANIA kandydat ↔ oferta
// Jedyne źródło prawdy. Używany przez wszystkie edge functions
// oraz (przez re-eksport w src/lib/matching.ts) przez frontend.
// ============================================================

export interface CandidateData {
  user_id?: string;
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
  work_mode: string | null;
  city: string | null;
}

export interface JobOfferData {
  id?: string;
  title?: string;
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
  work_mode: string | null;
  city: string | null;
}

export interface EmployerCultureData {
  culture_completed?: boolean | null;
  culture_relacja_wspolpraca: number | null;
  culture_elastycznosc_innowacyjnosc: number | null;
  culture_wyniki_cele: number | null;
  culture_stabilnosc_struktura: number | null;
  culture_autonomia_styl_pracy: number | null;
  culture_wlb_dobrostan: number | null;
}

export interface CompetenceDetail {
  competency: string;
  candidateScore: number;
  employerRequirement: number;
  matchPercent: number;
  status: 'excellent' | 'good' | 'needs_work';
}

export interface CultureDetail {
  dimension: string;
  candidateScore: number;
  employerScore: number;
  matchPercent: number;
  status: 'aligned' | 'partial' | 'divergent';
}

export interface ExtraDetail {
  field: string;
  key: string;
  matched: boolean;
  weight: number;
  candidateValue?: string | null;
  employerValue?: string | null;
  acceptedValues?: string[];
}

export interface MatchOutcome {
  overallPercent: number;
  competencePercent: number;
  culturePercent: number;
  extraPercent: number;
  competenceDetails: CompetenceDetail[];
  cultureDetails: CultureDetail[];
  extraDetails: ExtraDetail[];
  appliedWeights: { competence: number; culture: number; extra: number };
  strengths: string[];
  risks: string[];
}

// ---------- ETAP 2: główne wagi ----------
export const WEIGHTS = {
  competence: 0.5,
  culture: 0.35,
  extra: 0.15,
};

// różnica 0→100%, 1→75%, 2→50%, 3→25%, 4→0%
export const dimensionMatchPercent = (candidateValue: number, employerValue: number): number => {
  const diff = Math.abs(candidateValue - employerValue);
  return Math.max(0, Math.min(100, 100 - diff * 25));
};

const isNum = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v);

// ---------- ETAP 3: kompetencje ----------
const COMPETENCIES = [
  { key: 'komunikacja', cKey: 'komunikacja_score', eKey: 'req_komunikacja' },
  { key: 'myslenie_analityczne', cKey: 'myslenie_analityczne_score', eKey: 'req_myslenie_analityczne' },
  { key: 'out_of_the_box', cKey: 'out_of_the_box_score', eKey: 'req_out_of_the_box' },
  { key: 'determinacja', cKey: 'determinacja_score', eKey: 'req_determinacja' },
  { key: 'adaptacja', cKey: 'adaptacja_score', eKey: 'req_adaptacja' },
] as const;

export const calculateCompetenceMatch = (
  candidate: CandidateData,
  offer: JobOfferData,
): { percent: number | null; details: CompetenceDetail[] } => {
  const details: CompetenceDetail[] = [];

  for (const comp of COMPETENCIES) {
    const candidateScore = (candidate as any)[comp.cKey];
    const employerRequirement = (offer as any)[comp.eKey];
    // ETAP 9: brak danych = pomijamy, nie podstawiamy 3
    if (!isNum(candidateScore) || !isNum(employerRequirement)) continue;

    const matchPercent = dimensionMatchPercent(candidateScore, employerRequirement);
    const status: CompetenceDetail['status'] =
      matchPercent >= 80 ? 'excellent' : matchPercent >= 60 ? 'good' : 'needs_work';

    details.push({ competency: comp.key, candidateScore, employerRequirement, matchPercent, status });
  }

  if (details.length === 0) return { percent: null, details };
  return { percent: details.reduce((s, d) => s + d.matchPercent, 0) / details.length, details };
};

// ---------- ETAP 4: kultura ----------
const CULTURE_DIMENSIONS = [
  'culture_relacja_wspolpraca',
  'culture_elastycznosc_innowacyjnosc',
  'culture_wyniki_cele',
  'culture_stabilnosc_struktura',
  'culture_autonomia_styl_pracy',
  'culture_wlb_dobrostan',
] as const;

export const calculateCultureMatch = (
  candidate: CandidateData,
  employer: EmployerCultureData | null | undefined,
): { percent: number | null; details: CultureDetail[] } => {
  if (!employer) return { percent: null, details: [] };

  const details: CultureDetail[] = [];
  for (const dim of CULTURE_DIMENSIONS) {
    const candidateScore = (candidate as any)[dim];
    const employerScore = (employer as any)[dim];
    if (!isNum(candidateScore) || !isNum(employerScore)) continue;

    const matchPercent = dimensionMatchPercent(candidateScore, employerScore);
    const status: CultureDetail['status'] =
      matchPercent >= 75 ? 'aligned' : matchPercent >= 50 ? 'partial' : 'divergent';

    details.push({ dimension: dim.replace('culture_', ''), candidateScore, employerScore, matchPercent, status });
  }

  if (details.length === 0) return { percent: null, details };
  return { percent: details.reduce((s, d) => s + d.matchPercent, 0) / details.length, details };
};

// ---------- ETAP 5-8: dane dodatkowe ----------

// "0–2", "2-4", "10+" → dolna granica przedziału
export const parseMinYears = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const m = String(value).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

export const POSITION_LEVELS_PL = [
  'Praktykant lub stażysta',
  'Asystent',
  'Młodszy specjalista',
  'Specjalista',
  'Starszy specjalista',
  'Ekspert',
  'Kierownik lub koordynator',
  'Menadżer',
  'Dyrektor',
  'Prezes',
];

export const POSITION_LEVELS_EN = [
  'Intern or Trainee',
  'Assistant',
  'Junior Specialist',
  'Specialist',
  'Senior Specialist',
  'Expert',
  'Team Leader or Coordinator',
  'Manager',
  'Director',
  'CEO / President',
];

export const positionLevelIndex = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const pl = POSITION_LEVELS_PL.indexOf(value);
  if (pl >= 0) return pl;
  const en = POSITION_LEVELS_EN.indexOf(value);
  if (en >= 0) return en;
  return null;
};

// ETAP 7: rzeczywista zgodność trybu pracy
const WORK_MODE_MATRIX: Record<string, Record<string, boolean>> = {
  remote: { remote: true, hybrid: true, onsite: false },
  hybrid: { remote: false, hybrid: true, onsite: true },
  onsite: { remote: false, hybrid: false, onsite: true },
};

export const workModeCompatible = (candidateMode: string, offerMode: string): boolean =>
  WORK_MODE_MATRIX[offerMode]?.[candidateMode] ?? false;

const normalizeCity = (v: string | null | undefined) => (v || '').trim().toLowerCase();

export const calculateExtraMatch = (
  candidate: CandidateData,
  offer: JobOfferData,
): { percent: number | null; details: ExtraDetail[] } => {
  const details: ExtraDetail[] = [];

  // --- Branża (TAK/NIE, liczona dokładnie raz, bez punktów za otwartość) ---
  const accepted = Array.isArray(offer.accepted_industries) ? offer.accepted_industries : [];
  const hasIndustryRequirement = !!offer.industry || accepted.length > 0;
  let industryCriterion: ExtraDetail | null = null;
  if (hasIndustryRequirement) {
    const industryMatched =
      !!candidate.industry &&
      (candidate.industry === offer.industry || accepted.includes(candidate.industry));
    industryCriterion = {
      field: 'Branża',
      key: 'industry',
      matched: industryMatched,
      weight: 0,
      candidateValue: candidate.industry,
      employerValue: offer.industry,
      acceptedValues: accepted,
    };
  }

  // --- Doświadczenie (TAK/NIE) ---
  let experienceCriterion: ExtraDetail | null = null;
  if (offer.no_experience_required) {
    experienceCriterion = {
      field: 'Doświadczenie',
      key: 'experience',
      matched: true,
      weight: 0,
      candidateValue: candidate.experience,
      employerValue: 'Nie wymagane',
    };
  } else {
    const required = parseMinYears(offer.required_experience);
    const candidateYears = parseMinYears(candidate.experience);
    if (required !== null) {
      experienceCriterion = {
        field: 'Doświadczenie',
        key: 'experience',
        matched: candidateYears !== null && candidateYears >= required,
        weight: 0,
        candidateValue: candidate.experience,
        employerValue: offer.required_experience,
      };
    }
  }

  // --- Poziom stanowiska (TAK/NIE, równy lub wyższy) ---
  let positionCriterion: ExtraDetail | null = null;
  const requiredLevel = positionLevelIndex(offer.position_level);
  if (requiredLevel !== null) {
    const candidateLevel = positionLevelIndex(candidate.position_level);
    positionCriterion = {
      field: 'Poziom stanowiska',
      key: 'position_level',
      matched: candidateLevel !== null && candidateLevel >= requiredLevel,
      weight: 0,
      candidateValue: candidate.position_level,
      employerValue: offer.position_level,
    };
  }

  // ETAP 6: hierarchia wewnątrz danych dodatkowych
  const employerAcceptsExtraIndustries =
    accepted.filter((i) => i && i !== offer.industry).length > 0;
  const rankedCore = employerAcceptsExtraIndustries
    ? [experienceCriterion, industryCriterion, positionCriterion]
    : [industryCriterion, experienceCriterion, positionCriterion];

  const RANK_WEIGHTS = [0.4, 0.3, 0.15];
  rankedCore.forEach((criterion, idx) => {
    if (!criterion) return;
    criterion.weight = RANK_WEIGHTS[idx];
    details.push(criterion);
  });

  // --- ETAP 7: tryb pracy ---
  if (candidate.work_mode && offer.work_mode) {
    details.push({
      field: 'Tryb pracy',
      key: 'work_mode',
      matched: workModeCompatible(candidate.work_mode, offer.work_mode),
      weight: 0.1,
      candidateValue: candidate.work_mode,
      employerValue: offer.work_mode,
    });
  }

  // --- ETAP 8: lokalizacja (tylko dla ofert hybrydowych/stacjonarnych) ---
  if (offer.work_mode && offer.work_mode !== 'remote' && offer.city && candidate.city) {
    details.push({
      field: 'Lokalizacja',
      key: 'city',
      matched: normalizeCity(offer.city) === normalizeCity(candidate.city),
      weight: 0.05,
      candidateValue: candidate.city,
      employerValue: offer.city,
    });
  }

  if (details.length === 0) return { percent: null, details };

  const totalWeight = details.reduce((s, d) => s + d.weight, 0);
  const matchedWeight = details.reduce((s, d) => s + (d.matched ? d.weight : 0), 0);
  const percent = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : null;

  return { percent, details };
};

// ---------- ETAP 10: mocne strony i ryzyka ----------
const COMPETENCY_NAMES: Record<string, string> = {
  komunikacja: 'Komunikacja',
  myslenie_analityczne: 'Myślenie analityczne',
  out_of_the_box: 'Kreatywność',
  determinacja: 'Determinacja',
  adaptacja: 'Adaptacja do zmian',
};

export const generateStrengths = (
  competenceDetails: CompetenceDetail[],
  cultureDetails: CultureDetail[],
  extraDetails: ExtraDetail[],
): string[] => {
  const strengths: string[] = [];

  competenceDetails
    .filter((d) => d.status === 'excellent')
    .slice(0, 2)
    .forEach((d) => strengths.push(`Doskonałe dopasowanie: ${COMPETENCY_NAMES[d.competency] || d.competency}`));

  if (cultureDetails.filter((d) => d.status === 'aligned').length >= 3) {
    strengths.push('Wysoka zgodność wartości i kultury organizacyjnej');
  }

  if (extraDetails.length > 0 && extraDetails.every((d) => d.matched)) {
    strengths.push('Kandydat spełnia wszystkie wymagania formalne');
  }

  return strengths;
};

export const generateRisks = (
  competenceDetails: CompetenceDetail[],
  cultureDetails: CultureDetail[],
  extraDetails: ExtraDetail[],
  cultureAvailable: boolean,
): string[] => {
  const risks: string[] = [];

  competenceDetails
    .filter((d) => d.status === 'needs_work')
    .slice(0, 2)
    .forEach((d) => risks.push(`Warto omówić: ${COMPETENCY_NAMES[d.competency] || d.competency}`));

  if (cultureDetails.some((d) => d.status === 'divergent')) {
    risks.push('Rozbieżności w oczekiwaniach dot. kultury pracy');
  }

  if (!cultureAvailable) {
    risks.push('Brak testu kultury organizacji — dopasowanie liczone bez tej części');
  }

  extraDetails
    .filter((d) => !d.matched)
    .forEach((d) => risks.push(`Niespełnione wymaganie: ${d.field}`));

  return risks;
};

// ---------- Główna funkcja ----------
export const calculateMatch = (
  candidate: CandidateData,
  offer: JobOfferData,
  employerCulture: EmployerCultureData | null | undefined,
): MatchOutcome => {
  const competence = calculateCompetenceMatch(candidate, offer);
  const cultureEnabled = !!employerCulture && employerCulture.culture_completed !== false;
  const culture = cultureEnabled
    ? calculateCultureMatch(candidate, employerCulture)
    : { percent: null as number | null, details: [] as CultureDetail[] };
  const extra = calculateExtraMatch(candidate, offer);

  // Proporcjonalne przeliczenie wag dla dostępnych sekcji
  const parts: { weight: number; percent: number }[] = [];
  if (competence.percent !== null) parts.push({ weight: WEIGHTS.competence, percent: competence.percent });
  if (culture.percent !== null) parts.push({ weight: WEIGHTS.culture, percent: culture.percent });
  if (extra.percent !== null) parts.push({ weight: WEIGHTS.extra, percent: extra.percent });

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  const overallPercent =
    totalWeight > 0 ? parts.reduce((s, p) => s + (p.weight / totalWeight) * p.percent, 0) : 0;

  const appliedWeights = {
    competence: competence.percent !== null && totalWeight > 0 ? WEIGHTS.competence / totalWeight : 0,
    culture: culture.percent !== null && totalWeight > 0 ? WEIGHTS.culture / totalWeight : 0,
    extra: extra.percent !== null && totalWeight > 0 ? WEIGHTS.extra / totalWeight : 0,
  };

  return {
    overallPercent: Math.round(overallPercent),
    competencePercent: Math.round(competence.percent ?? 0),
    culturePercent: Math.round(culture.percent ?? 0),
    extraPercent: Math.round(extra.percent ?? 0),
    competenceDetails: competence.details,
    cultureDetails: culture.details,
    extraDetails: extra.details,
    appliedWeights,
    strengths: generateStrengths(competence.details, culture.details, extra.details),
    risks: generateRisks(competence.details, culture.details, extra.details, culture.percent !== null),
  };
};
