import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NoMatchRequest {
  user_id: string;
  user_email: string;
  user_type: "candidate" | "employer";
  user_name?: string;
}

function buildCandidateNoMatchEmail(candidateName: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Szukamy dla Ciebie - idealniepasuje</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa;line-height:1.6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#233448 0%,#00B2C5 100%);padding:40px 30px;text-align:center;">
              <h1 style="color:#FECA41;margin:0;font-size:28px;">idealnie<span style="color:white;">pasuje</span></h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="color:#233448;font-size:18px;margin:0 0 20px 0;">
                Czesc <strong>${candidateName}</strong>!
              </p>
              
              <div style="background:#fef3c7;border-radius:12px;padding:25px;text-align:center;margin-bottom:25px;">
                <span style="font-size:48px;">🔍</span>
                <p style="color:#92400e;font-size:16px;margin:15px 0 0 0;font-weight:500;">
                  Niestety jeszcze nie udalo sie znalezc idealnie dopasowanej oferty pracy dla Ciebie.
                </p>
              </div>
              
              <p style="color:#555;font-size:16px;margin:0 0 25px 0;">
                Ale nie martw sie! Nasza baza pracodawcow stale rosnie. Jesli pojawia sie nowe dopasowania do oferty pracy, <strong style="color:#00B2C5;">poinformujemy Cie mailowo</strong>.
              </p>
              
              <div style="background:#f0f9ff;border-left:4px solid #00B2C5;padding:15px 20px;border-radius:0 8px 8px 0;margin-bottom:25px;">
                <p style="color:#0369a1;font-size:14px;margin:0;">
                  💡 <strong>Wskazowka:</strong> Upewnij sie, ze Twoj profil jest kompletny i aktualizuj swoje kompetencje - to zwieksza szanse na znalezienie idealnej oferty!
                </p>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width:100%;">
                <tr>
                  <td style="text-align:center;">
                    <a href="https://idealniepasuje.lovable.app/candidate/dashboard" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(254,202,65,0.4);">
                      Przejdz do panelu
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#FECA41;font-size:14px;margin:0;">
                Pozdrawiamy,<br/>
                <strong style="color:#233448;">Zespol idealniepasuje</strong>
              </p>
              <p style="color:#aaa;font-size:12px;margin:15px 0 0 0;">
                © 2026 idealniepasuje. Wszystkie prawa zastrzeżone.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmployerNoMatchEmail(companyName: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Szukamy dla Ciebie kandydatow - idealniepasuje</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa;line-height:1.6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#233448 0%,#00B2C5 100%);padding:40px 30px;text-align:center;">
              <h1 style="color:#FECA41;margin:0;font-size:28px;">idealnie<span style="color:white;">pasuje</span></h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="color:#233448;font-size:18px;margin:0 0 20px 0;">
                Czesc <strong>${companyName}</strong>!
              </p>
              
              <div style="background:#fef3c7;border-radius:12px;padding:25px;text-align:center;margin-bottom:25px;">
                <span style="font-size:48px;">🔍</span>
                <p style="color:#92400e;font-size:16px;margin:15px 0 0 0;font-weight:500;">
                  Niestety jeszcze nie znalezlismy kandydatow idealnie dopasowanych do Twoich potrzeb.
                </p>
              </div>
              
              <p style="color:#555;font-size:16px;margin:0 0 25px 0;">
                Ale nie martw sie! Nasza baza kandydatow stale rosnie. Jesli pojawia sie nowe dopasowania kandydatow do Twojego zapotrzebowania, <strong style="color:#00B2C5;">poinformujemy Cie mailowo</strong>.
              </p>
              
              <div style="background:#f0f9ff;border-left:4px solid #00B2C5;padding:15px 20px;border-radius:0 8px 8px 0;margin-bottom:25px;">
                <p style="color:#0369a1;font-size:14px;margin:0;">
                  💡 <strong>Wskazowka:</strong> Upewnij sie, ze Twoj profil pracodawcy jest kompletny - to zwieksza szanse na znalezienie idealnego kandydata!
                </p>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width:100%;">
                <tr>
                  <td style="text-align:center;">
                    <a href="https://idealniepasuje.lovable.app/employer/dashboard" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(254,202,65,0.4);">
                      Przejdz do panelu
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#FECA41;font-size:14px;margin:0;">
                Pozdrawiamy,<br/>
                <strong style="color:#233448;">Zespol idealniepasuje</strong>
              </p>
              <p style="color:#aaa;font-size:12px;margin:15px 0 0 0;">
                © 2026 idealniepasuje. Wszystkie prawa zastrzeżone.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate service role authorization (server-to-server only)
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - service role required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { user_id, user_email, user_type, user_name }: NoMatchRequest = await req.json();

    if (!user_id || !user_email || !user_type) {
      throw new Error("Missing required fields: user_id, user_email, and user_type");
    }

    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailAppPassword) {
      throw new Error("GMAIL_APP_PASSWORD not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let displayName = user_name;

    if (!displayName) {
      if (user_type === "employer") {
        const { data: employerProfile } = await supabase
          .from("employer_profiles")
          .select("company_name")
          .eq("user_id", user_id)
          .single();
        displayName = employerProfile?.company_name || "Pracodawco";
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user_id)
          .single();
        displayName = profile?.full_name || "Kandydacie";
      }
    }

    const finalName = displayName || (user_type === "employer" ? "Pracodawco" : "Kandydacie");
    
    const emailHtml = user_type === "employer" 
      ? buildEmployerNoMatchEmail(finalName)
      : buildCandidateNoMatchEmail(finalName);

    const emailSubject = user_type === "employer"
      ? "Szukamy dla Ciebie kandydatow - idealniepasuje"
      : "Szukamy dla Ciebie ofert pracy - idealniepasuje";

    // Send email
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
      to: user_email,
      subject: emailSubject,
      content: "auto",
      html: emailHtml,
    });

    await client.close();

    console.log(`No-match notification email sent to ${user_email} (${user_type})`);

    return new Response(
      JSON.stringify({ success: true, message: "No-match notification email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-no-match-notification function:", error);
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
