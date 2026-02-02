import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { industries, experienceLevels, positionLevels, industryChangeOptions, getLocalizedData } from "@/data/additionalQuestions";
import { logError } from "@/lib/errorLogger";

const CandidateAdditional = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const localizedIndustries = getLocalizedData(industries, i18n.language);
  const localizedPositionLevels = getLocalizedData(positionLevels, i18n.language);
  const localizedIndustryChangeOptions = getLocalizedData(industryChangeOptions, i18n.language);
  
  const [formData, setFormData] = useState({
    industry: "",
    experience: "",
    positionLevel: "",
    wantsToChangeIndustry: "",
    workDescription: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchExistingData();
  }, [user, authLoading, navigate]);

  const fetchExistingData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("candidate_test_results")
        .select("industry, experience, position_level, wants_to_change_industry, work_description, additional_completed")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") logError("CandidateAdditional.fetchExistingData", error);
      if (data) {
        setFormData({
          industry: data.industry || "",
          experience: data.experience || "",
          positionLevel: data.position_level || "",
          wantsToChangeIndustry: data.wants_to_change_industry || "",
          workDescription: data.work_description || "",
        });
      }
    } catch (error) {
      logError("CandidateAdditional.fetchExistingData", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.industry || !formData.experience || !formData.positionLevel || !formData.wantsToChangeIndustry) {
      toast.error(t("candidate.additional.fillRequiredFields"));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("candidate_test_results").update({
        industry: formData.industry,
        experience: formData.experience,
        position_level: formData.positionLevel,
        wants_to_change_industry: formData.wantsToChangeIndustry,
        work_description: formData.workDescription,
        additional_completed: true,
        all_tests_completed: true,
      }).eq("user_id", user.id);
      if (error) throw error;
      setShowSuccess(true);
      toast.success(t("candidate.additional.thankYouMessage"));
    } catch (error) {
      logError("CandidateAdditional.handleSubmit", error);
      toast.error(t("errors.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-4">
            <Link to="/candidate/dashboard" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
              <ArrowLeft className="w-4 h-4" />{t("common.backToPanel")}
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-success/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">{t("candidate.additional.thankYou")}</CardTitle>
              <CardDescription>{t("candidate.additional.allCompleted")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-accent/10 rounded-lg p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("candidate.additional.ourTurnNow")}</h3>
                <p className="text-muted-foreground">{t("candidate.additional.ourTurnDescription")}</p>
              </div>
              <Link to="/candidate/dashboard">
                <Button className="w-full bg-cta text-cta-foreground hover:bg-cta/90">{t("common.backToPanel")}</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <Link to="/candidate/dashboard" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" />{t("common.backToPanel")}
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t("candidate.additional.title")}</h1>
          <p className="text-muted-foreground">{t("candidate.additional.subtitle")}</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>{t("candidate.additional.industryLabel")}</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger><SelectValue placeholder={t("candidate.additional.industryPlaceholder")} /></SelectTrigger>
                <SelectContent>{localizedIndustries.map((industry) => <SelectItem key={industry} value={industry}>{industry}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("candidate.additional.experienceLabel")}</Label>
              <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                <SelectTrigger><SelectValue placeholder={t("candidate.additional.experiencePlaceholder")} /></SelectTrigger>
                <SelectContent>{experienceLevels.map((level) => <SelectItem key={level} value={level}>{level} {t("common.years")}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("candidate.additional.positionLevelLabel")}</Label>
              <Select value={formData.positionLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, positionLevel: value }))}>
                <SelectTrigger><SelectValue placeholder={t("candidate.additional.positionLevelPlaceholder")} /></SelectTrigger>
                <SelectContent>{localizedPositionLevels.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("candidate.additional.changeIndustryLabel")}</Label>
              <Select value={formData.wantsToChangeIndustry} onValueChange={(value) => setFormData(prev => ({ ...prev, wantsToChangeIndustry: value }))}>
                <SelectTrigger><SelectValue placeholder={t("candidate.additional.changeIndustryPlaceholder")} /></SelectTrigger>
                <SelectContent>{localizedIndustryChangeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("candidate.additional.workDescriptionLabel")}</Label>
              <Textarea
                placeholder={t("candidate.additional.workDescriptionPlaceholder")}
                value={formData.workDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                rows={4}
              />
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
              {saving ? t("common.saving") : t("candidate.additional.finishAndSave")}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CandidateAdditional;
