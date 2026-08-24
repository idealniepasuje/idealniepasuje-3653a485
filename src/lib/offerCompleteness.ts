export interface OfferCompletenessInput {
  title?: string | null;
  role_description?: string | null;
  work_mode?: string | null;
  city?: string | null;
  industry?: string | null;
  position_level?: string | null;
  no_experience_required?: boolean | null;
  required_experience?: string | null;
  req_komunikacja?: number | null;
  req_myslenie_analityczne?: number | null;
  req_out_of_the_box?: number | null;
  req_determinacja?: number | null;
  req_adaptacja?: number | null;
  analyze_internal_team?: boolean | null;
  recruit_external_candidates?: boolean | null;
}

const filled = (v?: string | null) => !!(v && v.trim().length > 0);

/**
 * Single source of truth: an offer may only be active when all required
 * data is present AND the employer finished the culture test.
 */
export function isOfferComplete(
  offer: OfferCompletenessInput,
  employerCultureCompleted: boolean,
): boolean {
  if (!employerCultureCompleted) return false;
  // Co najmniej jeden tryb analizy musi być włączony
  if (offer.analyze_internal_team !== undefined || offer.recruit_external_candidates !== undefined) {
    if (!offer.analyze_internal_team && !offer.recruit_external_candidates) return false;
  }
  if (!filled(offer.title) || (offer.title as string).trim().length < 3) return false;
  if (!filled(offer.role_description)) return false;
  if (!filled(offer.work_mode)) return false;
  if ((offer.work_mode === "hybrid" || offer.work_mode === "onsite") && !filled(offer.city)) return false;
  if (!filled(offer.industry)) return false;
  if (!filled(offer.position_level)) return false;
  if (!offer.no_experience_required && !filled(offer.required_experience)) return false;

  const reqs = [
    offer.req_komunikacja,
    offer.req_myslenie_analityczne,
    offer.req_out_of_the_box,
    offer.req_determinacja,
    offer.req_adaptacja,
  ];
  if (reqs.some((r) => r === null || r === undefined)) return false;

  return true;
}
