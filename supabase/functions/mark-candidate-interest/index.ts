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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    const employerId = claimsData?.claims?.sub as string | undefined;
    if (claimsErr || !employerId) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const matchId: string | undefined = body?.match_id;
    if (!matchId || typeof matchId !== "string") {
      return json({ error: "Missing match_id" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: match, error: matchErr } = await admin
      .from("match_results")
      .select("id, employer_user_id, candidate_user_id, status, overall_percent, competence_percent, culture_percent, extra_percent")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr) {
      console.error("mark-candidate-interest match fetch error:", matchErr);
      return json({ error: "Internal server error" }, 500);
    }
    if (!match) return json({ error: "Not found" }, 404);
    if (match.employer_user_id !== employerId) return json({ error: "Forbidden" }, 403);

    const alreadyConsidering = match.status === "considering";

    if (!alreadyConsidering) {
      const { error: updErr } = await admin
        .from("match_results")
        .update({ status: "considering" })
        .eq("id", matchId);
      if (updErr) {
        console.error("mark-candidate-interest update error:", updErr);
        return json({ error: "Internal server error" }, 500);
      }
    }

    let emailSent = false;
    if (!alreadyConsidering) {
      const { data: employerProfile } = await admin
        .from("employer_profiles")
        .select("company_name")
        .eq("user_id", employerId)
        .maybeSingle();

      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-interest-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            candidate_user_id: match.candidate_user_id,
            employer_company_name: employerProfile?.company_name || "Pracodawca",
            match_percent: match.overall_percent,
            competence_percent: match.competence_percent,
            culture_percent: match.culture_percent,
            extra_percent: match.extra_percent,
          }),
        });
        emailSent = resp.ok;
        if (!resp.ok) {
          console.error("send-interest-notification failed:", resp.status, await resp.text());
        }
      } catch (mailErr) {
        console.error("send-interest-notification invoke error:", mailErr);
      }
    }

    return json({ success: true, status: "considering", email_sent: emailSent });
  } catch (e) {
    console.error("mark-candidate-interest error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
