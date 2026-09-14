/**
 * External marketplace eligibility (generate-matches family).
 *
 * Legacy (profile_requirements_version <= 1):
 *   all_tests_completed = competency + culture only
 *
 * New (profile_requirements_version >= 2):
 *   profile_ready = competency + culture + required additional fields
 */
export type CandidateMarketplaceRow = {
  profile_requirements_version?: number | null;
  all_tests_completed?: boolean | null;
  profile_ready?: boolean | null;
  open_to_external_offers?: boolean | null;
};

export function isEligibleForExternalMatching(
  candidate: CandidateMarketplaceRow,
): boolean {
  if (candidate.open_to_external_offers === false) return false;

  const version = candidate.profile_requirements_version ?? 1;
  if (version <= 1) {
    return candidate.all_tests_completed === true;
  }
  return candidate.profile_ready === true;
}

/** PostgREST `.or()` filter for bulk candidate queries. */
export const EXTERNAL_MATCHING_OR_FILTER =
  "and(profile_requirements_version.eq.1,all_tests_completed.eq.true)," +
  "and(profile_requirements_version.gte.2,profile_ready.eq.true)";
