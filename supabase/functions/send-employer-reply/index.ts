import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { isValidEmail, sanitizeHeader } from "../_shared/email-validation.ts";
import { escapeHtml, escapeHtmlMultiline } from "../_shared/html.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request): Promise<Response> => {
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    const callerId = claimsData?.claims?.sub as string | undefined;
    if (claimsErr || !callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { match_result_id, message, client_request_id, in_reply_to_message_id } = await req.json();
    if (!match_result_id || !message || !String(message).trim()) {
      throw new Error("Missing match_result_id or message");
    }
    const requestKey = String(client_request_id || in_reply_to_message_id || "").trim();
    if (!requestKey) {
      return new Response(JSON.stringify({ error: "Missing client_request_id" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailAppPassword) throw new Error("GMAIL_APP_PASSWORD not configured");

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: callerProfile } = await admin
      .from("profiles").select("user_type, full_name").eq("user_id", callerId).maybeSingle();
    if (!callerProfile || callerProfile.user_type !== "employer") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: match } = await admin
      .from("match_results")
      .select("id, candidate_user_id, employer_user_id")
      .eq("id", match_result_id)
      .eq("employer_user_id", callerId)
      .maybeSingle();
    if (!match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: employerProfile } = await admin
      .from("employer_profiles").select("company_name").eq("user_id", callerId).maybeSingle();
    const companyName = sanitizeHeader(employerProfile?.company_name || callerProfile.full_name || "Pracodawca");

    const { data: employerUser } = await admin.auth.admin.getUserById(callerId);
    const employerEmail = employerUser?.user?.email || null;

    const { data: candUser } = await admin.auth.admin.getUserById(match.candidate_user_id);
    const candidateEmail = candUser?.user?.email;
    if (!candidateEmail || !isValidEmail(candidateEmail)) {
      return new Response(JSON.stringify({ error: "Candidate email not available" }), {
        status: 422, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const text = String(message).trim();

    // Idempotent save: one persisted reply per client_request_id
    const { data: existingReply } = await admin
      .from("candidate_messages")
      .select("id")
      .eq("match_result_id", match.id)
      .eq("type", "employer_reply")
      .eq("metadata->>client_request_id", requestKey)
      .maybeSingle();

    if (!existingReply) {
      const { error: insertErr } = await admin.from("candidate_messages").insert({
        match_result_id: match.id,
        candidate_user_id: match.candidate_user_id,
        employer_user_id: callerId,
        type: "employer_reply",
        content: text,
        metadata: {
          company_name: companyName,
          employer_email: employerEmail,
          client_request_id: requestKey,
          in_reply_to_message_id: in_reply_to_message_id ?? null,
        },
      });
      // 23505 = duplicate from a concurrent retry -> treat as already saved
      if (insertErr && (insertErr as any).code !== "23505") throw insertErr;
    }

    const safeMessage = escapeHtmlMultiline(text);
    const dashboardLink = "https://idealniepasuje.lovable.app/candidate/dashboard";
    const contactLine = employerEmail
      ? `<p style="color:#555;font-size:15px;margin:0 0 20px 0;">Możesz odpowiedzieć bezpośrednio na adres: <a href="mailto:${escapeHtml(employerEmail)}" style="color:#00B2C5;">${escapeHtml(employerEmail)}</a></p>`
      : "";

    const emailHtml = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa;line-height:1.6;"><table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;"><tr><td style="padding:40px 20px;"><table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#00B2C5 0%,#233448 100%);padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Wiadomosc od pracodawcy</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:15px;">${escapeHtml(companyName)}</p></td></tr><tr><td style="padding:40px 30px;"><div style="background:#f8fafc;border-left:4px solid #00B2C5;border-radius:8px;padding:18px 20px;margin:0 0 20px 0;color:#374151;font-size:15px;">${safeMessage}</div>${contactLine}<table role="presentation" style="width:100%;margin-top:20px;"><tr><td style="text-align:center;"><a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">Przejdz do panelu</a></td></tr></table></td></tr><tr><td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;"><p style="color:#00B2C5;font-size:16px;font-weight:700;margin:0;">Zespol <span style="color:#233448;">idealnie</span><span style="color:#FECA41;">pasuje</span></p></td></tr></table></td></tr></table></body></html>`;

    const plainText = [
      `Wiadomosc od pracodawcy: ${companyName}`,
      "",
      text,
      "",
      employerEmail ? `Odpowiedz na: ${employerEmail}` : "",
      `Panel: ${dashboardLink}`,
    ].filter(Boolean).join("\n");

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com", port: 465, tls: true,
        auth: { username: "idealnyserwisrekrutacyjny@gmail.com", password: gmailAppPassword },
      },
    });

    try {
      await client.send({
        from: "idealniepasuje <idealnyserwisrekrutacyjny@gmail.com>",
        to: candidateEmail,
        replyTo: employerEmail || undefined,
        subject: `Wiadomosc od ${companyName}`,
        content: plainText,
        html: emailHtml,
      });
      await client.close();
    } catch (smtpError) {
      console.error("send-employer-reply SMTP error:", smtpError);
      try { await client.close(); } catch (_) { /* ignore */ }
      return new Response(
        JSON.stringify({ success: false, saved: true, email_sent: false }),
        { status: 207, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(JSON.stringify({ success: true, saved: true, email_sent: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("send-employer-reply error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
