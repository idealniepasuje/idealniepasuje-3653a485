import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkModeSelector } from "@/components/WorkModeSelector";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { logError } from "@/lib/errorLogger";

const EmployerRole = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    roleDescription: "",
    roleResponsibilities: "",
    workMode: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("employer_profiles")
        .select("role_description, role_responsibilities")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setFormData(p => ({
          ...p,
          roleDescription: data.role_description || "",
          roleResponsibilities: data.role_responsibilities || "",
        }));
      }

      // Load work mode from existing job offer
      const { data: offerData } = await supabase
        .from("job_offers")
        .select("work_mode, city")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (offerData) {
        setFormData(p => ({
          ...p,
          workMode: offerData.work_mode || "",
          city: offerData.city || "",
        }));
      }
    } catch (err) {
      logError("EmployerRole.fetchData", err);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!formData.roleDescription) { toast.error(t("employer.role.fillRoleDescription")); return; }

    if ((formData.workMode === "hybrid" || formData.workMode === "onsite") && !formData.city) {
      toast.error(t("employer.requirements.fillRequiredFields"));
      return;
    }

    setSaving(true);
    try {
      // Save employer profile
      const { error } = await supabase.from("employer_profiles").update({
        role_description: formData.roleDescription,
        role_responsibilities: formData.roleResponsibilities,
        role_completed: true,
      }).eq("user_id", user.id);
      if (error) throw error;

      // Update job offer with role data and work mode
      const { data: existingOffer } = await supabase
        .from("job_offers")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOffer) {
        await supabase.from("job_offers").update({
          role_description: formData.roleDescription,
          role_responsibilities: formData.roleResponsibilities,
          work_mode: formData.workMode || null,
          city: (formData.workMode === "hybrid" || formData.workMode === "onsite") ? formData.city : null,
        }).eq("id", existingOffer.id);
      }

      toast.success(t("employer.role.saved"));
      navigate("/employer/dashboard");
    } catch (err) {
      logError("EmployerRole.handleSubmit", err);
      toast.error(t("errors.genericError"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout sidebar={<EmployerSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<EmployerSidebar />}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/employer/dashboard")} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />{t("common.back")}
          </Button>
          <h1 className="text-2xl font-bold">{t("employer.role.title")}</h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Opis roli */}
            <div className="space-y-2">
              <Label>{t("employer.role.roleDescriptionLabel")} *</Label>
              <Textarea
                value={formData.roleDescription}
                onChange={(e) => setFormData(p => ({ ...p, roleDescription: e.target.value }))}
                rows={3}
                placeholder={t("employer.role.roleDescriptionPlaceholder")}
              />
            </div>

            {/* Obowiązki */}
            <div className="space-y-2">
              <Label>{t("employer.role.responsibilitiesLabel")}</Label>
              <Textarea
                value={formData.roleResponsibilities}
                onChange={(e) => setFormData(p => ({ ...p, roleResponsibilities: e.target.value }))}
                rows={4}
                placeholder={t("employer.role.responsibilitiesPlaceholder")}
              />
            </div>

            {/* Tryb pracy */}
            <WorkModeSelector
              workMode={formData.workMode}
              city={formData.city}
              onWorkModeChange={(v) => setFormData(p => ({ ...p, workMode: v }))}
              onCityChange={(v) => setFormData(p => ({ ...p, city: v }))}
            />

            <Button onClick={handleSubmit} disabled={saving} className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
              {saving ? t("common.saving") : t("common.saveAndContinue")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmployerRole;
