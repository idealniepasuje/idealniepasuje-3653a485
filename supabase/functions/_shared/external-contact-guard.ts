// Guard for employer -> candidate contact actions coming from the EXTERNAL job market.
//
// A candidate can switch off `candidate_test_results.open_to_external_offers`.
// Old `match_results` rows created before the switch was turned off must NOT be
// usable as a backdoor for new contact actions (emails, in-app messages, status
// changes, contact data disclosure).
//
// Internal organization flows (employee assessments, communication based on an
// active organization membership) are explicitly NOT affected.

export const EXTERNAL_CONTACT_BLOCKED_MESSAGE =
  "Kandydat nie przyjmuje obecnie nowych propozycji od pracodawców.";

type AdminClient = {
  from: (table: string) => any;
};

/**
 * Returns true when the candidate is an ACTIVE employee of an organization the
 * employer manages. Such a relation is internal and bypasses the guard.
 */
export async function isInternalRelation(
  admin: AdminClient,
  candidateUserId: string,
  employerUserId: string,
): Promise<boolean> {
  const { data: memberships } = await admin
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", employerUserId);
  const orgIds = (memberships || [])
    .filter((m: any) => ["owner", "admin", "recruiter"].includes(m.role))
    .map((m: any) => m.organization_id);
  if (orgIds.length === 0) return false;

  const { data: employee } = await admin
    .from("organization_employees")
    .select("id")
    .eq("user_id", candidateUserId)
    .eq("status", "active")
    .in("organization_id", orgIds)
    .limit(1)
    .maybeSingle();
  return !!employee;
}

/**
 * Checks whether the employer may perform a NEW external contact action.
 * Returns `null` when allowed, otherwise a ready-to-return 409 Response.
 */
export async function assertExternalContactAllowed(
  admin: AdminClient,
  candidateUserId: string,
  employerUserId: string,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const { data: candidate } = await admin
    .from("candidate_test_results")
    .select("open_to_external_offers")
    .eq("user_id", candidateUserId)
    .maybeSingle();

  // Missing row => treat as open (default in DB is true).
  if (!candidate || candidate.open_to_external_offers !== false) return null;

  if (await isInternalRelation(admin, candidateUserId, employerUserId)) return null;

  return new Response(
    JSON.stringify({
      error: "candidate_not_open_to_external_offers",
      message: EXTERNAL_CONTACT_BLOCKED_MESSAGE,
    }),
    { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
}
