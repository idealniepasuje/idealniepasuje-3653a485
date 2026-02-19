import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  candidate_user_id: string;
  candidate_email: string;
  feedback_url: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub;

    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailAppPassword) {
      throw new Error("GMAIL_APP_PASSWORD is not configured");
    }

    const { candidate_user_id, candidate_email, feedback_url }: EmailRequest = await req.json();

    // Verify authenticated user matches the request
    if (authenticatedUserId !== candidate_user_id) {
      return new Response(
        JSON.stringify({ error: "Forbidden - can only send emails for own account" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!candidate_email) {
      throw new Error("Missing required field: candidate_email");
    }

    // Verify email matches authenticated user's email
    const authenticatedEmail = claimsData.claims.email;
    if (authenticatedEmail !== candidate_email) {
      return new Response(
        JSON.stringify({ error: "Forbidden - email must match authenticated user" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const feedbackLink = feedback_url || "https://idealniepasuje.lovable.app/candidate/feedback";

    const emailHtml = [
      '<!DOCTYPE html>',
      '<html lang="pl">',
      '<head>',
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<title>Dziękujemy za udział w badaniu</title>',
      '</head>',
      '<body style="margin:0;padding:0;font-family:Lato,Segoe UI,Roboto,sans-serif;background-color:#f5f7fa;line-height:1.6;">',
      '<table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;">',
      '<tr>',
      '<td style="padding:40px 20px;">',
      '<table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">',
      '<tr>',
      '<td style="background:linear-gradient(135deg,#00B2C5 0%,#233448 100%);padding:40px 30px;text-align:center;">',
      '<h1 style="color:#FECA41;margin:0;font-size:28px;font-weight:700;">idealnie<span style="color:white;">pasuje</span></h1>',
      '<p style="color:rgba(255,255,255,0.9);margin:15px 0 0 0;font-size:18px;">Dziękujemy za udział w badaniu!</p>',
      '</td>',
      '</tr>',
      '<tr>',
      '<td style="padding:35px 30px;">',
      '<p style="color:#233448;font-size:16px;margin:0 0 20px 0;">Cześć!</p>',
      '<p style="color:#555;font-size:15px;margin:0 0 20px 0;">Bardzo dziękujemy za utworzenie profilu w naszym prototypie serwisu rekrutacyjnego.</p>',
      '<p style="color:#555;font-size:15px;margin:0 0 20px 0;">Rozwijamy nasz pomysł i sprawdzamy, czy działa w taki sposób, aby łączył odpowiedniego kandydata z odpowiednim pracodawcą.</p>',
      '<p style="color:#555;font-size:15px;margin:0 0 25px 0;">Jeśli chcesz nam jeszcze bardziej pomóc, będziemy bardzo wdzięczni za wypełnienie krótkiej ankiety, w której możesz wskazać co warto poprawić lub co jest fajne w tym rozwiązaniu.</p>',
      '</td>',
      '</tr>',
      '<tr>',
      '<td style="padding:0 30px 35px 30px;">',
      '<div style="background:#fff9e6;border:2px dashed #FECA41;border-radius:12px;padding:25px;text-align:center;">',
      '<p style="color:#233448;font-size:15px;margin:0 0 20px 0;"><strong>Twoja opinia pomoże nam dopracować nasz pomysł, aby był jeszcze lepszy!</strong></p>',
      `<a href="${feedbackLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px;">Wypełnij ankietę</a>`,
      '</div>',
      '</td>',
      '</tr>',
      '<tr>',
      '<td style="padding:0 30px 30px 30px;">',
      '<div style="background:linear-gradient(135deg,#f0f9fa 0%,#e8f4f5 100%);border-radius:12px;padding:20px;">',
      '<p style="color:#555;font-size:14px;margin:0;">✉️ Jeśli w naszej bazie pojawi się zapotrzebowanie na Twoje kompetencje, od razu poinformujemy Cię mailowo o dopasowaniu z pracodawcą.</p>',
      '</div>',
      '</td>',
      '</tr>',
      '<tr>',
      '<td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;">',
      '<p style="color:#00B2C5;font-size:16px;font-weight:700;margin:0 0 10px 0;">Zespół <span style="color:#233448;">idealnie</span><span style="color:#FECA41;">pasuje</span></p>',
      '<p style="color:#aaa;font-size:12px;margin:0;">© 2026 idealniepasuje. Wszystkie prawa zastrzeżone.</p>',
      '</td>',
      '</tr>',
      '</table>',
      '</td>',
      '</tr>',
      '</table>',
      '</body>',
      '</html>'
    ].join('');

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: "idealnyserwisrekrutacyjny@gmail.com",
          password: gmailAppPassword,
        },
      },
    });

    await client.send({
      from: "idealniepasuje <idealnyserwisrekrutacyjny@gmail.com>",
      to: candidate_email,
      subject: "Dziękujemy za udział w badaniu - idealniepasuje",
      content: "Dziękujemy za udział w badaniu.",
      html: emailHtml,
    });

    await client.close();

    console.log("Feedback request email sent successfully via Gmail SMTP");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-candidate-results function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
