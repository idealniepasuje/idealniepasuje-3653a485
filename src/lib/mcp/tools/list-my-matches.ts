import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sbForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_my_matches",
  title: "List my matches",
  description:
    "List match results visible to the signed-in user. For candidates: matches with employer job offers. For employers: matches for their own job offers. Returns overall match percentage, status and linked offer/candidate ids.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).describe("Max number of matches to return.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = sbForUser(ctx);
    const { data, error } = await sb
      .from("match_results")
      .select("id, candidate_user_id, employer_user_id, job_offer_id, overall_percent, status, created_at")
      .order("overall_percent", { ascending: false })
      .limit(limit ?? 20);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { matches: data ?? [] },
    };
  },
});
