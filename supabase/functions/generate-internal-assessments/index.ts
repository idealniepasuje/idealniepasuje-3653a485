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
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const token = authHeader.replace("Bearer ", "");

    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);

    const callerId = claimsData?.claims?.sub as string | undefined;

    if (claimsErr || !callerId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();

    const jobOfferId = body?.job_offer_id as string | undefined;
    const requestedEmployeeId =
      body?.employee_user_id as string | undefined;

    if (!jobOfferId) {
      return json(
        { error: "job_offer_id is required" },
        400,
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: offer, error: offerError } = await admin
      .from("job_offers")
      .select("*")
      .eq("id", jobOfferId)
      .maybeSingle();

    if (offerError) {
      console.error(
        "generate-internal-assessments offer error",
        offerError,
      );

      return json(
        { error: "Internal server error" },
        500,
      );
    }

    if (!offer) {
      return json({ error: "Offer not found" }, 404);
    }

    if (!offer.analyze_internal_team) {
      return json(
        {
          error:
            "Zaproszeni kandydaci nie są włączeni dla tego ogłoszenia",
        },
        400,
      );
    }

    if (!offer.organization_id) {
      return json(
        {
          error:
            "Ogłoszenie nie jest powiązane z organizacją",
        },
        400,
      );
    }

    /*
     * Funkcję mogą wywołać:
     *
     * 1. manager/rekruter organizacji
     *    - może przeliczać zaakceptowane analizy tej oferty
     *
     * 2. kandydat
     *    - wyłącznie własną analizę
     *    - tylko jeśli wcześniej zaakceptował zaproszenie
     */

    const { data: orgMembership } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", offer.organization_id)
      .eq("user_id", callerId)
      .maybeSingle();

    const isManager =
      !!orgMembership &&
      ["owner", "admin", "recruiter"].includes(
        orgMembership.role,
      );

    const isCandidateSelf =
      !isManager &&
      requestedEmployeeId === callerId;

    if (!isManager && !isCandidateSelf) {
      return json({ error: "Forbidden" }, 403);
    }

    const eligibility = checkOfferEligibility(
      offer as JobOfferData,
    );

    if (!eligibility.eligible) {
      return json(
        {
          success: false,
          computed: 0,
          message: eligibility.reason,
        },
        200,
      );
    }

    const { data: employerProfile, error: profileError } =
      await admin
        .from("employer_profiles")
        .select("*")
        .eq("user_id", offer.user_id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "generate-internal-assessments employer profile error",
        profileError,
      );

      return json(
        { error: "Internal server error" },
        500,
      );
    }

    if (!employerProfile) {
      return json(
        { error: "Employer profile not found" },
        404,
      );
    }

    /*
     * Aktywne członkostwo w organizacji nadal jest wymagane,
     * ale NIE nadaje już automatycznie zgody na wszystkie role.
     *
     * Źródłem zgody jest:
     * internal_assessments.consent_status = granted
     */

    const { data: activeEmployees, error: employeesError } =
      await admin
        .from("organization_employees")
        .select("user_id")
        .eq("organization_id", offer.organization_id)
        .eq("status", "active");

    if (employeesError) {
      console.error(
        "generate-internal-assessments employees error",
        employeesError,
      );

      return json(
        { error: "Internal server error" },
        500,
      );
    }

    const activeIds = new Set(
      (activeEmployees || []).map((e) => e.user_id),
    );

    let assessmentsQuery = admin
      .from("internal_assessments")
      .select(
        "id, organization_id, job_offer_id, employee_user_id, consent_status",
      )
      .eq("job_offer_id", jobOfferId)
      .eq("organization_id", offer.organization_id);

    if (requestedEmployeeId) {
      assessmentsQuery = assessmentsQuery.eq(
        "employee_user_id",
        requestedEmployeeId,
      );
    }

    const {
      data: allAssessments,
      error: assessmentsError,
    } = await assessmentsQuery;

    if (assessmentsError) {
      console.error(
        "generate-internal-assessments fetch error",
        assessmentsError,
      );

      return json(
        { error: "Nie udało się pobrać analiz" },
        500,
      );
    }

    /*
     * Jeśli kandydat opuścił organizację,
     * cofamy aktywną zgodę.
     *
     * WAŻNE:
     * nie ma już automatycznego przejścia
     * pending/declined/revoked -> granted.
     */

    const noLongerActive = (allAssessments || []).filter(
      (assessment) =>
        assessment.consent_status === "granted" &&
        !activeIds.has(assessment.employee_user_id),
    );

    if (noLongerActive.length > 0) {
      const now = new Date().toISOString();

      const { error: revokeError } = await admin
        .from("internal_assessments")
        .update({
          consent_status: "revoked",
          revoked_at: now,
        })
        .in(
          "id",
          noLongerActive.map((a) => a.id),
        );

      if (revokeError) {
        console.error(
          "generate-internal-assessments revoke error",
          revokeError,
        );
      }
    }

    const assessments = (allAssessments || []).filter(
      (assessment) =>
        assessment.consent_status === "granted" &&
        activeIds.has(assessment.employee_user_id),
    );

    /*
     * Kandydat może uruchomić tylko własną analizę,
     * która ma już zgodę granted.
     */

    if (isCandidateSelf) {
      const ownAssessment = assessments.find(
        (assessment) =>
          assessment.employee_user_id === callerId,
      );

      if (!ownAssessment) {
        return json(
          {
            error:
              "Brak aktywnej zgody na analizę dla tej oferty",
          },
          403,
        );
      }
    }

    if (assessments.length === 0) {
      return json({
        success: true,
        computed: 0,
        skipped: 0,
        message:
          "Brak kandydatów z aktywną zgodą na analizę tej oferty",
      });
    }

    const userIds = assessments.map(
      (assessment) => assessment.employee_user_id,
    );

    const { data: results, error: resultsError } =
      await admin
        .from("candidate_test_results")
        .select("*")
        .in("user_id", userIds);

    if (resultsError) {
      console.error(
        "generate-internal-assessments results error",
        resultsError,
      );

      return json(
        { error: "Nie udało się pobrać wyników testów" },
        500,
      );
    }

    const resultsMap = new Map(
      (results || []).map((result) => [
        result.user_id,
        result,
      ]),
    );

    let computed = 0;
    let skipped = 0;

    for (const assessment of assessments) {
      const employeeData = resultsMap.get(
        assessment.employee_user_id,
      );

      if (
        !employeeData ||
        !employeeData.all_tests_completed
      ) {
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
        extraAvailableCriteria:
          outcome.extraAvailableCriteria,
        extraTotalCriteria: outcome.extraTotalCriteria,
        extraCoveragePercent: outcome.extraCoveragePercent,
        appliedWeights: outcome.appliedWeights,
        strengths: outcome.strengths,
        risks: outcome.risks,
      };

      /*
       * Sprawdzamy zgodę jeszcze raz bezpośrednio
       * przed zapisaniem wyniku.
       *
       * Chroni to przed race condition,
       * gdy kandydat cofnie zgodę w trakcie obliczeń.
       */

      const { data: freshAssessment } = await admin
        .from("internal_assessments")
        .select("consent_status")
        .eq("id", assessment.id)
        .maybeSingle();

      if (
        !freshAssessment ||
        freshAssessment.consent_status !== "granted"
      ) {
        skipped++;
        continue;
      }

      const { data: updated, error: updateError } =
        await admin
          .from("internal_assessments")
          .update({
            overall_percent: outcome.overallPercent,
            competence_percent:
              outcome.competencePercent,
            culture_percent: outcome.culturePercent,
            extra_percent: outcome.extraPercent,
            match_details: matchDetails,
            computed_at: new Date().toISOString(),
          })
          .eq("id", assessment.id)
          .eq("consent_status", "granted")
          .select("id");

      if (updateError) {
        console.error(
          "generate-internal-assessments update error",
          updateError,
        );

        skipped++;
        continue;
      }

      if (!updated || updated.length === 0) {
        skipped++;
        continue;
      }

      computed++;
    }

    return json({
      success: true,
      computed,
      skipped,
    });
  } catch (error) {
    console.error(
      "generate-internal-assessments error",
      error,
    );

    return json(
      { error: "Internal server error" },
      500,
    );
  }
});