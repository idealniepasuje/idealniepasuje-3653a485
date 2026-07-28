import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMeTool from "./tools/get-me";
import listMyMatchesTool from "./tools/list-my-matches";
import listMyOffersTool from "./tools/list-my-offers";

// Build the OAuth issuer from the Supabase project ref so it matches the
// discovery document's issuer exactly (RFC 8414 §3.3). Do not derive from
// SUPABASE_URL — on Lovable Cloud that may be a proxy host.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "idealniepasuje-mcp",
  title: "idealnie pasuje",
  version: "0.1.0",
  instructions:
    "Tools for the idealnie pasuje recruitment platform. Use `get_me` to identify the signed-in user (candidate or employer). Use `list_my_matches` to see match results, and `list_my_offers` (employers only) to list posted job offers. All data is scoped to the signed-in user by RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMeTool, listMyMatchesTool, listMyOffersTool],
});
