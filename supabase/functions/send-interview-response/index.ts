import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { isValidEmail, sanitizeHeader } from "../_shared/email-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReqBody {
  match_result_id: string;
  response: "accepted" | "declined" | "reply";
  message?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const responseLabel = (r: string) =>
  r === "accepted" ? "Potwierdził(a) udział" :
  r === "declined" ? "Odmówił(a) udziału" :
  "Odpowiedział(a)";

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

    const body: ReqBody = await req.json();
    const { match_result_id, response, message } = body;
    const ALLOWED = ["accepted", "declined", "reply"] as const;
    if (!match_result_id || typeof match_result_id !== "string" || !ALLOWED.includes(response as any)) {
      return new Response(JSON.stringify({ error: "Invalid request: match_result_id and response (accepted|declined|reply) are required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: callerProfile } = await admin
      .from("profiles").select("user_type, full_name").eq("user_id", callerId).maybeSingle();
    if (!callerProfile || callerProfile.user_type !== "candidate") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: match, error: matchErr } = await admin
      .from("match_results")
      .select("id, candidate_user_id, employer_user_id, job_offer_id, interview_invited_at, interview_type, interview_calendar_link, interview_message")
      .eq("id", match_result_id)
      .eq("candidate_user_id", callerId)
      .maybeSingle();
    if (matchErr || !match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: employerProfile } = await admin
      .from("employer_profiles")
      .select("user_id, company_name")
      .eq("user_id", match.employer_user_id)
      .maybeSingle();
    const { data: employerUser } = await admin.auth.admin.getUserById(match.employer_user_id);
    const employerEmail = employerUser?.user?.email;
    if (!employerEmail || !isValidEmail(employerEmail)) {
      return new Response(JSON.stringify({ error: "Employer contact email not available" }), {
        status: 422, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    const companyName = sanitizeHeader(employerProfile?.company_name || "Pracodawca");
    const candidateName = sanitizeHeader(callerProfile?.full_name || "Kandydat");
    const safeMessage = escapeHtml((message || "").trim()).replace(/\r?\n/g, "<br>");
    const label = responseLabel(response);
    const dashboardLink = "https://idealniepasuje.lovable.app/employer/candidates";

    // Idempotent save: exactly one interview_response per (match_result_id, candidate_user_id).
    const payload = {
      content: message || label,
      metadata: { response, interview_type: match.interview_type, interview_calendar_link: match.interview_calendar_link },
      employer_read_at: null,
    };
    const { data: existing, error: existingErr } = await admin
      .from("candidate_messages")
      .select("id")
      .eq("match_result_id", match.id)
      .eq("candidate_user_id", callerId)
      .eq("type", "interview_response")
      .maybeSingle();
    if (existingErr) {
      console.error("send-interview-response lookup error:", existingErr);
      return new Response(JSON.stringify({ error: "Could not save response" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let saveErr: unknown = null;
    if (existing) {
      const { error } = await admin.from("candidate_messages").update(payload).eq("id", existing.id);
      saveErr = error;
    } else {
      const { error } = await admin.from("candidate_messages").insert({
        match_result_id: match.id,
        candidate_user_id: callerId,
        employer_user_id: match.employer_user_id,
        type: "interview_response",
        ...payload,
      });
      // Race: another concurrent call inserted first — fall back to update (idempotent).
      if (error && (error as any).code === "23505") {
        const { data: raced } = await admin
          .from("candidate_messages").select("id")
          .eq("match_result_id", match.id).eq("candidate_user_id", callerId)
          .eq("type", "interview_response").maybeSingle();
        if (raced) {
          const { error: updErr } = await admin.from("candidate_messages").update(payload).eq("id", raced.id);
          saveErr = updErr;
        } else saveErr = error;
      } else {
        saveErr = error;
      }
    }
    if (saveErr) {
      console.error("send-interview-response save error:", saveErr);
      return new Response(JSON.stringify({ error: "Could not save response" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }


    // Only the invitation tied to THIS match is marked as read.
    const { error: markErr } = await admin
      .from("candidate_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("match_result_id", match.id)
      .eq("candidate_user_id", callerId)
      .eq("type", "interview_invite")
      .is("read_at", null);
    if (markErr) console.error("send-interview-response mark-read error:", markErr);


    const emailHtml = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa;line-height:1.6;"><table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;"><tr><td style="padding:40px 20px;"><table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#00B2C5 0%,#233448 100%);padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Odpowiedź kandydata</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:15px;">${escapeHtml(candidateName)} odpowiedział na zaproszenie do rozmowy</p></td></tr><tr><td style="padding:40px 30px;"><p style="color:#233448;font-size:18px;margin:0 0 20px 0;">Cześć <strong>${escapeHtml(companyName)}</strong>!</p><p style="color:#555;font-size:16px;margin:0 0 16px 0;"><strong>Status:</strong> ${escapeHtml(label)}</p>${safeMessage ? `<div style="background:#f8fafc;border-left:4px solid #00B2C5;border-radius:8px;padding:18px 20px;margin:20px 0;color:#374151;font-size:15px;">${safeMessage}</div>` : ''}<p style="color:#555;font-size:15px;margin:0 0 20px 0;">Zaloguj się do panelu, aby zobaczyć szczegóły i skontaktować się z kandydatem.</p><table role="presentation" style="width:100%;margin-top:20px;"><tr><td style="text-align:center;"><a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(254,202,65,0.4);">Przejdź do panelu</a></td></tr></table></td></tr><tr><td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;"><p style="color:#00B2C5;font-size:16px;font-weight:700;margin:0;">Zespół <span style="color:#233448;">idealnie</span><span style="color:#FECA41;">pasuje</span></p><p style="color:#aaa;font-size:12px;margin:10px 0 0 0;">© 2026 idealniepasuje. Wszystkie prawa zastrzeżone.</p></td></tr></table></td></tr></table></body></html>`;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com", port: 465, tls: true,
        auth: { username: "idealnyserwisrekrutacyjny@gmail.com", password: gmailAppPassword },
      },
    });

    const plainText = [
      `Odpowiedz kandydata: ${candidateName}`,
      `Status: ${label}`,
      (message || "").trim() ? `Wiadomosc: ${(message || "").trim()}` : "",
      `Panel: ${dashboardLink}`,
    ].filter(Boolean).join("\n");

    await client.send({
      from: "idealniepasuje <idealnyserwisrekrutacyjny@gmail.com>",
      to: employerEmail,
      subject: `${candidateName}: ${label} (zaproszenie ${companyName})`,
      content: plainText,
      html: emailHtml,
    });
    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-interview-response error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
