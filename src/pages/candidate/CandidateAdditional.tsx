import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle2, Linkedin, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { industries, experienceLevels, positionLevels, industryChangeOptions, getLocalizedData } from "@/data/additionalQuestions";
import { logError } from "@/lib/errorLogger";
import type { Json } from "@/integrations/supabase/types";

interface IndustryExperience {
  industry: string;
  years: string;
  positionLevel: string;
}

const CandidateAdditional = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const localizedIndustries = getLocalizedData(industries, i18n.language);
  const localizedPositionLevels = getLocalizedData(positionLevels, i18n.language);
  const localizedIndustryChangeOptions = getLocalizedData(industryChangeOptions, i18n.language);
  
  const [hasNoExperience, setHasNoExperience] = useState(false);
  const [industryExperiences, setIndustryExperiences] = useState<IndustryExperience[]>([
    { industry: "", years: "", positionLevel: "" }
  ]);
  const [wantsToChangeIndustry, setWantsToChangeIndustry] = useState("");
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
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
        .select("industry_experiences, has_no_experience, wants_to_change_industry, target_industries, linkedin_url, additional_completed")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") logError("CandidateAdditional.fetchExistingData", error);
      if (data) {
        setHasNoExperience(data.has_no_experience || false);
        const experiences = data.industry_experiences as unknown as IndustryExperience[] | null;
        if (experiences && Array.isArray(experiences) && experiences.length > 0) {
          setIndustryExperiences(experiences);
        }
        setWantsToChangeIndustry(data.wants_to_change_industry || "");
        setTargetIndustries(data.target_industries || []);
        setLinkedinUrl((data as any).linkedin_url || "");
      }
    } catch (error) {
      logError("CandidateAdditional.fetchExistingData", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMatches = async () => {
    if (!user) return;
    try {
      const response = await supabase.functions.invoke('generate-candidate-matches', {
        body: { candidate_user_id: user.id }
      });
      if (response.data?.matches_count > 0) {
        toast.success(t("candidate.additional.matchesGenerated", { count: response.data.matches_count }));
      }
    } catch (error) {
      console.error('Error generating matches:', error);
    }
  };

  const sendResultsEmail = async () => {
    if (!user?.email) return;
    try {
      const feedbackUrl = `${window.location.origin}/candidate/feedback`;
      await supabase.functions.invoke('send-candidate-results', {
        body: { 
          candidate_user_id: user.id,
          candidate_email: user.email,
          feedback_url: feedbackUrl
        }
      });
      console.log('Results email sent successfully');
    } catch (error) {
      console.error('Error sending results email:', error);
    }
  };

  const addIndustryExperience = () => {
    if (industryExperiences.length < 3) {
      setIndustryExperiences([...industryExperiences, { industry: "", years: "", positionLevel: "" }]);
    }
  };

  const removeIndustryExperience = (index: number) => {
    if (industryExperiences.length > 1) {
      setIndustryExperiences(industryExperiences.filter((_, i) => i !== index));
    }
  };

  const updateIndustryExperience = (index: number, field: keyof IndustryExperience, value: string) => {
    const updated = [...industryExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setIndustryExperiences(updated);
  };

  const handleNoExperienceChange = (checked: boolean) => {
    setHasNoExperience(checked);
    if (checked) {
      setIndustryExperiences([{ industry: "", years: "", positionLevel: "" }]);
      setWantsToChangeIndustry("");
      setTargetIndustries([]);
    }
  };

  const addTargetIndustry = (value: string) => {
    if (!targetIndustries.includes(value) && targetIndustries.length < 3) {
      setTargetIndustries([...targetIndustries, value]);
    }
  };

  const removeTargetIndustry = (industry: string) => {
    setTargetIndustries(targetIndustries.filter(i => i !== industry));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // Validation
    if (!hasNoExperience) {
      const hasValidExperience = industryExperiences.some(
        exp => exp.industry && exp.years && exp.positionLevel
      );
      if (!hasValidExperience) {
        toast.error(t("candidate.additional.fillRequiredFields"));
        return;
      }
    }
    
    // wantsToChangeIndustry is only required if user has experience
    if (!hasNoExperience && !wantsToChangeIndustry) {
      toast.error(t("candidate.additional.fillRequiredFields"));
      return;
    }

    setSaving(true);
    try {
      const validExperiences = hasNoExperience 
        ? [] 
        : industryExperiences.filter(exp => exp.industry && exp.years && exp.positionLevel);
      
      const { error } = await supabase.from("candidate_test_results").update({
        industry_experiences: JSON.parse(JSON.stringify(validExperiences)) as Json,
        has_no_experience: hasNoExperience,
        wants_to_change_industry: wantsToChangeIndustry,
        target_industries: (wantsToChangeIndustry === "Tak" || wantsToChangeIndustry === "Yes") ? targetIndustries : [],
        linkedin_url: linkedinUrl,
        // Keep backward compatibility
        industry: validExperiences[0]?.industry || null,
        experience: validExperiences[0]?.years || null,
        position_level: validExperiences[0]?.positionLevel || null,
        additional_completed: true,
        all_tests_completed: true,
      }).eq("user_id", user.id);
      if (error) throw error;
      
      await Promise.all([generateMatches(), sendResultsEmail()]);
      
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
            {/* No experience checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noExperience" 
                checked={hasNoExperience}
                onCheckedChange={handleNoExperienceChange}
              />
              <Label htmlFor="noExperience" className="cursor-pointer">
                {t("candidate.additional.noExperienceLabel")}
              </Label>
            </div>

            {/* Industry experiences */}
            {!hasNoExperience && (
              <div className="space-y-4">
                <Label>{t("candidate.additional.industryExperienceLabel")} *</Label>
                
                {industryExperiences.map((exp, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                    {industryExperiences.length > 1 && (
                      <button 
                        onClick={() => removeIndustryExperience(index)}
                        className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                    
                    <div className="grid gap-3">
                      <Select 
                        value={exp.industry} 
                        onValueChange={(v) => updateIndustryExperience(index, "industry", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("candidate.additional.industryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {localizedIndustries.filter(i => i !== localizedIndustries[0]).map((industry) => (
                            <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Select 
                          value={exp.years} 
                          onValueChange={(v) => updateIndustryExperience(index, "years", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("candidate.additional.experiencePlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {experienceLevels.map((level) => (
                              <SelectItem key={level} value={level}>{level} {t("common.years")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={exp.positionLevel} 
                          onValueChange={(v) => updateIndustryExperience(index, "positionLevel", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("candidate.additional.positionLevelPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {localizedPositionLevels.map((level) => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                
                {industryExperiences.length < 3 && (
                  <Button 
                    variant="outline" 
                    onClick={addIndustryExperience}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("candidate.additional.addAnotherIndustry")} ({industryExperiences.length}/3)
                  </Button>
                )}
              </div>
            )}

            {/* Change industry question - only show if user has experience */}
            {!hasNoExperience && (
              <div className="space-y-2">
                <Label>{t("candidate.additional.changeIndustryLabel")}</Label>
                <Select 
                  value={wantsToChangeIndustry} 
                  onValueChange={(value) => {
                    setWantsToChangeIndustry(value);
                    if (value === "Nie" || value === "No") {
                      setTargetIndustries([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("candidate.additional.changeIndustryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {localizedIndustryChangeOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Target industries (if wants to change) */}
            {(wantsToChangeIndustry === "Tak" || wantsToChangeIndustry === "Yes") && (
              <div className="space-y-2">
                <Label>{t("candidate.additional.targetIndustriesLabel")} ({targetIndustries.length}/3)</Label>
                <Select 
                  value="" 
                  onValueChange={addTargetIndustry}
                  disabled={targetIndustries.length >= 3}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={targetIndustries.length >= 3 ? t("candidate.additional.maxIndustriesReached") : t("candidate.additional.targetIndustriesPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {localizedIndustries
                      .filter(ind => !targetIndustries.includes(ind) && ind !== localizedIndustries[0])
                      .map((industry) => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {targetIndustries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {targetIndustries.map((ind) => (
                      <span 
                        key={ind} 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 text-sm cursor-pointer hover:bg-destructive/20"
                        onClick={() => removeTargetIndustry(ind)}
                      >
                        {ind} <X className="w-3 h-3" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                {t("candidate.additional.linkedinLabel")}
              </Label>
              <Input
                type="url"
                placeholder={t("candidate.additional.linkedinPlaceholder")}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
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
