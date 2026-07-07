import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json().catch(() => ({}));
    const candidate_user_id: string | undefined = body?.candidate_user_id;
    if (!candidate_user_id) throw new Error("Missing candidate_user_id");

    const admin = createClient(supabaseUrl, serviceKey);

    // Employer must have a considering/unlocked match with this candidate
    const { data: matchRows } = await admin
      .from("match_results")
      .select("id, status, unlocked_at")
      .eq("employer_user_id", userData.user.id)
      .eq("candidate_user_id", candidate_user_id)
      .limit(5);
    const allowed = (matchRows || []).some(
      (m: any) => m.status === "considering" || m.unlocked_at,
    );
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: candUser } = await admin.auth.admin.getUserById(candidate_user_id);
    const email = candUser?.user?.email || null;

    const { data: profile } = await admin
      .from("candidate_test_results")
      .select("phone")
      .eq("user_id", candidate_user_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ email, phone: (profile as any)?.phone || null }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e) {
    console.error("get-candidate-contact error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
