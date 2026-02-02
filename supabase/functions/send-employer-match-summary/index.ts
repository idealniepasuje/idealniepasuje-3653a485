import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MatchSummaryRequest {
  employer_user_id: string;
  employer_email: string;
  dashboard_url?: string;
}

interface MatchResult {
  candidate_user_id: string;
  overall_percent: number;
  competence_percent: number;
  culture_percent: number;
  extra_percent: number;
  match_details: {
    strengths: string[];
    risks: string[];
    competenceDetails: Array<{
      competency: string;
      matchPercent: number;
      status: string;
    }>;
    cultureDetails: Array<{
      dimension: string;
      matchPercent: number;
      status: string;
    }>;
    extraDetails: Array<{
      field: string;
      matched: boolean;
    }>;
  };
}

const competencyNames: Record<string, string> = {
  komunikacja: "Komunikacja",
  myslenie_analityczne: "Myślenie analityczne",
  out_of_the_box: "Kreatywność",
  determinacja: "Determinacja",
  adaptacja: "Adaptacja do zmian",
};

const cultureDimensionNames: Record<string, string> = {
  relacja_wspolpraca: "Relacje i współpraca",
  elastycznosc_innowacyjnosc: "Elastyczność i innowacyjność",
  wyniki_cele: "Orientacja na wyniki",
  stabilnosc_struktura: "Stabilność i struktura",
  autonomia_styl_pracy: "Autonomia w pracy",
  wlb_dobrostan: "Work-life balance",
};

function getMatchDescription(percent: number): string {
  if (percent >= 85) return "Doskonałe dopasowanie!";
  if (percent >= 70) return "Bardzo dobre dopasowanie";
  if (percent >= 55) return "Dobre dopasowanie";
  return "Potencjalne dopasowanie";
}

function getMatchColor(percent: number): string {
  if (percent >= 85) return "#22c55e"; // green
  if (percent >= 70) return "#00B2C5"; // primary
  if (percent >= 55) return "#FECA41"; // yellow
  return "#f59e0b"; // orange
}

function buildCandidateCard(
  candidateName: string,
  match: MatchResult,
  index: number
): string {
  const matchColor = getMatchColor(match.overall_percent);
  const matchDesc = getMatchDescription(match.overall_percent);
  
  // Build strengths list
  const strengthsHtml = match.match_details.strengths.length > 0
    ? match.match_details.strengths.map(s => `<li style="color:#22c55e;margin-bottom:4px;">✓ ${s}</li>`).join("")
    : "<li style='color:#888;'>Brak wyróżniających się mocnych stron</li>";

  // Build competency breakdown
  const competencyRows = match.match_details.competenceDetails
    .map(c => {
      const name = competencyNames[c.competency] || c.competency;
      const statusIcon = c.status === 'excellent' ? '🌟' : c.status === 'good' ? '✓' : '○';
      const statusColor = c.status === 'excellent' ? '#22c55e' : c.status === 'good' ? '#00B2C5' : '#888';
      return `<tr><td style="padding:6px 0;color:#444;">${statusIcon} ${name}</td><td style="text-align:right;color:${statusColor};font-weight:bold;">${Math.round(c.matchPercent)}%</td></tr>`;
    })
    .join("");

  // Calculate culture score out of 30 (6 dimensions * 5 max)
  const cultureScore = Math.round((match.culture_percent / 100) * 30);
  
  // Build extra details
  const extraHtml = match.match_details.extraDetails
    .map(e => {
      const icon = e.matched ? '✓' : '✗';
      const color = e.matched ? '#22c55e' : '#ef4444';
      return `<span style="margin-right:12px;color:${color};">${icon} ${e.field}</span>`;
    })
    .join("");

  return `
    <div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:24px;overflow:hidden;border:1px solid #e5e7eb;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,${matchColor} 0%,${matchColor}dd 100%);padding:20px;color:white;">
        <table style="width:100%;">
          <tr>
            <td style="vertical-align:middle;">
              <span style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">Kandydat #${index + 1}</span>
              <h3 style="margin:5px 0 0 0;font-size:20px;font-weight:700;">${candidateName}</h3>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:10px 16px;display:inline-block;">
                <span style="font-size:32px;font-weight:800;">${match.overall_percent}%</span>
                <br/>
                <span style="font-size:11px;opacity:0.9;">${matchDesc}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Body -->
      <div style="padding:20px;">
        <!-- Match breakdown -->
        <table style="width:100%;margin-bottom:20px;">
          <tr>
            <td style="width:33%;text-align:center;padding:10px;border-right:1px solid #e5e7eb;">
              <div style="font-size:24px;font-weight:700;color:#00B2C5;">${match.competence_percent}%</div>
              <div style="font-size:12px;color:#666;">Kompetencje</div>
            </td>
            <td style="width:33%;text-align:center;padding:10px;border-right:1px solid #e5e7eb;">
              <div style="font-size:24px;font-weight:700;color:#00B2C5;">${cultureScore}/30</div>
              <div style="font-size:12px;color:#666;">Kultura organizacji</div>
            </td>
            <td style="width:33%;text-align:center;padding:10px;">
              <div style="font-size:24px;font-weight:700;color:#00B2C5;">${match.extra_percent}%</div>
              <div style="font-size:12px;color:#666;">Dopasowanie branżowe</div>
            </td>
          </tr>
        </table>
        
        <!-- Competency details -->
        <div style="background:#f9fafb;border-radius:8px;padding:15px;margin-bottom:15px;">
          <h4 style="margin:0 0 10px 0;color:#233448;font-size:14px;">📊 Szczegóły kompetencji</h4>
          <table style="width:100%;font-size:13px;">
            ${competencyRows}
          </table>
        </div>
        
        <!-- Strengths -->
        <div style="background:#f0fdf4;border-radius:8px;padding:15px;margin-bottom:15px;">
          <h4 style="margin:0 0 10px 0;color:#166534;font-size:14px;">💪 Dlaczego to dobre dopasowanie?</h4>
          <ul style="margin:0;padding-left:20px;font-size:13px;">
            ${strengthsHtml}
          </ul>
        </div>
        
        <!-- Extra criteria -->
        <div style="background:#fefce8;border-radius:8px;padding:15px;">
          <h4 style="margin:0 0 10px 0;color:#854d0e;font-size:14px;">📋 Kryteria formalne</h4>
          <div style="font-size:13px;">
            ${extraHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildMatchesEmail(
  companyName: string,
  candidateCards: string,
  matchCount: number,
  dashboardUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twoi dopasowani kandydaci - idealniepasuje</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa;line-height:1.6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa;">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" style="max-width:700px;margin:0 auto;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#233448 0%,#00B2C5 100%);padding:40px;border-radius:16px 16px 0 0;text-align:center;">
              <h1 style="color:#FECA41;margin:0;font-size:28px;">idealnie<span style="color:white;">pasuje</span></h1>
              <p style="color:rgba(255,255,255,0.9);margin:15px 0 0 0;font-size:16px;">
                Lista kandydatów dopasowanych do Twoich potrzeb
              </p>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="background:#f5f7fa;padding:30px 0;">
              
              <!-- Intro -->
              <div style="background:#fff;border-radius:12px;padding:25px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <p style="color:#233448;font-size:18px;margin:0 0 10px 0;">
                  Cześć <strong>${companyName}</strong>!
                </p>
                <p style="color:#555;font-size:16px;margin:0;">
                  ${matchCount > 0 
                    ? `Mamy świetną wiadomość! Znaleźliśmy <strong style="color:#00B2C5;">${matchCount} ${matchCount === 1 ? 'kandydata idealnie dopasowanego' : matchCount < 5 ? 'kandydatów idealnie dopasowanych' : 'kandydatów idealnie dopasowanych'}</strong> do Twoich potrzeb.`
                    : 'Twoja lista dopasowanych kandydatów:'
                  }
                </p>
              </div>
              
              <!-- Candidate cards -->
              ${candidateCards}
              
              <!-- CTA -->
              <div style="text-align:center;margin-top:30px;">
                <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#FECA41 0%,#f5b82e 100%);color:#233448;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(254,202,65,0.4);">
                  Zobacz wszystkich kandydatów w panelu
                </a>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#233448;padding:30px;border-radius:0 0 16px 16px;text-align:center;">
              <p style="color:#00B2C5;font-size:16px;font-weight:700;margin:0 0 10px 0;">
                Czy jesteś zainteresowany?
              </p>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 20px 0;">
                Zaloguj się do panelu, aby zobaczyć pełne profile kandydatów i podjąć decyzję.
              </p>
              <p style="color:#FECA41;font-size:14px;margin:0;">
                Pozdrawiamy,<br/>
                <strong>Zespół idealniepasuje</strong>
              </p>
              <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:20px 0 0 0;">
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

function buildNoMatchesEmail(companyName: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brak dopasowanych kandydatów - idealniepasuje</title>
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
                Cześć <strong>${companyName}</strong>!
              </p>
              
              <div style="background:#fef3c7;border-radius:12px;padding:25px;text-align:center;margin-bottom:25px;">
                <span style="font-size:48px;">🔍</span>
                <p style="color:#92400e;font-size:16px;margin:15px 0 0 0;font-weight:500;">
                  Niestety jeszcze nie znaleźliśmy kandydatów idealnie dopasowanych do Twoich potrzeb.
                </p>
              </div>
              
              <p style="color:#555;font-size:16px;margin:0 0 25px 0;">
                Ale nie martw się! Nasza baza kandydatów stale rośnie. Jeśli pojawią się nowe dopasowania do Twojego zapotrzebowania, <strong style="color:#00B2C5;">poinformujemy Cię mailowo</strong>.
              </p>
              
              <div style="background:#f0f9ff;border-left:4px solid #00B2C5;padding:15px 20px;border-radius:0 8px 8px 0;">
                <p style="color:#0369a1;font-size:14px;margin:0;">
                  💡 <strong>Wskazówka:</strong> Upewnij się, że Twój profil pracodawcy jest kompletny - to zwiększa szanse na znalezienie idealnego kandydata!
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#FECA41;font-size:14px;margin:0;">
                Pozdrawiamy,<br/>
                <strong style="color:#233448;">Zespół idealniepasuje</strong>
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
    const { employer_user_id, employer_email, dashboard_url }: MatchSummaryRequest = await req.json();

    if (!employer_user_id || !employer_email) {
      throw new Error("Missing required fields: employer_user_id and employer_email");
    }

    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailAppPassword) {
      throw new Error("GMAIL_APP_PASSWORD not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get employer profile
    const { data: employerProfile } = await supabase
      .from("employer_profiles")
      .select("company_name")
      .eq("user_id", employer_user_id)
      .single();

    const companyName = employerProfile?.company_name || "Pracodawco";

    // Get all matches for this employer
    const { data: matches, error: matchesError } = await supabase
      .from("match_results")
      .select("*")
      .eq("employer_user_id", employer_user_id)
      .order("overall_percent", { ascending: false });

    if (matchesError) {
      throw new Error(`Failed to fetch matches: ${matchesError.message}`);
    }

    let emailHtml: string;
    let emailSubject: string;

    if (!matches || matches.length === 0) {
      // No matches found
      emailHtml = buildNoMatchesEmail(companyName);
      emailSubject = "Szukamy dla Ciebie kandydatów - idealniepasuje";
    } else {
      // Build candidate cards
      const candidateCards: string[] = [];
      
      for (const match of matches.slice(0, 10)) { // Limit to top 10
        // Get candidate name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", match.candidate_user_id)
          .single();

        const candidateName = profile?.full_name || `Kandydat ${match.candidate_user_id.slice(0, 8)}`;
        
        candidateCards.push(
          buildCandidateCard(candidateName, match as MatchResult, candidateCards.length)
        );
      }

      const dashboardLink = dashboard_url || "https://idealniepasuje.lovable.app/employer/candidates";
      emailHtml = buildMatchesEmail(companyName, candidateCards.join(""), matches.length, dashboardLink);
      emailSubject = `🎉 ${matches.length} ${matches.length === 1 ? 'kandydat dopasowany' : 'kandydatów dopasowanych'} do Twojej oferty - idealniepasuje`;
    }

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
      to: employer_email,
      subject: emailSubject,
      content: "auto",
      html: emailHtml,
    });

    await client.close();

    console.log(`Employer match summary email sent to ${employer_email} with ${matches?.length || 0} matches`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Employer match summary email sent",
        matches_count: matches?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-employer-match-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
