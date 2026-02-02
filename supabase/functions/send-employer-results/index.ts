import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  employer_user_id: string;
  employer_email: string;
  feedback_url: string;
}

const competencyNames: Record<string, { pl: string; en: string }> = {
  komunikacja: { pl: "Komunikacja", en: "Communication" },
  myslenie_analityczne: { pl: "Myślenie analityczne", en: "Analytical thinking" },
  out_of_the_box: { pl: "Kreatywność", en: "Out of the box thinking" },
  determinacja: { pl: "Determinacja", en: "Determination" },
  adaptacja: { pl: "Adaptacja", en: "Adaptation" },
};

const competencyDescriptions: Record<string, { pl: string; en: string }> = {
  komunikacja: { 
    pl: "Preferujesz kandydatów z rozwiniętymi umiejętnościami komunikacyjnymi i współpracy zespołowej.",
    en: "You prefer candidates with strong communication and team collaboration skills."
  },
  myslenie_analityczne: { 
    pl: "Szukasz osób zdolnych do logicznego analizowania problemów i podejmowania trafnych decyzji.",
    en: "You're looking for people capable of logically analyzing problems and making sound decisions."
  },
  out_of_the_box: { 
    pl: "Cenisz kreatywność i innowacyjne podejście do rozwiązywania wyzwań.",
    en: "You value creativity and innovative approaches to solving challenges."
  },
  determinacja: { 
    pl: "Poszukujesz kandydatów wytrwałych w dążeniu do celów mimo przeszkód.",
    en: "You're seeking candidates who persevere in pursuing goals despite obstacles."
  },
  adaptacja: { 
    pl: "Potrzebujesz osób elastycznych i zdolnych do szybkiego przystosowania się do zmian.",
    en: "You need people who are flexible and able to quickly adapt to changes."
  },
};

const cultureDescriptions: Record<string, { pl: string; en: string }> = {
  relacja_wspolpraca: { 
    pl: "Relacje i współpraca zespołowa",
    en: "Relationships and team collaboration"
  },
  elastycznosc_innowacyjnosc: { 
    pl: "Elastyczność i otwartość na innowacje",
    en: "Flexibility and openness to innovation"
  },
  wyniki_cele: { 
    pl: "Orientacja na wyniki i cele",
    en: "Results and goal orientation"
  },
  stabilnosc_struktura: { 
    pl: "Stabilność i struktura organizacyjna",
    en: "Stability and organizational structure"
  },
  autonomia_styl_pracy: { 
    pl: "Autonomia i preferowany styl pracy",
    en: "Autonomy and preferred work style"
  },
  wlb_dobrostan: { 
    pl: "Work-life balance i dobrostan",
    en: "Work-life balance and wellbeing"
  },
};

function getScoreLevel(score: number): { pl: string; en: string } {
  if (score >= 4) return { pl: "Bardzo ważne", en: "Very important" };
  if (score >= 2.5) return { pl: "Umiarkowane", en: "Moderate" };
  return { pl: "Mniej istotne", en: "Less important" };
}

function getCultureDescription(code: string, score: number): string {
  const level = getScoreLevel(score);
  const dimName = cultureDescriptions[code]?.pl || code;
  
  if (score >= 4) {
    return `${dimName} - bardzo wysoki priorytet w Twojej organizacji`;
  } else if (score >= 2.5) {
    return `${dimName} - umiarkowane znaczenie`;
  }
  return `${dimName} - mniejszy nacisk w codziennej pracy`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employer_user_id, employer_email, feedback_url }: EmailRequest = await req.json();

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

    // Get employer profile and name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", employer_user_id)
      .single();

    const { data: employerProfile } = await supabase
      .from("employer_profiles")
      .select("*")
      .eq("user_id", employer_user_id)
      .single();

    if (!employerProfile) {
      throw new Error("Employer profile not found");
    }

    const employerName = profile?.full_name || "Pracodawco";
    const companyName = employerProfile.company_name || "Twoja firma";
    const feedbackLink = feedback_url || "https://idealniepasuje.lovable.app/employer/feedback";

    // Build competency requirements HTML
    const competencyReqs = [
      { key: 'komunikacja', value: employerProfile.req_komunikacja },
      { key: 'myslenie_analityczne', value: employerProfile.req_myslenie_analityczne },
      { key: 'out_of_the_box', value: employerProfile.req_out_of_the_box },
      { key: 'determinacja', value: employerProfile.req_determinacja },
      { key: 'adaptacja', value: employerProfile.req_adaptacja },
    ].filter(c => c.value != null);

    let competencyHtml = '';
    for (const comp of competencyReqs) {
      const name = competencyNames[comp.key]?.pl || comp.key;
      const level = getScoreLevel(comp.value || 3);
      const desc = competencyDescriptions[comp.key]?.pl || '';
      
      competencyHtml += `
        <tr>
          <td style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
            <table role="presentation" style="width: 100%;">
              <tr>
                <td>
                  <p style="margin: 0 0 5px 0; font-weight: 600; color: #233448; font-size: 16px;">${name}</p>
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${desc}</p>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <span style="background: linear-gradient(135deg, #00B2C5, #00a3b4); color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">${comp.value}/5</span>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <p style="margin: 5px 0 0 0; color: #888; font-size: 13px;">Poziom oczekiwań: <strong>${level.pl}</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height: 10px;"></td></tr>
      `;
    }

    // Build culture profile HTML
    const cultureScores = [
      { key: 'relacja_wspolpraca', value: employerProfile.culture_relacja_wspolpraca },
      { key: 'elastycznosc_innowacyjnosc', value: employerProfile.culture_elastycznosc_innowacyjnosc },
      { key: 'wyniki_cele', value: employerProfile.culture_wyniki_cele },
      { key: 'stabilnosc_struktura', value: employerProfile.culture_stabilnosc_struktura },
      { key: 'autonomia_styl_pracy', value: employerProfile.culture_autonomia_styl_pracy },
      { key: 'wlb_dobrostan', value: employerProfile.culture_wlb_dobrostan },
    ].filter(c => c.value != null);

    let cultureHtml = '';
    for (const cult of cultureScores) {
      const desc = getCultureDescription(cult.key, cult.value || 3);
      cultureHtml += `
        <tr>
          <td style="padding: 12px 15px; background: #f0f9fa; border-left: 3px solid #00B2C5; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #233448; font-size: 14px;">${desc}</p>
            <p style="margin: 5px 0 0 0; color: #00B2C5; font-size: 13px; font-weight: 600;">Wynik: ${(cult.value || 0).toFixed(1)}/5</p>
          </td>
        </tr>
        <tr><td style="height: 8px;"></td></tr>
      `;
    }

    const emailHtml = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Podsumowanie profilu pracodawcy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Lato', 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #00B2C5 0%, #233448 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                Dziękujemy za wypełnienie formularzy!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                Oto podsumowanie Twojego profilu pracodawcy
              </p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="color: #233448; font-size: 18px; margin: 0;">
                Cześć <strong>${employerName}</strong>,
              </p>
              <p style="color: #555; font-size: 15px; margin: 15px 0 0 0;">
                Dziękujemy za wypełnienie formularzy w naszym prototypie serwisu rekrutacyjnego. Poniżej znajdziesz podsumowanie preferowanych kompetencji od potencjalnego kandydata.
              </p>
            </td>
          </tr>
          
          <!-- Competency Requirements Section -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="color: #233448; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #00B2C5;">
                📊 Preferowane kompetencje kandydata
              </h2>
              <table role="presentation" style="width: 100%;">
                ${competencyHtml}
              </table>
            </td>
          </tr>
          
          <!-- Culture Section -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="color: #233448; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #FECA41;">
                🏢 Kultura organizacji pracy w Twojej firmie
              </h2>
              <table role="presentation" style="width: 100%;">
                ${cultureHtml}
              </table>
            </td>
          </tr>
          
          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <div style="background: linear-gradient(135deg, #f0f9fa 0%, #e8f4f5 100%); border-radius: 12px; padding: 20px;">
                <h3 style="color: #233448; font-size: 16px; margin: 0 0 12px 0;">Co dalej?</h3>
                <p style="color: #555; font-size: 14px; margin: 0 0 10px 0;">
                  ✉️ Jeśli w naszej bazie pojawi się kandydat spełniający Twoje oczekiwania, od razu poinformujemy Cię mailowo o dopasowaniu.
                </p>
                <p style="color: #555; font-size: 14px; margin: 0;">
                  🔍 Aktywnie szukamy kandydatów, którzy najlepiej pasują do Twojego profilu organizacji.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Feedback Request -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #fff9e6; border: 1px solid #FECA41; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="color: #233448; font-size: 15px; margin: 0 0 15px 0;">
                  <strong>Bardzo dziękujemy za udział w badaniu!</strong><br>
                  Rozwijamy nasz pomysł i sprawdzamy, czy działa w taki sposób, aby łączył odpowiedniego kandydata z odpowiednim pracodawcą.
                </p>
                <p style="color: #666; font-size: 14px; margin: 0 0 20px 0;">
                  Jeśli chcesz nam jeszcze bardziej pomóc, będziemy wdzięczni za wypełnienie krótkiej ankiety.
                </p>
                <a href="${feedbackLink}" style="display: inline-block; background: linear-gradient(135deg, #FECA41 0%, #f5b82e 100%); color: #233448; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(254, 202, 65, 0.4);">
                  Wypełnij ankietę
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Prototype Note -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <p style="color: #888; font-size: 13px; margin: 0; font-style: italic;">
                Pamiętaj, wiemy że jeszcze wiele pracy przed nami - obecnie prezentowany format to prototyp. Docelowo chcemy, aby każdy użytkownik miał swój profil, podgląd do danych i był informowany o wynikach na bieżąco w serwisie.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
                Powodzenia w rekrutacji!
              </p>
              <p style="color: #00B2C5; font-size: 16px; font-weight: 700; margin: 0;">
                Zespół <span style="color: #233448;">idealnie</span><span style="color: #FECA41;">pasuje</span>
              </p>
              <p style="color: #aaa; font-size: 12px; margin: 15px 0 0 0;">
                © 2026 idealniepasuje. Wszystkie prawa zastrzeżone.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

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
      to: employer_email,
      subject: `📊 Podsumowanie Twojego profilu pracodawcy - ${companyName}`,
      content: "auto",
      html: emailHtml,
    });

    await client.close();

    console.log(`Employer results email sent to ${employer_email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Employer results email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-employer-results function:", error);
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
