import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

const competencyDescriptions: Record<string, { pl: string; en: string }> = {
  komunikacja: { 
    pl: "Umiejętność efektywnego przekazywania informacji i współpracy z innymi",
    en: "Ability to effectively communicate information and collaborate with others"
  },
  myslenie_analityczne: { 
    pl: "Zdolność do logicznego analizowania problemów i podejmowania decyzji",
    en: "Ability to logically analyze problems and make decisions"
  },
  out_of_the_box: { 
    pl: "Kreatywność i innowacyjne podejście do rozwiązywania problemów",
    en: "Creativity and innovative approach to problem-solving"
  },
  determinacja: { 
    pl: "Wytrwałość w dążeniu do celów mimo przeszkód",
    en: "Persistence in pursuing goals despite obstacles"
  },
  adaptacja: { 
    pl: "Elastyczność i zdolność przystosowania się do zmian",
    en: "Flexibility and ability to adapt to changes"
  },
};

const cultureDescriptions: Record<string, { pl: string; en: string }> = {
  relacja_wspolpraca: { 
    pl: "Relacje i współpraca w zespole",
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
  if (score >= 4) return { pl: "Wysoki", en: "High" };
  if (score >= 2.5) return { pl: "Średni", en: "Medium" };
  return { pl: "Niski", en: "Low" };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { candidate_user_id, candidate_email, feedback_url }: EmailRequest = await req.json();

    if (!candidate_user_id || !candidate_email) {
      throw new Error("Missing required fields: candidate_user_id and candidate_email");
    }

    // Fetch candidate test results
    const { data: testResults, error: testError } = await supabase
      .from("candidate_test_results")
      .select("*")
      .eq("user_id", candidate_user_id)
      .single();

    if (testError || !testResults) {
      throw new Error("Could not fetch candidate test results");
    }

    // Build competency results HTML
    const competencyScores = [
      { key: "komunikacja", score: testResults.komunikacja_score },
      { key: "myslenie_analityczne", score: testResults.myslenie_analityczne_score },
      { key: "out_of_the_box", score: testResults.out_of_the_box_score },
      { key: "determinacja", score: testResults.determinacja_score },
      { key: "adaptacja", score: testResults.adaptacja_score },
    ].filter(c => c.score !== null);

    const competencyHtml = competencyScores.map(c => {
      const level = getScoreLevel(c.score);
      const desc = competencyDescriptions[c.key];
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${desc?.pl || c.key}</strong><br/>
            <span style="color: #666; font-size: 14px;">${level.pl} (${c.score?.toFixed(1)}/5)</span>
          </td>
        </tr>
      `;
    }).join("");

    // Build culture results HTML
    const cultureScores = [
      { key: "relacja_wspolpraca", score: testResults.culture_relacja_wspolpraca },
      { key: "elastycznosc_innowacyjnosc", score: testResults.culture_elastycznosc_innowacyjnosc },
      { key: "wyniki_cele", score: testResults.culture_wyniki_cele },
      { key: "stabilnosc_struktura", score: testResults.culture_stabilnosc_struktura },
      { key: "autonomia_styl_pracy", score: testResults.culture_autonomia_styl_pracy },
      { key: "wlb_dobrostan", score: testResults.culture_wlb_dobrostan },
    ].filter(c => c.score !== null);

    const cultureHtml = cultureScores.map(c => {
      const level = getScoreLevel(c.score);
      const desc = cultureDescriptions[c.key];
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${desc?.pl || c.key}</strong><br/>
            <span style="color: #666; font-size: 14px;">${level.pl} (${c.score?.toFixed(1)}/5)</span>
          </td>
        </tr>
      `;
    }).join("");

    // Build additional info HTML
    const additionalHtml = `
      <tr><td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Branża:</strong> ${testResults.industry || "Nie podano"}</td></tr>
      <tr><td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Doświadczenie:</strong> ${testResults.experience || "Nie podano"}</td></tr>
      <tr><td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Poziom stanowiska:</strong> ${testResults.position_level || "Nie podano"}</td></tr>
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Twoje wyniki - idealniepasuje</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #233448 0%, #00B2C5 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #FECA41; margin: 0; font-size: 28px;">idealnie<span style="color: white;">pasuje</span></h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #233448; margin-top: 0;">Cześć!</h2>
          
          <p style="color: #444; line-height: 1.6;">
            Bardzo dziękujemy za utworzenie profilu w naszym prototypie serwisu rekrutacyjnego. 
            Poniżej znajdziesz podsumowanie Twoich formularzy.
          </p>
          
          <h3 style="color: #00B2C5; border-bottom: 2px solid #00B2C5; padding-bottom: 10px; margin-top: 30px;">
            📋 Formularz kompetencji
          </h3>
          <p style="color: #666; font-size: 14px;">
            Wyniki odzwierciedlają Twoje predyspozycje zawodowe i mocne strony.
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            ${competencyHtml}
          </table>
          
          <h3 style="color: #00B2C5; border-bottom: 2px solid #00B2C5; padding-bottom: 10px; margin-top: 30px;">
            🏢 Kultura organizacji
          </h3>
          <p style="color: #666; font-size: 14px;">
            Twoje preferencje dotyczące środowiska i atmosfery pracy.
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            ${cultureHtml}
          </table>
          
          <h3 style="color: #00B2C5; border-bottom: 2px solid #00B2C5; padding-bottom: 10px; margin-top: 30px;">
            📝 Dane dodatkowe
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${additionalHtml}
          </table>
          
          <div style="background: #FECA41; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
            <p style="color: #233448; margin: 0 0 10px 0; font-weight: bold;">
              Pamiętaj - nie ma dobrych ani złych odpowiedzi!
            </p>
            <p style="color: #233448; margin: 0; font-size: 14px;">
              Badamy dopasowanie idealnego kandydata do idealnego pracodawcy.
            </p>
          </div>
          
          ${feedback_url ? `
          <div style="margin-top: 30px; padding: 20px; border: 2px dashed #00B2C5; border-radius: 8px; text-align: center;">
            <p style="color: #444; margin: 0 0 15px 0;">
              Jeśli chcesz podzielić się swoją opinią na temat naszego narzędzia, 
              prosimy odpowiedz na kilka pytań w formularzu poniżej.
            </p>
            <p style="color: #666; font-size: 14px; margin: 0 0 15px 0;">
              Twoja opinia pomoże nam dopracować nasz pomysł, aby był jeszcze lepszy!
            </p>
            <a href="${feedback_url}" style="display: inline-block; background: #00B2C5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Wypełnij ankietę
            </a>
          </div>
          ` : ""}
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
            Jeśli w naszej bazie pojawi się zapotrzebowanie na Twoje kompetencje, 
            od razu poinformujemy Cię mailowo o dopasowaniu z pracodawcą.
          </p>
        </div>
        
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px;">
          © 2026 idealniepasuje. Wszystkie prawa zastrzeżone.
        </p>
      </body>
      </html>
    `;

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "idealniepasuje <noreply@idealniepasuje.pl>",
        to: [candidate_email],
        subject: "Twoje wyniki testów - idealniepasuje",
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(emailResult)}`);
    }

    console.log("Results email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResponse: emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-candidate-results function:", error);
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
