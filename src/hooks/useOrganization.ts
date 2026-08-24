import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logError } from "@/lib/errorLogger";

export interface OrganizationInfo {
  id: string;
  name: string;
  role: string;
}

/**
 * Zwraca organizację pracodawcy (tworzy ją, jeśli jeszcze nie istnieje).
 * Organizacja jest kontenerem dla ogłoszeń i pracowników — dzięki niej
 * firma może mieć w przyszłości wielu adminów/HR.
 */
export const useOrganization = () => {
  const { user, userType } = useAuth();
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setOrganization(null);
      setLoading(false);
      return;
    }
    try {
      const { data: memberships, error } = await supabase
        .from("organization_members")
        .select("role, organization_id, organizations(id, name)")
        .eq("user_id", user.id);

      if (error) throw error;

      const first = (memberships || [])[0] as any;
      if (first?.organizations) {
        setOrganization({ id: first.organizations.id, name: first.organizations.name, role: first.role });
        return;
      }

      if (userType !== "employer") {
        setOrganization(null);
        return;
      }

      // Pracodawca bez organizacji — utwórz na podstawie profilu firmy
      const { data: profile } = await supabase
        .from("employer_profiles")
        .select("company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: created, error: createErr } = await supabase
        .from("organizations")
        .insert({ name: profile?.company_name?.trim() || "Moja firma", owner_user_id: user.id })
        .select("id, name")
        .single();
      if (createErr) throw createErr;

      const { error: memberErr } = await supabase
        .from("organization_members")
        .insert({ organization_id: created.id, user_id: user.id, role: "owner" });
      if (memberErr && (memberErr as any).code !== "23505") throw memberErr;

      setOrganization({ id: created.id, name: created.name, role: "owner" });
    } catch (e) {
      logError("useOrganization.load", e);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, [user, userType]);

  useEffect(() => {
    load();
  }, [load]);

  return { organization, loading, reload: load };
};
