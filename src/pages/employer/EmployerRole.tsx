import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    companyName: "",
    workMode: "",
    city: "",
  });
  const [jobOfferTitle, setJobOfferTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        .select("role_description, role_responsibilities, company_name")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setFormData({
          roleDescription: data.role_description || "",
          roleResponsibilities: data.role_responsibilities || "",
          companyName: data.company_name || "",
          workMode: "",
          city: "",
        });
      }

      // Check if there's already a job offer to get title/work mode
      const { data: offerData } = await supabase
        .from("job_offers")
        .select("title, work_mode, city")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (offerData) {
        setJobOfferTitle(offerData.title || "");
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

    // Validate title
    const tErr = validateTitle(jobOfferTitle);
    if (tErr) { setTitleError(tErr); return; }

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
        company_name: formData.companyName.trim() || null,
        role_completed: true,
      }).eq("user_id", user.id);
      if (error) throw error;

      // Upsert job offer with the title and work mode
      const { data: existingOffer } = await supabase
        .from("job_offers")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOffer) {
        await supabase.from("job_offers").update({
          title: jobOfferTitle.trim(),
          company_name: formData.companyName.trim() || null,
          role_description: formData.roleDescription,
          role_responsibilities: formData.roleResponsibilities,
          work_mode: formData.workMode || null,
          city: (formData.workMode === "hybrid" || formData.workMode === "onsite") ? formData.city : null,
        }).eq("id", existingOffer.id);
      } else {
        await supabase.from("job_offers").insert({
          user_id: user.id,
          title: jobOfferTitle.trim(),
          company_name: formData.companyName.trim() || null,
          role_description: formData.roleDescription,
          role_responsibilities: formData.roleResponsibilities,
          work_mode: formData.workMode || null,
          city: (formData.workMode === "hybrid" || formData.workMode === "onsite") ? formData.city : null,
        });
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
              <Label>{t("employer.offerForm.titleLabel")} *</Label>
              <p className="text-sm text-muted-foreground">{t("employer.offerForm.titleHint")}</p>
              <Input
                value={jobOfferTitle}
                onChange={(e) => {
                  setJobOfferTitle(e.target.value);
                  if (titleError) setTitleError(validateTitle(e.target.value));
                }}
                onBlur={() => setTitleError(validateTitle(jobOfferTitle))}
                placeholder={t("employer.offerForm.titlePlaceholder")}
                className={`text-lg font-semibold h-12 ${titleError ? "border-destructive" : ""}`}
                maxLength={100}
              />
              {titleError && <p className="text-sm text-destructive">{titleError}</p>}
              <p className="text-xs text-muted-foreground text-right">{jobOfferTitle.trim().length}/100</p>
            </div>

            {/* Nazwa firmy */}
            <div className="space-y-2">
              <Label>{t("employer.offerForm.companyNameLabel")}</Label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                placeholder={t("employer.offerForm.companyNamePlaceholder")}
                maxLength={200}
              />
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
