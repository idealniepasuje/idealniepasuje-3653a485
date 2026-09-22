import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { isValidEmail, sanitizeHeader } from "../_shared/email-validation.ts";
import { escapeHtml } from "../_shared/html.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const token = authHeader.replace("Bearer ", "");

    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);

    const callerId = claimsData?.claims?.sub as string | undefined;

    if (claimsErr || !callerId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();

    const organizationId = body?.organization_id;
    const jobOfferId = body?.job_offer_id;
    const email = body?.email;

    if (!organizationId || !jobOfferId || !email) {
      return json(
        {
          error:
            "organization_id, job_offer_id and email are required",
        },
        400,
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return json({ error: "Nieprawidłowy adres e-mail" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Osoba wysyłająca zaproszenie musi zarządzać organizacją.
    const { data: membership, error: membershipError } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", callerId)
      .maybeSingle();

    if (membershipError) {
      console.error("invite-employee membership error", membershipError);
      return json({ error: "Internal server error" }, 500);
    }

    if (
      !membership ||
      !["owner", "admin"].includes(membership.role)
    ) {
      return json({ error: "Forbidden" }, 403);
    }

    // Pobieramy organizację.
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgError) {
      console.error("invite-employee organization error", orgError);
      return json({ error: "Internal server error" }, 500);
    }

    if (!org) {
      return json({ error: "Organization not found" }, 404);
    }

    // Oferta musi należeć do tej samej organizacji i obsługiwać
    // zaproszonych kandydatów.
    const { data: offer, error: offerError } = await admin
      .from("job_offers")
      .select("id, title, organization_id, analyze_internal_team")
      .eq("id", jobOfferId)
      .maybeSingle();

    if (offerError) {
      console.error("invite-employee offer error", offerError);
      return json({ error: "Internal server error" }, 500);
    }

    if (!offer) {
      return json({ error: "Oferta nie istnieje" }, 404);
    }

    if (offer.organization_id !== organizationId) {
      return json(
        { error: "Oferta nie należy do tej organizacji" },
        403,
      );
    }

    if (!offer.analyze_internal_team) {
      return json(
        {
          error:
            "Ta oferta nie obsługuje zaproszonych kandydatów",
        },
        400,
      );
    }

    // Zaproszenie jest unikalne dla:
    // organizacja + oferta + e-mail.
    //
    // Ta sama osoba może być zaproszona do kilku różnych ofert.
    const { data: existingInvite, error: existingInviteError } =
      await admin
        .from("organization_invitations")
        .select("id, token, status, job_offer_id")
        .eq("organization_id", organizationId)
        .eq("job_offer_id", jobOfferId)
        .eq("status", "pending")
        .ilike("email", normalizedEmail)
        .maybeSingle();

    if (existingInviteError) {
      console.error(
        "invite-employee existing invitation error",
        existingInviteError,
      );
      return json({ error: "Internal server error" }, 500);
    }

    let invitation = existingInvite;

    if (!invitation) {
      const { data: created, error: insertErr } = await admin
        .from("organization_invitations")
        .insert({
          organization_id: organizationId,
          job_offer_id: jobOfferId,
          email: normalizedEmail,
          invited_by: callerId,
        })
        .select("id, token, status, job_offer_id")
        .single();

      if (insertErr) {
        if ((insertErr as any).code === "23505") {
          return json(
            {
              error:
                "Zaproszenie tego kandydata do tej oferty już istnieje",
            },
            409,
          );
        }

        console.error("invite-employee insert error", insertErr);

        return json(
          { error: "Nie udało się utworzyć zaproszenia" },
          500,
        );
      }

      invitation = created;
    }

    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    const companyName = sanitizeHeader(org.name || "Firma");
    const offerTitle = sanitizeHeader(offer.title || "oferta pracy");

    const siteUrl =
      Deno.env.get("SITE_URL") || "https://idealniepasuje.pl";

    const link =
      `${siteUrl}/candidate/organizations?invite=${invitation!.token}`;

    // Zaproszenie zapisujemy nawet wtedy, gdy wysyłka maila się nie uda.
    if (!gmailAppPassword) {
      return json(
        {
          success: true,
          email_sent: false,
          invitation_id: invitation!.id,
          job_offer_id: jobOfferId,
        },
        207,
      );
    }

    const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
</head>

<body
  style="
    margin:0;
    padding:0;
    font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;
    background-color:#f5f7fa;
    line-height:1.6;
  "
>
  <table
    role="presentation"
    style="
      width:100%;
      border-collapse:collapse;
      background-color:#f5f7fa;
    "
  >
    <tr>
      <td style="padding:40px 20px;">

        <table
          role="presentation"
          style="
            max-width:600px;
            margin:0 auto;
            background-color:#ffffff;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 4px 24px rgba(0,0,0,0.08);
          "
        >

          <tr>
            <td
              style="
                background:linear-gradient(
                  135deg,
                  #00B2C5 0%,
                  #233448 100%
                );
                padding:40px 30px;
                text-align:center;
              "
            >
              <h1
                style="
                  color:#ffffff;
                  margin:0;
                  font-size:26px;
                  font-weight:700;
                "
              >
                Zaproszenie do sprawdzenia dopasowania
              </h1>

              <p
                style="
                  color:rgba(255,255,255,0.9);
                  margin:10px 0 0 0;
                  font-size:15px;
                "
              >
                ${escapeHtml(companyName)}
                zaprasza Cię do oferty
                „${escapeHtml(offerTitle)}”
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 30px;">

              <p
                style="
                  color:#555;
                  font-size:16px;
                  margin:0 0 20px 0;
                "
              >
                Firma
                <strong style="color:#00B2C5;">
                  ${escapeHtml(companyName)}
                </strong>
                zaprasza Cię do sprawdzenia Twojego dopasowania
                do oferty
                <strong>
                  ${escapeHtml(offerTitle)}
                </strong>
                w serwisie idealniepasuje.
              </p>

              <p
                style="
                  color:#555;
                  font-size:15px;
                  margin:0 0 20px 0;
                "
              >
                Akceptacja zaproszenia nie zmieni ustawień
                Twojego konta ani wyników testów.
                Firma otrzyma dostęp do danych potrzebnych
                wyłącznie do sprawdzenia Twojego dopasowania
                do tej konkretnej oferty.
              </p>

              <p
                style="
                  color:#555;
                  font-size:15px;
                  margin:0 0 20px 0;
                "
              >
                Zaproszenie możesz zaakceptować albo odrzucić.
              </p>

              <table
                role="presentation"
                style="width:100%;margin-top:20px;"
              >
                <tr>
                  <td style="text-align:center;">
                    <a
                      href="${link}"
                      style="
                        display:inline-block;
                        background:linear-gradient(
                          135deg,
                          #FECA41 0%,
                          #f5b82e 100%
                        );
                        color:#233448;
                        text-decoration:none;
                        padding:16px 40px;
                        border-radius:8px;
                        font-weight:700;
                        font-size:16px;
                      "
                    >
                      Zobacz zaproszenie
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td
              style="
                background-color:#f8f9fa;
                padding:25px 30px;
                text-align:center;
                border-top:1px solid #eee;
              "
            >
              <p
                style="
                  color:#00B2C5;
                  font-size:16px;
                  font-weight:700;
                  margin:0;
                "
              >
                Zespół
                <span style="color:#233448;">
                  idealnie
                </span>
                <span style="color:#FECA41;">
                  pasuje
                </span>
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

    try {
      const client = new SMTPClient({
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

      await client.send({
        from:
          "idealniepasuje <idealnyserwisrekrutacyjny@gmail.com>",
        to: normalizedEmail,
        subject:
          `${companyName} zaprasza Cię do oferty „${offerTitle}”`,
        content: "auto",
        html,
      });

      await client.close();
    } catch (mailErr) {
      console.error("invite-employee smtp error", mailErr);

      return json(
        {
          success: true,
          email_sent: false,
          invitation_id: invitation!.id,
          job_offer_id: jobOfferId,
        },
        207,
      );
    }

    return json({
      success: true,
      email_sent: true,
      invitation_id: invitation!.id,
      job_offer_id: jobOfferId,
    });
  } catch (error) {
    console.error("invite-employee error", error);
    return json({ error: "Internal server error" }, 500);
  }
});