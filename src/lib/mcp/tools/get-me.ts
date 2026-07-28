import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function sbForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_me",
  title: "Get my profile",
  description:
    "Return the currently signed-in idealniepasuje user: user id, email, user type (candidate or employer), and either the candidate additional info or the employer company profile.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = sbForUser(ctx);
    const userId = ctx.getUserId();

    const { data: profile } = await sb
      .from("profiles")
      .select("user_type, full_name")
      .eq("user_id", userId!)
      .maybeSingle();

    let extra: unknown = null;
    if (profile?.user_type === "candidate") {
      const { data } = await sb
        .from("candidate_test_results")
        .select("industry, position_level, experience, city, work_mode, linkedin_url, all_tests_completed, profile_ready")
        .eq("user_id", userId!)
        .maybeSingle();
      extra = data;
    } else if (profile?.user_type === "employer") {
      const { data } = await sb
        .from("employer_profiles")
        .select("company_name, city, culture_completed")
        .eq("user_id", userId!)
        .maybeSingle();
      extra = data;
    }

    const payload = {
      user_id: userId,
      email: ctx.getUserEmail?.() ?? null,
      user_type: profile?.user_type ?? null,
      full_name: profile?.full_name ?? null,
      details: extra,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload as Record<string, unknown>,
    };
  },
});
