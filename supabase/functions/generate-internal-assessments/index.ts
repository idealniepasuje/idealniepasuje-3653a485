import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  calculateMatch,
  checkOfferEligibility,
  type CandidateData,
  type JobOfferData,
  type EmployerCultureData,
} from "../_shared/matching.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    const callerId = claimsData?.claims?.sub as string | undefined;
    if (claimsErr || !callerId) return json({ error: "Unauthorized" }, 401);

    const { job_offer_id, employee_user_id } = await req.json();
    if (!job_offer_id) return json({ error: "job_offer_id is required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: offer } = await admin
      .from("job_offers")
      .select("*")
      .eq("id", job_offer_id)
      .maybeSingle();
    if (!offer) return json({ error: "Offer not found" }, 404);
    if (!offer.analyze_internal_team) {
      return json({ error: "Analiza zespołu nie jest włączona dla tego ogłoszenia" }, 400);
    }
    if (!offer.organization_id) return json({ error: "Ogłoszenie nie jest powiązane z organizacją" }, 400);

    // Caller must manage the organization owning the offer
    const { data: membership } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", offer.organization_id)
      .eq("user_id", callerId)
      .maybeSingle();
    if (!membership || !["owner", "admin", "recruiter"].includes(membership.role)) {
      return json({ error: "Forbidden" }, 403);
    }

    const eligibility = checkOfferEligibility(offer as JobOfferData);
    if (!eligibility.eligible) {
      return json({ success: false, computed: 0, message: eligibility.reason }, 200);
    }

    const { data: employerProfile } = await admin
      .from("employer_profiles")
      .select("*")
      .eq("user_id", offer.user_id)
      .maybeSingle();
    if (!employerProfile) return json({ error: "Employer profile not found" }, 404);

    // Consent follows ACTIVE organization membership (no per-offer consent).
    const { data: activeEmployees } = await admin
      .from("organization_employees")
      .select("user_id")
      .eq("organization_id", offer.organization_id)
      .eq("status", "active");
    const activeIds = new Set((activeEmployees || []).map((e) => e.user_id));

    let assessmentsQuery = admin
      .from("internal_assessments")
      .select("id, employee_user_id, consent_status")
      .eq("job_offer_id", job_offer_id);
    if (employee_user_id) assessmentsQuery = assessmentsQuery.eq("employee_user_id", employee_user_id);

    const { data: allAssessments, error: assessErr } = await assessmentsQuery;
    if (assessErr) {
      console.error("generate-internal-assessments fetch error", assessErr);
      return json({ error: "Nie udało się pobrać analiz" }, 500);
    }

    // Keep consent_status technically in sync with membership.
    const staleGranted = (allAssessments || []).filter(
      (a) => !activeIds.has(a.employee_user_id) && a.consent_status !== "revoked",
    );
    if (staleGranted.length > 0) {
      await admin
        .from("internal_assessments")
        .update({ consent_status: "revoked" })
        .in("id", staleGranted.map((a) => a.id));
    }

    const assessments = (allAssessments || []).filter((a) => activeIds.has(a.employee_user_id));
    const toGrant = assessments.filter((a) => a.consent_status !== "granted");
    if (toGrant.length > 0) {
      await admin
        .from("internal_assessments")
        .update({ consent_status: "granted" })
        .in("id", toGrant.map((a) => a.id));
    }

    if (assessments.length === 0) {
      return json({ success: true, computed: 0, message: "Brak aktywnych pracowników organizacji do analizy" });
    }

    const userIds = assessments.map((a) => a.employee_user_id);
    const { data: results } = await admin
      .from("candidate_test_results")
      .select("*")
      .in("user_id", userIds);
    const resultsMap = new Map((results || []).map((r) => [r.user_id, r]));

    let computed = 0;
    let skipped = 0;

    for (const assessment of assessments) {
      const employeeData = resultsMap.get(assessment.employee_user_id);
      if (!employeeData || !employeeData.all_tests_completed) {
        skipped++;
        continue;
      }

      const outcome = calculateMatch(
        employeeData as CandidateData,
        offer as JobOfferData,
        employerProfile as EmployerCultureData,
      );

      const matchDetails = {
        competenceDetails: outcome.competenceDetails,
        cultureDetails: outcome.cultureDetails,
        extraDetails: outcome.extraDetails,
        matchStatus: outcome.matchStatus,
        reliable: outcome.reliable,
        availableSections: outcome.availableSections,
        technicalPercent: outcome.technicalPercent,
        extraStatus: outcome.extraStatus,
        extraAvailableCriteria: outcome.extraAvailableCriteria,
        extraTotalCriteria: outcome.extraTotalCriteria,
        extraCoveragePercent: outcome.extraCoveragePercent,
        appliedWeights: outcome.appliedWeights,
        strengths: outcome.strengths,
        risks: outcome.risks,
      };

      // Re-check consent right before writing (race condition with revocation)
      const { data: fresh } = await admin
        .from("internal_assessments")
        .select("consent_status")
        .eq("id", assessment.id)
        .maybeSingle();
      if (!fresh || fresh.consent_status !== "granted") {
        skipped++;
        continue;
      }

      const { data: updated, error: updateErr } = await admin
        .from("internal_assessments")
        .update({
          overall_percent: outcome.overallPercent,
          competence_percent: outcome.competencePercent,
          culture_percent: outcome.culturePercent,
          extra_percent: outcome.extraPercent,
          match_details: matchDetails,
          computed_at: new Date().toISOString(),
        })
        .eq("id", assessment.id)
        .eq("consent_status", "granted")
        .select("id");

      if (updateErr) {
        console.error("generate-internal-assessments update error", updateErr);
        skipped++;
      } else if (!updated || updated.length === 0) {
        skipped++;
      } else {
        computed++;
      }
    }

    return json({ success: true, computed, skipped });
  } catch (error) {
    console.error("generate-internal-assessments error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
