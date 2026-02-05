import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { industries, experienceLevels, positionLevels, competencyLabels, getLocalizedData } from "@/data/additionalQuestions";
import { CompetencySliderWithFeedback } from "@/components/CompetencySliderWithFeedback";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { logError } from "@/lib/errorLogger";
import type { Json } from "@/integrations/supabase/types";

interface AcceptedIndustryRequirement {
  industry: string;
  years: string;
  positionLevel: string;
}

const EmployerOfferForm = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const isNew = offerId === "new";
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [formData, setFormData] = useState({
    title: "",
    roleDescription: "",
    roleResponsibilities: "",
    industry: "",
    requiredExperience: "",
    positionLevel: "",
    noExperienceRequired: false
  });
  const [acceptFromOtherIndustries, setAcceptFromOtherIndustries] = useState(false);
  const [acceptedIndustryRequirements, setAcceptedIndustryRequirements] = useState<AcceptedIndustryRequirement[]>([]);
  const [competencyReqs, setCompetencyReqs] = useState({ 
    komunikacja: 3, myslenie_analityczne: 3, out_of_the_box: 3, determinacja: 3, adaptacja: 3 
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const localizedIndustries = getLocalizedData(industries, i18n.language);
  const localizedPositionLevels = getLocalizedData(positionLevels, i18n.language);
  const localizedCompetencyLabels = getLocalizedData(competencyLabels, i18n.language);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user && !isNew) fetchOffer();
  }, [user, authLoading, navigate, isNew]);

  const fetchOffer = async () => {
    if (!user || !offerId) return;
    try {
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("id", offerId)
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title || "",
          roleDescription: data.role_description || "",
          roleResponsibilities: data.role_responsibilities || "",
          industry: data.industry || "",
          requiredExperience: data.required_experience || "",
          positionLevel: data.position_level || "",
          noExperienceRequired: data.no_experience_required || false
        });
        
        const acceptedReqs = data.accepted_industry_requirements as unknown as AcceptedIndustryRequirement[] | null;
        if (acceptedReqs && Array.isArray(acceptedReqs) && acceptedReqs.length > 0) {
          setAcceptedIndustryRequirements(acceptedReqs);
          setAcceptFromOtherIndustries(true);
        }
        
        setCompetencyReqs({
          komunikacja: data.req_komunikacja || 3,
          myslenie_analityczne: data.req_myslenie_analityczne || 3,
          out_of_the_box: data.req_out_of_the_box || 3,
          determinacja: data.req_determinacja || 3,
          adaptacja: data.req_adaptacja || 3
        });
      }
    } catch (error) {
      logError("EmployerOfferForm.fetchOffer", error);
      toast.error(t("errors.genericError"));
      navigate("/employer/offers");
    } finally {
      setLoading(false);
    }
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
    if (!user) return;
    
    if (!formData.title || !formData.industry || !formData.positionLevel) { 
      toast.error(t("employer.requirements.fillRequiredFields")); 
      return; 
    }
    if (!formData.noExperienceRequired && !formData.requiredExperience) {
      toast.error(t("employer.requirements.fillRequiredFields")); 
      return; 
    }
    
    setSaving(true);
    try {
      const validAcceptedReqs = acceptFromOtherIndustries 
        ? acceptedIndustryRequirements.filter(r => r.industry && r.years && r.positionLevel)
        : [];
      
      const offerData = {
        user_id: user.id,
        title: formData.title,
        role_description: formData.roleDescription,
        role_responsibilities: formData.roleResponsibilities,
        industry: formData.industry,
        required_experience: formData.noExperienceRequired ? null : formData.requiredExperience,
        position_level: formData.positionLevel,
        no_experience_required: formData.noExperienceRequired,
        accepted_industries: validAcceptedReqs.map(r => r.industry),
        accepted_industry_requirements: JSON.parse(JSON.stringify(validAcceptedReqs)) as Json,
        req_komunikacja: competencyReqs.komunikacja,
        req_myslenie_analityczne: competencyReqs.myslenie_analityczne,
        req_out_of_the_box: competencyReqs.out_of_the_box,
        req_determinacja: competencyReqs.determinacja,
        req_adaptacja: competencyReqs.adaptacja
      };
      
      if (isNew) {
        const { error } = await supabase.from("job_offers").insert(offerData);
        if (error) throw error;
        toast.success(t("employer.offers.created"));
      } else {
        const { error } = await supabase.from("job_offers").update(offerData).eq("id", offerId);
        if (error) throw error;
        toast.success(t("employer.offers.updated"));
      }
      
      navigate("/employer/offers");
    } catch (error) {
      logError("EmployerOfferForm.handleSubmit", error);
      toast.error(t("errors.genericError"));
    } finally {
      setSaving(false);
    }
  };

  const usedIndustries = [formData.industry, ...acceptedIndustryRequirements.map(r => r.industry)].filter(Boolean);

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
          <Button variant="ghost" size="sm" onClick={() => navigate("/employer/offers")} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />{t("common.back")}
          </Button>
          <h1 className="text-2xl font-bold">
            {isNew ? t("employer.offers.createNew") : t("employer.offers.edit")}
          </h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label>{t("employer.offers.titleLabel")} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder={t("employer.offers.titlePlaceholder")}
              />
            </div>

            {/* Role description */}
            <div className="space-y-2">
              <Label>{t("employer.role.roleDescriptionLabel")}</Label>
              <Textarea
                value={formData.roleDescription}
                onChange={(e) => setFormData(p => ({ ...p, roleDescription: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <Label>{t("employer.role.responsibilitiesLabel")}</Label>
              <Textarea
                value={formData.roleResponsibilities}
                onChange={(e) => setFormData(p => ({ ...p, roleResponsibilities: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label>{t("employer.requirements.industryLabel")} *</Label>
              <Select value={formData.industry} onValueChange={(v) => setFormData(p => ({ ...p, industry: v }))}>
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
              <Select value={formData.positionLevel} onValueChange={(v) => setFormData(p => ({ ...p, positionLevel: v }))}>
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

            {/* Experience */}
            <div className="space-y-2">
              <Label>{t("employer.requirements.experienceLabel")} *</Label>
              <Select 
                value={formData.requiredExperience} 
                onValueChange={(v) => setFormData(p => ({ ...p, requiredExperience: v }))}
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
                  {acceptedIndustryRequirements.map((req, index) => {
                    const usedIndustriesExcludingCurrent = [
                      formData.industry,
                      ...acceptedIndustryRequirements.filter((_, i) => i !== index).map(r => r.industry)
                    ].filter(Boolean);

                    return (
                      <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                        <button 
                          onClick={() => removeAcceptedIndustryRequirement(index)}
                          className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                        
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
                    );
                  })}
                  
                  {acceptedIndustryRequirements.length < 3 && (
                    <Button variant="outline" onClick={addAcceptedIndustryRequirement} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("employer.requirements.addAnotherIndustry")} ({acceptedIndustryRequirements.length}/3)
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Competency requirements */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">{t("employer.requirements.competencyImportance")}</h3>
              {Object.entries(localizedCompetencyLabels).map(([key, label]) => (
                <CompetencySliderWithFeedback
                  key={key}
                  competencyCode={key}
                  value={competencyReqs[key as keyof typeof competencyReqs]}
                  onChange={(v) => setCompetencyReqs(p => ({ ...p, [key]: v }))}
                  label={label}
                  audience="employer"
                />
              ))}
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full">
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmployerOfferForm;
