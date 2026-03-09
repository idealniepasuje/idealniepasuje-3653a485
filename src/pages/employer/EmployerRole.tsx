import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    title: "",
    roleDescription: "",
    roleResponsibilities: "",
    workMode: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState("");

  const validateTitle = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return t("employer.offerForm.titleRequired");
    if (trimmed.length < 3) return t("employer.offerForm.titleMinLength");
    if (trimmed.length > 100) return t("employer.offerForm.titleMaxLength");
    if (!/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-/]+$/.test(trimmed)) return t("employer.offerForm.titleLettersOnly");
    return "";
  };

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

      // Load title and work mode from existing job offer
      const { data: offerData } = await supabase
        .from("job_offers")
        .select("title, work_mode, city")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (offerData) {
        setFormData(p => ({
          ...p,
          title: offerData.title || "",
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

    const titleErr = validateTitle(formData.title);
    if (titleErr) { setTitleError(titleErr); return; }

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

      // Update job offer with title, role data and work mode
      const { data: existingOffer } = await supabase
        .from("job_offers")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOffer) {
        await supabase.from("job_offers").update({
          title: formData.title.trim(),
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
            {/* Nazwa stanowiska */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("employer.offerForm.titleLabel")} *</Label>
              <p className="text-sm text-muted-foreground">{t("employer.offerForm.titleHint")}</p>
              <Input
                value={formData.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(p => ({ ...p, title: val }));
                  if (titleError) setTitleError(validateTitle(val));
                }}
                placeholder={t("employer.offerForm.titlePlaceholder")}
                className={`text-lg font-semibold h-12 ${titleError ? "border-destructive" : ""}`}
                maxLength={100}
              />
              {titleError && <p className="text-sm text-destructive">{titleError}</p>}
              <p className="text-xs text-muted-foreground text-right">{formData.title.trim().length}/100</p>
            </div>

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
