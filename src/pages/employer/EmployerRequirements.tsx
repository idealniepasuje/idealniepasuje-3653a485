import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { industries, experienceLevels, positionLevels, competencyLabels, getLocalizedData } from "@/data/additionalQuestions";

const EmployerRequirements = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ industry: "", requiredExperience: "", positionLevel: "", acceptedIndustries: [] as string[] });
  const [competencyReqs, setCompetencyReqs] = useState({ komunikacja: 3, myslenie_analityczne: 3, out_of_the_box: 3, determinacja: 3, adaptacja: 3 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const localizedIndustries = getLocalizedData(industries, i18n.language);
  const localizedPositionLevels = getLocalizedData(positionLevels, i18n.language);
  const localizedCompetencyLabels = getLocalizedData(competencyLabels, i18n.language);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).single();
    if (data) {
      setFormData({ industry: data.industry || "", requiredExperience: data.required_experience || "", positionLevel: data.position_level || "", acceptedIndustries: data.accepted_industries || [] });
      setCompetencyReqs({ komunikacja: data.req_komunikacja || 3, myslenie_analityczne: data.req_myslenie_analityczne || 3, out_of_the_box: data.req_out_of_the_box || 3, determinacja: data.req_determinacja || 3, adaptacja: data.req_adaptacja || 3 });
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.industry || !formData.requiredExperience || !formData.positionLevel) { toast.error(t("employer.requirements.fillRequiredFields")); return; }
    setSaving(true);
    try {
      await supabase.from("employer_profiles").update({ industry: formData.industry, required_experience: formData.requiredExperience, position_level: formData.positionLevel, accepted_industries: formData.acceptedIndustries, req_komunikacja: competencyReqs.komunikacja, req_myslenie_analityczne: competencyReqs.myslenie_analityczne, req_out_of_the_box: competencyReqs.out_of_the_box, req_determinacja: competencyReqs.determinacja, req_adaptacja: competencyReqs.adaptacja, requirements_completed: true }).eq("user_id", user!.id);
      toast.success(t("employer.role.saved")); navigate("/employer/dashboard");
    } catch { toast.error(t("errors.genericError")); } finally { setSaving(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground"><div className="container mx-auto px-4 py-4"><Link to="/employer/dashboard" className="flex items-center gap-2 text-primary-foreground/80"><ArrowLeft className="w-4 h-4" />{t("common.back")}</Link></div></header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">{t("employer.requirements.title")}</h1>
        <Card><CardContent className="pt-6 space-y-6">
          <div><Label>{t("employer.requirements.industryLabel")}</Label><Select value={formData.industry} onValueChange={(v) => setFormData(p => ({...p, industry: v}))}><SelectTrigger><SelectValue placeholder={t("employer.requirements.selectPlaceholder")} /></SelectTrigger><SelectContent>{localizedIndustries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>{t("employer.requirements.experienceLabel")}</Label><Select value={formData.requiredExperience} onValueChange={(v) => setFormData(p => ({...p, requiredExperience: v}))}><SelectTrigger><SelectValue placeholder={t("employer.requirements.selectPlaceholder")} /></SelectTrigger><SelectContent>{experienceLevels.map(l => <SelectItem key={l} value={l}>{l} {t("common.years")}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>{t("employer.requirements.positionLevelLabel")}</Label><Select value={formData.positionLevel} onValueChange={(v) => setFormData(p => ({...p, positionLevel: v}))}><SelectTrigger><SelectValue placeholder={t("employer.requirements.selectPlaceholder")} /></SelectTrigger><SelectContent>{localizedPositionLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
          <div className="border-t pt-6"><h3 className="font-semibold mb-4">{t("employer.requirements.competencyImportance")}</h3>
            {Object.entries(localizedCompetencyLabels).map(([key, label]) => (
              <div key={key} className="mb-4"><div className="flex justify-between mb-2"><span className="text-sm">{label}</span><span className="text-sm font-medium">{competencyReqs[key as keyof typeof competencyReqs]}</span></div>
                <Slider value={[competencyReqs[key as keyof typeof competencyReqs]]} onValueChange={([v]) => setCompetencyReqs(p => ({...p, [key]: v}))} min={1} max={5} step={1} /></div>
            ))}
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full bg-cta text-cta-foreground">{saving ? t("common.saving") : t("common.saveAndContinue")}</Button>
        </CardContent></Card>
      </main>
    </div>
  );
};

export default EmployerRequirements;
