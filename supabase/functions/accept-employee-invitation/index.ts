import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const callerEmail =
      (claimsData?.claims?.email as string | undefined)?.toLowerCase();

    if (claimsErr || !callerId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();

    const invitationToken = body?.invitation_token;
    const decision = body?.action === "decline" ? "decline" : "accept";

    if (!invitationToken) {
      return json(
        { error: "invitation_token is required" },
        400,
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: invite, error: inviteError } = await admin
      .from("organization_invitations")
      .select(
        "id, organization_id, job_offer_id, email, status, expires_at, invited_by",
      )
      .eq("token", invitationToken)
      .maybeSingle();

    if (inviteError) {
      console.error(
        "accept-employee-invitation invitation error",
        inviteError,
      );

      return json({ error: "Internal server error" }, 500);
    }

    if (!invite) {
      return json(
        { error: "Zaproszenie nie istnieje" },
        404,
      );
    }

    // Stare zaproszenia sprzed wdrożenia zaproszeń per oferta
    // nie mogą automatycznie nadawać dostępu do dowolnej roli.
    if (!invite.job_offer_id) {
      return json(
        {
          error:
            "To zaproszenie pochodzi ze starszej wersji systemu. Poproś pracodawcę o wysłanie nowego zaproszenia do konkretnej oferty.",
        },
        409,
      );
    }

    const inviteEmail = (invite.email || "").toLowerCase();

    let email = callerEmail;

    if (!email) {
      const { data: authUser } =
        await admin.auth.admin.getUserById(callerId);

      email = authUser?.user?.email?.toLowerCase();
    }

    if (!email || email !== inviteEmail) {
      return json(
        {
          error:
            "To zaproszenie dotyczy innego adresu e-mail",
        },
        403,
      );
    }

    const { data: offer, error: offerError } = await admin
      .from("job_offers")
      .select(
        "id, title, organization_id, analyze_internal_team",
      )
      .eq("id", invite.job_offer_id)
      .maybeSingle();

    if (offerError) {
      console.error(
        "accept-employee-invitation offer error",
        offerError,
      );

      return json({ error: "Internal server error" }, 500);
    }

    if (!offer) {
      return json(
        { error: "Oferta przypisana do zaproszenia nie istnieje" },
        404,
      );
    }

    if (offer.organization_id !== invite.organization_id) {
      return json(
        { error: "Zaproszenie jest nieprawidłowe" },
        409,
      );
    }

    if (!offer.analyze_internal_team) {
      return json(
        {
          error:
            "Ta oferta nie przyjmuje już zaproszonych kandydatów",
        },
        409,
      );
    }

    // Idempotentna odpowiedź dla zaakceptowanego zaproszenia.
    if (invite.status === "accepted") {
      return json({
        success: true,
        status: "accepted",
        organization_id: invite.organization_id,
        job_offer_id: invite.job_offer_id,
      });
    }

    if (invite.status !== "pending") {
      return json(
        { error: "Zaproszenie jest już nieaktualne" },
        409,
      );
    }

    if (
      new Date(invite.expires_at).getTime() <
      Date.now()
    ) {
      await admin
        .from("organization_invitations")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return json({ error: "Zaproszenie wygasło" }, 410);
    }

    if (decision === "decline") {
      await admin
        .from("organization_invitations")
        .update({ status: "declined" })
        .eq("id", invite.id);

      // Jeśli analiza dla tego zaproszenia powstała wcześniej,
      // zachowujemy historię, ale odbieramy zgodę.
      await admin
        .from("internal_assessments")
        .update({
          consent_status: "declined",
          revoked_at: new Date().toISOString(),
        })
        .eq("job_offer_id", invite.job_offer_id)
        .eq("employee_user_id", callerId);

      return json({
        success: true,
        status: "declined",
        job_offer_id: invite.job_offer_id,
      });
    }

    // Relacja kandydat-organizacja może pozostać globalna.
    // Nie jest jednak źródłem zgody na wszystkie oferty.
    const { error: employeeErr } = await admin
      .from("organization_employees")
      .upsert(
        {
          organization_id: invite.organization_id,
          user_id: callerId,
          invited_email: inviteEmail,
          status: "active",
          joined_at: new Date().toISOString(),
          removed_at: null,
        },
        {
          onConflict: "organization_id,user_id",
        },
      );

    if (employeeErr) {
      console.error(
        "accept-employee-invitation employee upsert error",
        employeeErr,
      );

      return json(
        { error: "Nie udało się zaakceptować zaproszenia" },
        500,
      );
    }

    const now = new Date().toISOString();

    // Zgoda dotyczy WYŁĄCZNIE tej konkretnej oferty.
    const { error: assessmentError } = await admin
      .from("internal_assessments")
      .upsert(
        {
          organization_id: invite.organization_id,
          job_offer_id: invite.job_offer_id,
          employee_user_id: callerId,
          requested_by: invite.invited_by,
          consent_status: "granted",
          consent_at: now,
          revoked_at: null,
        },
        {
          onConflict: "job_offer_id,employee_user_id",
        },
      );

    if (assessmentError) {
      console.error(
        "accept-employee-invitation assessment upsert error",
        assessmentError,
      );

      return json(
        {
          error:
            "Zaproszenie zostało zaakceptowane, ale nie udało się utworzyć analizy dopasowania",
        },
        500,
      );
    }

    await admin
      .from("organization_invitations")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    // Uruchamiamy obliczenie przez tę samą sesję kandydata.
    // generate-internal-assessments zostanie w kolejnym kroku
    // dostosowane tak, aby kandydat mógł przeliczyć wyłącznie
    // własną, zaakceptowaną analizę.
    let analysisComputed = false;

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-internal-assessments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            job_offer_id: invite.job_offer_id,
            employee_user_id: callerId,
          }),
        },
      );

      analysisComputed = response.ok;

      if (!response.ok) {
        console.error(
          "accept-employee-invitation generate assessment failed",
          response.status,
          await response.text(),
        );
      }
    } catch (assessmentGenerateError) {
      console.error(
        "accept-employee-invitation generate assessment error",
        assessmentGenerateError,
      );
    }

    return json({
      success: true,
      status: "accepted",
      organization_id: invite.organization_id,
      job_offer_id: invite.job_offer_id,
      analysis_computed: analysisComputed,
    });
  } catch (error) {
    console.error(
      "accept-employee-invitation error",
      error,
    );

    return json(
      { error: "Internal server error" },
      500,
    );
  }
});