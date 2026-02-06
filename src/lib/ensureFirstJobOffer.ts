import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";

type EnsureFirstOfferResult = {
  created: boolean;
  offerId: string | null;
};

/**
 * Creates the first job offer for an employer based on their completed employer profile.
 * This keeps the existing onboarding (employer_profiles) but guarantees the user gets
 * a real "zlecenie" visible in Offers.
 */
export const ensureFirstJobOfferFromEmployerProfile = async (
  userId: string,
  defaultTitle: string
): Promise<EnsureFirstOfferResult> => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from("job_offers")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingError) {
      logError("ensureFirstJobOffer.existing", existingError);
      return { created: false, offerId: null };
    }

    if (existing && existing.length > 0) {
      return { created: false, offerId: existing[0].id as string };
    }

    const { data: profile, error: profileError } = await supabase
      .from("employer_profiles")
      .select(
        "role_description, role_responsibilities, industry, required_experience, position_level, no_experience_required, accepted_industries, accepted_industry_requirements, req_komunikacja, req_myslenie_analityczne, req_out_of_the_box, req_determinacja, req_adaptacja"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError && (profileError as any).code !== "PGRST116") {
      logError("ensureFirstJobOffer.profile", profileError);
      return { created: false, offerId: null };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("job_offers")
      .insert({
        user_id: userId,
        title: defaultTitle,
        role_description: profile?.role_description ?? null,
        role_responsibilities: profile?.role_responsibilities ?? null,
        industry: profile?.industry ?? null,
        required_experience: profile?.required_experience ?? null,
        position_level: profile?.position_level ?? null,
        no_experience_required: (profile as any)?.no_experience_required ?? false,
        accepted_industries: (profile as any)?.accepted_industries ?? null,
        accepted_industry_requirements: (profile as any)?.accepted_industry_requirements ?? [],
        req_komunikacja: (profile as any)?.req_komunikacja ?? null,
        req_myslenie_analityczne: (profile as any)?.req_myslenie_analityczne ?? null,
        req_out_of_the_box: (profile as any)?.req_out_of_the_box ?? null,
        req_determinacja: (profile as any)?.req_determinacja ?? null,
        req_adaptacja: (profile as any)?.req_adaptacja ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      logError("ensureFirstJobOffer.insert", insertError);
      return { created: false, offerId: null };
    }

    return { created: true, offerId: inserted?.id ?? null };
  } catch (e) {
    logError("ensureFirstJobOffer", e);
    return { created: false, offerId: null };
  }
};
