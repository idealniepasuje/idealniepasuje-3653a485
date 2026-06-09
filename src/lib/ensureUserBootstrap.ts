import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";

export type AppUserType = "candidate" | "employer";

const getUserTypeFromMetadata = (user: User): AppUserType => {
  const raw = (user.user_metadata as any)?.user_type;
  return raw === "employer" ? "employer" : "candidate";
};

const getFullNameFromMetadata = (user: User): string | null => {
  const meta = user.user_metadata as any;
  return (meta?.full_name || meta?.name || null) as string | null;
};

/**
 * Best-effort bootstrap that makes sure core rows exist for the logged-in user:
 * - public.profiles
 * - public.employer_profiles OR public.candidate_test_results
 *
 * This prevents flows where UPDATE does nothing because the row was never created.
 */
export const ensureUserBootstrap = async (user: User): Promise<AppUserType | null> => {
  const metaType = getUserTypeFromMetadata(user);
  const fullName = getFullNameFromMetadata(user);

  // 1) Ensure profiles row exists
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError && (profileError as any).code !== "PGRST116") {
      logError("ensureUserBootstrap.profiles.select", profileError);
    }

    if (!profile?.user_type) {
      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: user.id,
        user_type: metaType,
        full_name: fullName,
      });

      if (insertError && (insertError as any).code !== "23505") {
        logError("ensureUserBootstrap.profiles.insert", insertError);
      }
    }
    // Note: do NOT sync user_type from client-controlled user_metadata after the profile
    // exists. user_metadata is user-writable and would enable role escalation.
  } catch (e) {
    logError("ensureUserBootstrap.profiles", e);
  }

  // 2) Resolve final type from DB (fallback to metadata)
  let userType: AppUserType = metaType;
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && profile?.user_type) {
      userType = profile.user_type as AppUserType;
    }
  } catch {
    // ignore
  }

  // 3) Ensure base row exists for that type — idempotent thanks to UNIQUE(user_id)
  // We use ignoreDuplicates upsert so concurrent calls / multiple tabs never create
  // extra empty rows that would overwrite real test results.
  try {
    if (userType === "employer") {
      const meta = user.user_metadata as any;
      const { error: upsertError } = await supabase
        .from("employer_profiles")
        .upsert(
          { user_id: user.id, company_name: meta?.company_name ?? null },
          { onConflict: "user_id", ignoreDuplicates: true }
        );
      if (upsertError && (upsertError as any).code !== "23505") {
        logError("ensureUserBootstrap.employer_profiles.upsert", upsertError);
      }
    } else {
      const { error: upsertError } = await supabase
        .from("candidate_test_results")
        .upsert(
          { user_id: user.id },
          { onConflict: "user_id", ignoreDuplicates: true }
        );
      if (upsertError && (upsertError as any).code !== "23505") {
        logError("ensureUserBootstrap.candidate_test_results.upsert", upsertError);
      }
    }
  } catch (e) {
    logError("ensureUserBootstrap.ensureBaseRow", e);
  }

  return userType;
};
