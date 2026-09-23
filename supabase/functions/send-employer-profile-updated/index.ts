import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import {
  isValidEmail,
  sanitizeHeader,
} from "../_shared/email-validation.ts";
import { escapeHtml } from "../_shared/html.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const token = authHeader.replace("Bearer ", "");

    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);

    const candidateUserId = claimsData?.claims?.sub as
      | string
      | undefined;

    if (claimsError || !candidateUserId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const body = await req.json();

    const requestIds = Array.isArray(body?.request_ids)
      ? body.request_ids.filter(
          (id: unknown) => typeof id === "string",
        )
      : [];

    if (requestIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing request_ids" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Kandydat może powiadomić tylko o swoich własnych,
    // faktycznie obsłużonych prośbach missing_additional.
    const { data: requests, error: requestsError } =
      await admin
        .from("candidate_messages")
        .select(
          "id, match_result_id, candidate_user_id, employer_user_id, read_at, metadata",
        )
        .in("id", requestIds)
        .eq("candidate_user_id", candidateUserId)
        .eq("type", "profile_completion")
        .eq("metadata->>request", "missing_additional")
        .not("read_at", "is", null);

    if (requestsError) {
      throw requestsError;
    }

    if (!requests || requests.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          emails_sent: 0,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const gmailAppPassword =
      Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailAppPassword) {
      throw new Error(
        "GMAIL_APP_PASSWORD not configured",
      );
    }

    const siteUrl =
      Deno.env.get("SITE_URL") ||
      "https://idealniepasuje.pl";

    let emailsSent = 0;

    for (const request of requests) {
      if (!request.match_result_id) continue;

      const { data: match } = await admin
        .from("match_results")
        .select(
          "id, employer_user_id, candidate_user_id, job_offer_id",
        )
        .eq("id", request.match_result_id)
        .eq(
          "candidate_user_id",
          candidateUserId,
        )
        .eq(
          "employer_user_id",
          request.employer_user_id,
        )
        .maybeSingle();

      if (!match) continue;

      const { data: employerUser } =
        await admin.auth.admin.getUserById(
          request.employer_user_id,
        );

      const employerEmail =
        employerUser?.user?.email;

      if (
        !employerEmail ||
        !isValidEmail(employerEmail)
      ) {
        continue;
      }

      const { data: employerProfile } =
        await admin
          .from("employer_profiles")
          .select("company_name")
          .eq(
            "user_id",
            request.employer_user_id,
          )
          .maybeSingle();

      let offerTitle = "Twojej oferty";

      if (match.job_offer_id) {
        const { data: offer } = await admin
          .from("job_offers")
          .select("title")
          .eq("id", match.job_offer_id)
          .maybeSingle();

        if (offer?.title) {
          offerTitle = offer.title;
        }
      }

      const companyName = sanitizeHeader(
        employerProfile?.company_name ||
          "Pracodawco",
      );

      const candidateShortId =
        candidateUserId.slice(0, 8);

      const candidateUrl =
        `${siteUrl}/employer/candidate/` +
        `${candidateUserId}` +
        `?matchId=${encodeURIComponent(match.id)}` +
        (match.job_offer_id
          ? `&offerId=${encodeURIComponent(
              match.job_offer_id,
            )}`
          : "");

      const emailHtml = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
</head>

<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f7fa;line-height:1.6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#f5f7fa;">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#00B2C5 0%,#233448 100%);padding:40px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;">
                Kandydat uzupełnił dane
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 30px;">
              <p style="color:#233448;font-size:18px;margin:0 0 20px;">
                Cześć ${escapeHtml(companyName)}!
              </p>

              <p style="color:#555;font-size:16px;margin:0 0 20px;">
                Kandydat <strong>#${escapeHtml(candidateShortId)}</strong>
                uzupełnił informacje, o które prosiłeś w procesie rekrutacji do oferty:
              </p>

              <p style="color:#233448;font-size:17px;font-weight:700;margin:0 0 24px;">
                ${escapeHtml(offerTitle)}
              </p>

              <p style="color:#555;font-size:16px;margin:0 0 25px;">
                Wynik dopasowania został ponownie przeliczony.
                Możesz teraz zobaczyć zaktualizowany profil kandydata.
              </p>

              <table role="presentation" style="width:100%;">
                <tr>
                  <td style="text-align:center;">
                    <a
                      href="${candidateUrl}"
                      style="display:inline-block;background:#FECA41;color:#233448;text-decoration:none;padding:16px 36px;border-radius:8px;font-weight:700;font-size:16px;"
                    >
                      Zobacz zaktualizowany profil
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#00B2C5;font-size:16px;font-weight:700;margin:0;">
                Zespół
                <span style="color:#233448;"> idealnie</span><span style="color:#FECA41;">pasuje</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const smtp = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 465,
          tls: true,
          auth: {
            username:
              "idealnyserwisrekrutacyjny@gmail.com",
            password: gmailAppPassword,
          },
        },
      });

      try {
        await smtp.send({
          from:
            "idealniepasuje <idealnyserwisrekrutacyjny@gmail.com>",
          to: employerEmail,
          subject:
            `Kandydat uzupełnił dane – ${offerTitle}`,
          content:
            `Kandydat #${candidateShortId} uzupełnił dane dla oferty ${offerTitle}. Wynik dopasowania został zaktualizowany.`,
          html: emailHtml,
        });

        emailsSent += 1;
      } finally {
        try {
          await smtp.close();
        } catch {
          // ignore
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: emailsSent,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error(
      "send-employer-profile-updated error:",
      error,
    );

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
});