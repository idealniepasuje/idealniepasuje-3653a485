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
    const callerEmail = (claimsData?.claims?.email as string | undefined)?.toLowerCase();
    if (claimsErr || !callerId) return json({ error: "Unauthorized" }, 401);

    const { invitation_token, action } = await req.json();
    if (!invitation_token) return json({ error: "invitation_token is required" }, 400);
    const decision = action === "decline" ? "decline" : "accept";

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: invite } = await admin
      .from("organization_invitations")
      .select("id, organization_id, email, status, expires_at")
      .eq("token", invitation_token)
      .maybeSingle();

    if (!invite) return json({ error: "Zaproszenie nie istnieje" }, 404);

    // Only the invited email may act on the invitation
    const inviteEmail = (invite.email || "").toLowerCase();
    let email = callerEmail;
    if (!email) {
      const { data: authUser } = await admin.auth.admin.getUserById(callerId);
      email = authUser?.user?.email?.toLowerCase();
    }
    if (!email || email !== inviteEmail) return json({ error: "To zaproszenie dotyczy innego adresu e-mail" }, 403);

    if (invite.status === "accepted") {
      // Idempotent: already accepted
      return json({ success: true, status: "accepted", organization_id: invite.organization_id });
    }
    if (invite.status !== "pending") return json({ error: "Zaproszenie jest już nieaktualne" }, 409);
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await admin.from("organization_invitations").update({ status: "expired" }).eq("id", invite.id);
      return json({ error: "Zaproszenie wygasło" }, 410);
    }

    if (decision === "decline") {
      await admin.from("organization_invitations").update({ status: "declined" }).eq("id", invite.id);
      return json({ success: true, status: "declined" });
    }

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
        { onConflict: "organization_id,user_id" },
      );

    if (employeeErr) {
      console.error("accept-employee-invitation upsert error", employeeErr);
      return json({ error: "Nie udało się dołączyć do organizacji" }, 500);
    }

    await admin.from("organization_invitations").update({ status: "accepted" }).eq("id", invite.id);

    return json({ success: true, status: "accepted", organization_id: invite.organization_id });
  } catch (error) {
    console.error("accept-employee-invitation error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
