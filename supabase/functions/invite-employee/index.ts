import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { isValidEmail, sanitizeHeader } from "../_shared/email-validation.ts";
import { escapeHtml } from "../_shared/html.ts";

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

    const { organization_id, email } = await req.json();
    if (!organization_id || !email) return json({ error: "organization_id and email are required" }, 400);

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) return json({ error: "Nieprawidłowy adres e-mail" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Caller must manage this organization
    const { data: membership } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", callerId)
      .maybeSingle();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: org } = await admin
      .from("organizations").select("name").eq("id", organization_id).maybeSingle();
    if (!org) return json({ error: "Organization not found" }, 404);

    // Already an active employee?
    const { data: existingEmployees } = await admin
      .from("organization_employees")
      .select("id, user_id, status, invited_email")
      .eq("organization_id", organization_id);
    if ((existingEmployees || []).some((e) => e.status === "active" && (e.invited_email || "").toLowerCase() === normalizedEmail)) {
      return json({ error: "Ten pracownik należy już do organizacji" }, 409);
    }

    // Idempotent invitation (partial unique index on pending invitations)
    const { data: existingInvite } = await admin
      .from("organization_invitations")
      .select("id, token, status")
      .eq("organization_id", organization_id)
      .eq("status", "pending")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    let invitation = existingInvite;
    if (!invitation) {
      const { data: created, error: insertErr } = await admin
        .from("organization_invitations")
        .insert({ organization_id, email: normalizedEmail, invited_by: callerId })
        .select("id, token, status")
        .single();
      if (insertErr) {
        if ((insertErr as any).code === "23505") {
          return json({ error: "Zaproszenie dla tego adresu już istnieje" }, 409);
        }
        console.error("invite-employee insert error", insertErr);
        return json({ error: "Nie udało się utworzyć zaproszenia" }, 500);
      }
      invitation = created;
    }

    // Email (partial success tolerated — invitation is already stored)
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    const companyName = sanitizeHeader(org.name || "Firma");
    const link = `https://idealniepasuje.lovable.app/candidate/organizations?invite=${invitation!.token}`;

    if (!gmailAppPassword) {
      return json({ success: true, email_sent: false, invitation_id: invitation!.id }, 207);
    }

    const html = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa;line-height:1.6;"><table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;"><tr><td style="padding:40px 20px;"><table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#00B2C5 0%,#233448 100%);padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Zaproszenie do organizacji</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:15px;">${escapeHtml(companyName)} zaprasza Cie do swojego zespolu</p></td></tr><tr><td style="padding:40px 30px;"><p style="color:#555;font-size:16px;margin:0 0 20px 0;">Firma <strong style="color:#00B2C5;">${escapeHtml(companyName)}</strong> zaprasza Cie do dolaczenia do swojej organizacji w serwisie idealniepasuje.</p><p style="color:#555;font-size:15px;margin:0 0 20px 0;">Dolaczenie nie zmienia Twojego konta ani wynikow testow. Firma zobaczy Twoje wyniki tylko wtedy, gdy osobno wyrazisz zgode na analize wzgledem konkretnej roli. W kazdej chwili mozesz sie odlaczyc.</p><table role="presentation" style="width:100%;margin-top:20px;"><tr><td style="text-align:center;"><a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">Zobacz zaproszenie</a></td></tr></table></td></tr><tr><td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;"><p style="color:#00B2C5;font-size:16px;font-weight:700;margin:0;">Zespol <span style="color:#233448;">idealnie</span><span style="color:#FECA41;">pasuje</span></p></td></tr></table></td></tr></table></body></html>`;

    try {
      const client = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com", port: 465, tls: true,
          auth: { username: "idealnyserwisrekrutacyjny@gmail.com", password: gmailAppPassword },
        },
      });
      await client.send({
        from: "idealniepasuje <idealnyserwisrekrutacyjny@gmail.com>",
        to: normalizedEmail,
        subject: `${companyName} zaprasza Cie do organizacji`,
        content: "auto",
        html,
      });
      await client.close();
    } catch (mailErr) {
      console.error("invite-employee smtp error", mailErr);
      return json({ success: true, email_sent: false, invitation_id: invitation!.id }, 207);
    }

    return json({ success: true, email_sent: true, invitation_id: invitation!.id });
  } catch (error) {
    console.error("invite-employee error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
