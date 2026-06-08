import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { isValidEmail, sanitizeHeader } from "../_shared/email-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReqBody {
  candidate_user_id: string;
  employer_company_name?: string;
  message?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated employer
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: ReqBody = await req.json();
    const { candidate_user_id, employer_company_name, message } = body;
    if (!candidate_user_id) throw new Error("Missing candidate_user_id");

    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailAppPassword) throw new Error("GMAIL_APP_PASSWORD not configured");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: candidateUser, error: cErr } = await admin.auth.admin.getUserById(candidate_user_id);
    if (cErr || !candidateUser?.user?.email) throw new Error("Could not fetch candidate email");

    const candidateEmail = candidateUser.user.email;
    if (!isValidEmail(candidateEmail)) throw new Error("Invalid candidate email");

    const { data: profile } = await admin
      .from("profiles").select("full_name").eq("user_id", candidate_user_id).maybeSingle();

    const candidateName = profile?.full_name || "Kandydacie";
    const companyName = sanitizeHeader(employer_company_name || "Pracodawca");
    const dashboardLink = "https://idealniepasuje.lovable.app/candidate/additional";
    const safeMessage = escapeHtml((message || "").trim()).replace(/\r?\n/g, "<br>");

    const emailHtml = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa;line-height:1.6;"><table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;"><tr><td style="padding:40px 20px;"><table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#00B2C5 0%,#233448 100%);padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Prosba o uzupelnienie profilu</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:15px;">${companyName} jest zainteresowany Twoim profilem</p></td></tr><tr><td style="padding:40px 30px;"><p style="color:#233448;font-size:18px;margin:0 0 20px 0;">Czesc <strong>${escapeHtml(candidateName)}</strong>!</p><p style="color:#555;font-size:16px;margin:0 0 20px 0;">Firma <strong style="color:#00B2C5;">${companyName}</strong> jest zainteresowana Twoim profilem i prosi o uzupelnienie brakujacych informacji, aby moc przejsc do nastepnego etapu rekrutacji.</p>${safeMessage ? `<div style="background:#f8fafc;border-left:4px solid #00B2C5;border-radius:8px;padding:18px 20px;margin:20px 0;color:#374151;font-size:15px;">${safeMessage}</div>` : ''}<table role="presentation" style="width:100%;margin-top:20px;"><tr><td style="text-align:center;"><a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(254,202,65,0.4);">Uzupelnij profil</a></td></tr></table></td></tr><tr><td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;"><p style="color:#00B2C5;font-size:16px;font-weight:700;margin:0;">Zespol <span style="color:#233448;">idealnie</span><span style="color:#FECA41;">pasuje</span></p><p style="color:#aaa;font-size:12px;margin:10px 0 0 0;">© 2026 idealniepasuje. Wszystkie prawa zastrzeżone.</p></td></tr></table></td></tr></table></body></html>`;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com", port: 465, tls: true,
        auth: { username: "idealnyserwisrekrutacyjny@gmail.com", password: gmailAppPassword },
      },
    });

    await client.send({
      from: "idealniepasuje <idealnyserwisrekrutacyjny@gmail.com>",
      to: candidateEmail,
      subject: `${companyName} prosi o uzupelnienie Twojego profilu`,
      content: "auto",
      html: emailHtml,
    });
    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-profile-completion-request error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
