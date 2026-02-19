import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InterestNotificationRequest {
  candidate_user_id: string;
  employer_company_name: string;
  match_percent: number;
  competence_percent?: number;
  culture_percent?: number;
  extra_percent?: number;
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

    const requestData: InterestNotificationRequest = await req.json();
    
    const { 
      candidate_user_id, 
      employer_company_name,
      match_percent,
      competence_percent,
      culture_percent,
      extra_percent,
    } = requestData;

    if (!candidate_user_id) {
      throw new Error("Missing required field: candidate_user_id");
    }

    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailAppPassword) {
      throw new Error("GMAIL_APP_PASSWORD not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get candidate email from auth.users using service role
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(candidate_user_id);
    
    if (userError || !userData?.user?.email) {
      console.log("Could not fetch candidate email:", userError);
      throw new Error("Could not fetch candidate email");
    }

    const candidateEmail = userData.user.email;

    // Get candidate name from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", candidate_user_id)
      .single();

    const candidateName = profile?.full_name || "Kandydacie";
    const companyName = employer_company_name || "Pracodawca";
    const dashboardLink = "https://idealniepasuje.lovable.app/candidate/matches";

    // Calculate culture score out of 30
    const cultureScore = culture_percent ? Math.round((culture_percent / 100) * 30) : null;

    // Build match breakdown section
    const matchBreakdownSection = (competence_percent !== undefined || culture_percent !== undefined || extra_percent !== undefined) ? 
      `<div style="background:#f8fafc;border-radius:12px;padding:20px;margin:25px 0;"><h3 style="color:#233448;margin:0 0 15px 0;font-size:16px;">📊 Twoje dopasowanie</h3><table style="width:100%;"><tr>${competence_percent !== undefined ? `<td style="text-align:center;padding:10px;width:33%;"><div style="font-size:28px;font-weight:700;color:#00B2C5;">${competence_percent}%</div><div style="font-size:12px;color:#666;margin-top:4px;">Kompetencje</div></td>` : ''}${culture_percent !== undefined ? `<td style="text-align:center;padding:10px;width:33%;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;"><div style="font-size:28px;font-weight:700;color:#00B2C5;">${cultureScore}/30</div><div style="font-size:12px;color:#666;margin-top:4px;">Kultura organizacji</div></td>` : ''}${extra_percent !== undefined ? `<td style="text-align:center;padding:10px;width:33%;"><div style="font-size:28px;font-weight:700;color:#00B2C5;">${extra_percent}%</div><div style="font-size:12px;color:#666;margin-top:4px;">Branża</div></td>` : ''}</tr></table></div>` 
      : '';

    const emailHtml = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Pracodawca zainteresowany!</title></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa;line-height:1.6;"><table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;"><tr><td style="padding:40px 20px;"><table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#00B2C5 0%,#233448 100%);padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">🎉 Swietna wiadomosc!</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:16px;">Pracodawca jest Toba zainteresowany!</p></td></tr><tr><td style="padding:40px 30px;"><p style="color:#233448;font-size:18px;margin:0 0 20px 0;">Czesc <strong>${candidateName}</strong>!</p><p style="color:#555;font-size:16px;margin:0 0 25px 0;">Mamy swietna wiadomosc - firma <strong style="color:#00B2C5;">${companyName}</strong> oznaczyła Cię jako kandydata, którym jest zainteresowana!</p><table role="presentation" style="width:100%;background:linear-gradient(135deg,#00B2C5 0%,#00a3b4 100%);border-radius:12px;margin:0 0 25px 0;"><tr><td style="padding:25px;"><table role="presentation" style="width:100%;"><tr><td style="vertical-align:middle;"><p style="color:rgba(255,255,255,0.9);margin:0 0 5px 0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">ZAINTERESOWANA FIRMA</p><p style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">${companyName}</p></td><td style="text-align:right;vertical-align:middle;"><div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:8px;padding:10px 15px;"><p style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">${match_percent}%</p><p style="color:rgba(255,255,255,0.9);margin:0;font-size:12px;">dopasowania</p></div></td></tr></table></td></tr></table>${matchBreakdownSection}<p style="color:#555;font-size:16px;margin:0 0 30px 0;">To oznacza, ze pracodawca moze wkrotce <strong style="color:#00B2C5;">skontaktowac sie z Toba</strong> w sprawie dalszych etapow rekrutacji. Sprawdz szczegoly dopasowania w swoim panelu.</p><table role="presentation" style="width:100%;"><tr><td style="text-align:center;"><a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(254,202,65,0.4);">Zobacz swoje dopasowania</a></td></tr></table></td></tr><tr><td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;"><p style="color:#888;font-size:14px;margin:0 0 10px 0;">Powodzenia w rekrutacji!</p><p style="color:#00B2C5;font-size:16px;font-weight:700;margin:0;">Zespol <span style="color:#233448;">idealnie</span><span style="color:#FECA41;">pasuje</span></p><p style="color:#aaa;font-size:12px;margin:15px 0 0 0;">© 2026 idealniepasuje. Wszystkie prawa zastrzeżone.</p></td></tr></table></td></tr></table></body></html>`;

    // Send email via Gmail SMTP
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
      to: candidateEmail,
      subject: `🎉 ${companyName} jest Tobą zainteresowany!`,
      content: "auto",
      html: emailHtml,
    });

    await client.close();

    console.log(`Interest notification email sent to ${candidateEmail} from ${companyName}`);

    return new Response(
      JSON.stringify({ success: true, message: "Interest notification email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-interest-notification function:", error);
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
