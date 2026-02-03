import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, X, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { industries, experienceLevels, positionLevels, competencyLabels, getLocalizedData } from "@/data/additionalQuestions";
import { CompetencySliderWithFeedback } from "@/components/CompetencySliderWithFeedback";
import type { Json } from "@/integrations/supabase/types";

interface AcceptedIndustryRequirement {
  industry: string;
  years: string;
  positionLevel: string;
}

const EmployerRequirements = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [formData, setFormData] = useState({ 
    industry: "", 
    requiredExperience: "", 
    positionLevel: "", 
    noExperienceRequired: false
  });
  const [acceptFromOtherIndustries, setAcceptFromOtherIndustries] = useState(false);
  const [acceptedIndustryRequirements, setAcceptedIndustryRequirements] = useState<AcceptedIndustryRequirement[]>([]);
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
      setFormData({ 
        industry: data.industry || "", 
        requiredExperience: data.required_experience || "", 
        positionLevel: data.position_level || "", 
        noExperienceRequired: (data as any).no_experience_required || false
      });
      
      // Load accepted industry requirements from accepted_industries (stored as JSON)
      const acceptedReqs = (data as any).accepted_industry_requirements as AcceptedIndustryRequirement[] | null;
      if (acceptedReqs && Array.isArray(acceptedReqs) && acceptedReqs.length > 0) {
        setAcceptedIndustryRequirements(acceptedReqs);
        setAcceptFromOtherIndustries(true);
      } else if ((data.accepted_industries || []).length > 0) {
        // Migration: convert old format to new
        setAcceptFromOtherIndustries(true);
        setAcceptedIndustryRequirements(
          (data.accepted_industries || []).map((ind: string) => ({
            industry: ind,
            years: data.required_experience || "",
            positionLevel: data.position_level || ""
          }))
        );
      }
      
      setCompetencyReqs({ 
        komunikacja: data.req_komunikacja || 3, 
        myslenie_analityczne: data.req_myslenie_analityczne || 3, 
        out_of_the_box: data.req_out_of_the_box || 3, 
        determinacja: data.req_determinacja || 3, 
        adaptacja: data.req_adaptacja || 3 
      });
    }
    setLoading(false);
  };

  const addAcceptedIndustryRequirement = () => {
    if (acceptedIndustryRequirements.length < 3) {
      setAcceptedIndustryRequirements([
        ...acceptedIndustryRequirements, 
        { industry: "", years: "", positionLevel: "" }
      ]);
    }
  };

  const removeAcceptedIndustryRequirement = (index: number) => {
    setAcceptedIndustryRequirements(acceptedIndustryRequirements.filter((_, i) => i !== index));
  };

  const updateAcceptedIndustryRequirement = (index: number, field: keyof AcceptedIndustryRequirement, value: string) => {
    const updated = [...acceptedIndustryRequirements];
    updated[index] = { ...updated[index], [field]: value };
    setAcceptedIndustryRequirements(updated);
  };

  const handleAcceptFromOtherChange = (checked: boolean) => {
    setAcceptFromOtherIndustries(checked);
    if (checked && acceptedIndustryRequirements.length === 0) {
      setAcceptedIndustryRequirements([{ industry: "", years: "", positionLevel: "" }]);
    } else if (!checked) {
      setAcceptedIndustryRequirements([]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.industry || !formData.positionLevel) { 
      toast.error(t("employer.requirements.fillRequiredFields")); 
      return; 
    }
    if (!formData.noExperienceRequired && !formData.requiredExperience) {
      toast.error(t("employer.requirements.fillRequiredFields")); 
      return; 
    }
    
    // Validate accepted industry requirements if enabled
    if (acceptFromOtherIndustries) {
      const validReqs = acceptedIndustryRequirements.filter(r => r.industry && r.years && r.positionLevel);
      if (validReqs.length === 0) {
        toast.error(t("employer.requirements.fillAcceptedIndustries")); 
        return; 
      }
    }
    
    setSaving(true);
    try {
      const validAcceptedReqs = acceptFromOtherIndustries 
        ? acceptedIndustryRequirements.filter(r => r.industry && r.years && r.positionLevel)
        : [];
      
      const { error } = await supabase.from("employer_profiles").update({ 
        industry: formData.industry, 
        required_experience: formData.noExperienceRequired ? null : formData.requiredExperience, 
        position_level: formData.positionLevel, 
        accepted_industries: validAcceptedReqs.map(r => r.industry),
        accepted_industry_requirements: JSON.parse(JSON.stringify(validAcceptedReqs)) as Json,
        no_experience_required: formData.noExperienceRequired,
        // DB columns are integers (1-5). Protect save from accidental decimal values.
        req_komunikacja: Math.round(competencyReqs.komunikacja), 
        req_myslenie_analityczne: Math.round(competencyReqs.myslenie_analityczne), 
        req_out_of_the_box: Math.round(competencyReqs.out_of_the_box), 
        req_determinacja: Math.round(competencyReqs.determinacja), 
        req_adaptacja: Math.round(competencyReqs.adaptacja), 
        requirements_completed: true 
      }).eq("user_id", user!.id);
      
      if (error) {
        console.error("Error saving requirements:", error);
        toast.error(t("errors.genericError")); 
        return;
      }
      
      toast.success(t("employer.role.saved")); 
      navigate("/employer/dashboard");
    } catch (err) { 
      console.error("Unexpected error:", err);
      toast.error(t("errors.genericError")); 
    } finally { 
      setSaving(false); 
    }
  };

  // Get industries already used (main + accepted)
  const usedIndustries = [formData.industry, ...acceptedIndustryRequirements.map(r => r.industry)].filter(Boolean);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <Link to="/employer/dashboard" className="flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft className="w-4 h-4" />{t("common.back")}
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">{t("employer.requirements.title")}</h1>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Main industry requirements */}
            <div className="space-y-4">
              <h3 className="font-semibold">{t("employer.requirements.mainRequirements")}</h3>
              
              {/* Industry */}
              <div className="space-y-2">
                <Label>{t("employer.requirements.industryLabel")} *</Label>
                <Select value={formData.industry} onValueChange={(v) => setFormData(p => ({...p, industry: v}))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("employer.requirements.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {localizedIndustries.filter(i => i !== localizedIndustries[0]).map(i => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Position level */}
              <div className="space-y-2">
                <Label>{t("employer.requirements.positionLevelLabel")} *</Label>
                <Select value={formData.positionLevel} onValueChange={(v) => setFormData(p => ({...p, positionLevel: v}))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("employer.requirements.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {localizedPositionLevels.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience level */}
              <div className="space-y-2">
                <Label>{t("employer.requirements.experienceLabel")} *</Label>
                <Select 
                  value={formData.requiredExperience} 
                  onValueChange={(v) => setFormData(p => ({...p, requiredExperience: v}))}
                  disabled={formData.noExperienceRequired}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("employer.requirements.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map(l => (
                      <SelectItem key={l} value={l}>{l} {t("common.years")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* No experience required checkbox */}
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox 
                    id="noExperienceRequired" 
                    checked={formData.noExperienceRequired}
                    onCheckedChange={(checked) => setFormData(p => ({ 
                      ...p, 
                      noExperienceRequired: checked as boolean,
                      requiredExperience: checked ? "" : p.requiredExperience
                    }))}
                  />
                  <Label htmlFor="noExperienceRequired" className="cursor-pointer text-sm">
                    {t("employer.requirements.noExperienceRequired")}
                  </Label>
                </div>
              </div>
            </div>

            {/* Accept from other industries */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acceptOtherIndustries" 
                  checked={acceptFromOtherIndustries}
                  onCheckedChange={handleAcceptFromOtherChange}
                />
                <Label htmlFor="acceptOtherIndustries" className="cursor-pointer">
                  {t("employer.requirements.acceptOtherIndustries")}
                </Label>
              </div>

              {acceptFromOtherIndustries && (
                <div className="space-y-4 pl-6">
                  <p className="text-sm text-muted-foreground">
                    {t("employer.requirements.acceptedIndustriesHint")}
                  </p>
                  
                   {acceptedIndustryRequirements.map((req, index) => {
                     // Don't hide the currently selected value from its own dropdown.
                     const usedIndustriesExcludingCurrent = [
                       formData.industry,
                       ...acceptedIndustryRequirements
                         .filter((_, i) => i !== index)
                         .map(r => r.industry)
                     ].filter(Boolean);

                     return (
                       <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                         <button 
                           onClick={() => removeAcceptedIndustryRequirement(index)}
                           className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                         >
                           <X className="w-4 h-4 text-destructive" />
                         </button>
                         
                         <div className="grid gap-3">
                           <Select 
                             value={req.industry} 
                             onValueChange={(v) => updateAcceptedIndustryRequirement(index, "industry", v)}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder={t("employer.requirements.selectIndustry")} />
                             </SelectTrigger>
                             <SelectContent>
                               {localizedIndustries
                                 .filter(i => i !== localizedIndustries[0] && !usedIndustriesExcludingCurrent.includes(i))
                                 .map(i => (
                                   <SelectItem key={i} value={i}>{i}</SelectItem>
                                 ))}
                             </SelectContent>
                           </Select>
                           
                           <div className="grid grid-cols-2 gap-3">
                             <Select 
                               value={req.positionLevel} 
                               onValueChange={(v) => updateAcceptedIndustryRequirement(index, "positionLevel", v)}
                             >
                               <SelectTrigger>
                                 <SelectValue placeholder={t("employer.requirements.positionLevelPlaceholder")} />
                               </SelectTrigger>
                               <SelectContent>
                                 {localizedPositionLevels.map(l => (
                                   <SelectItem key={l} value={l}>{l}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                             
                             <Select 
                               value={req.years} 
                               onValueChange={(v) => updateAcceptedIndustryRequirement(index, "years", v)}
                             >
                               <SelectTrigger>
                                 <SelectValue placeholder={t("employer.requirements.yearsPlaceholder")} />
                               </SelectTrigger>
                               <SelectContent>
                                 {experienceLevels.map(l => (
                                   <SelectItem key={l} value={l}>{l} {t("common.years")}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                  
                  {acceptedIndustryRequirements.length < 3 && (
                    <Button 
                      variant="outline" 
                      onClick={addAcceptedIndustryRequirement}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("employer.requirements.addAnotherIndustry")} ({acceptedIndustryRequirements.length}/3)
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Competency importance */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">{t("employer.requirements.competencyImportance")}</h3>
              {Object.entries(localizedCompetencyLabels).map(([key, label]) => (
                <CompetencySliderWithFeedback
                  key={key}
                  competencyCode={key}
                  value={competencyReqs[key as keyof typeof competencyReqs]}
                  onChange={(v) => setCompetencyReqs(p => ({...p, [key]: v}))}
                  label={label}
                  audience="employer"
                />
              ))}
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full bg-cta text-cta-foreground">
              {saving ? t("common.saving") : t("common.saveAndContinue")}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmployerRequirements;
