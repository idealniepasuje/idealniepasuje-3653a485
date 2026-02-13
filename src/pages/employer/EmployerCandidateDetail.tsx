import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogOut, ArrowLeft, Target, Heart, Briefcase, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, User, ThumbsUp, ThumbsDown, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import { getLevel, getFeedback, getLocalizedLevelLabels } from "@/data/feedbackData";
import { getAprobataQuestions } from "@/data/competencyQuestions";

interface MatchDetails {
  competenceDetails: {
    competency: string;
    candidateScore: number;
    employerRequirement: number;
    matchPercent: number;
    status: 'excellent' | 'good' | 'needs_work';
  }[];
  cultureDetails: {
    dimension: string;
    candidateScore: number;
    employerScore: number;
    matchPercent: number;
    status: 'aligned' | 'partial' | 'divergent';
  }[];
  extraDetails: {
    field: string;
    matched: boolean;
    candidateValue?: string | null;
    employerValue?: string | null;
    acceptedValues?: string[];
  }[];
  strengths: string[];
  risks: string[];
}

const competencyNames: Record<string, { pl: string; en: string }> = {
  komunikacja: { pl: 'Komunikacja', en: 'Communication' },
  myslenie_analityczne: { pl: 'Myślenie analityczne', en: 'Analytical thinking' },
  out_of_the_box: { pl: 'Kreatywność', en: 'Creativity' },
  determinacja: { pl: 'Determinacja', en: 'Determination' },
  adaptacja: { pl: 'Adaptacja do zmian', en: 'Adaptability' },
};

const cultureNames: Record<string, { pl: string; en: string }> = {
  relacja_wspolpraca: { pl: 'Relacje i współpraca', en: 'Relations & collaboration' },
  elastycznosc_innowacyjnosc: { pl: 'Elastyczność i innowacyjność', en: 'Flexibility & innovation' },
  wyniki_cele: { pl: 'Wyniki i cele', en: 'Results & goals' },
  stabilnosc_struktura: { pl: 'Stabilność i struktura', en: 'Stability & structure' },
  autonomia_styl_pracy: { pl: 'Autonomia i styl pracy', en: 'Autonomy & work style' },
  wlb_dobrostan: { pl: 'Work-life balance', en: 'Work-life balance' },
};

const EmployerCandidateDetail = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [match, setMatch] = useState<any>(null);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [employerData, setEmployerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>('pending');

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user && candidateId) fetchMatchData();
  }, [user, authLoading, navigate, candidateId]);

  const fetchMatchData = async () => {
    if (!user || !candidateId) return;
    try {
      // Fetch match data
      const { data: matchData, error: matchError } = await supabase
        .from("match_results")
        .select("*")
        .eq("employer_user_id", user.id)
        .eq("candidate_user_id", candidateId)
        .single();
      
      if (matchError) {
        logError("EmployerCandidateDetail.fetchMatchData", matchError);
      } else {
        setMatch(matchData);
        setCurrentStatus(matchData?.status || 'pending');
        
        // Mark as viewed if status is pending (hasn't been seen yet)
        if (matchData && matchData.status === 'pending') {
          await supabase
            .from("match_results")
            .update({ status: 'viewed', viewed_at: new Date().toISOString() })
            .eq("id", matchData.id);
          setCurrentStatus('viewed');
        }
      }

      // Candidate is anonymous - don't fetch their name

      // Fetch candidate test results for additional info
      const { data: testData } = await supabase
        .from("candidate_test_results")
        .select("industry, experience, position_level, work_description, target_industries, has_no_experience, industry_experiences, competency_answers")
        .eq("user_id", candidateId)
        .single();

      if (testData) {
        setCandidateData(testData);
      }

      // Fetch employer profile for comparison
      const { data: empData } = await supabase
        .from("employer_profiles")
        .select("industry, required_experience, position_level, accepted_industries, no_experience_required, accepted_industry_requirements")
        .eq("user_id", user.id)
        .single();

      if (empData) {
        setEmployerData(empData);
      }
    } catch (error) {
      logError("EmployerCandidateDetail.fetchMatchData", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'considering' | 'rejected' | 'viewed') => {
    if (!match) return;
    try {
      // If clicking the same status, revert to 'viewed'
      const statusToSet = currentStatus === newStatus ? 'viewed' : newStatus;
      
      const { error } = await supabase
        .from("match_results")
        .update({ status: statusToSet })
        .eq("id", match.id);
      
      if (error) {
        logError("EmployerCandidateDetail.handleStatusChange", error);
        toast.error(t("errors.genericError"));
        return;
      }
      
      // Send notification to candidate when employer marks interest
      if (currentStatus !== 'considering' && statusToSet === 'considering') {
        try {
          const { data: employerProfile } = await supabase
            .from("employer_profiles")
            .select("company_name")
            .eq("user_id", user?.id)
            .single();
          
          await supabase.functions.invoke('send-interest-notification', {
            body: {
              candidate_user_id: candidateId,
              employer_company_name: employerProfile?.company_name || 'Pracodawca',
              match_percent: match.overall_percent,
              competence_percent: match.competence_percent,
              culture_percent: match.culture_percent,
              extra_percent: match.extra_percent,
            }
          });
        } catch (notifError) {
          logError("EmployerCandidateDetail.sendNotification", notifError);
        }
      }
      
      setCurrentStatus(statusToSet);
      setMatch({ ...match, status: statusToSet });
      
      if (newStatus === 'considering') {
        toast.success(statusToSet === 'considering' 
          ? t("employer.candidateDetail.interestMarked") 
          : t("employer.candidateDetail.interestRemoved")
        );
      } else if (newStatus === 'rejected') {
        toast.success(statusToSet === 'rejected' 
          ? t("employer.candidateDetail.rejectionMarked") 
          : t("employer.candidateDetail.rejectionRemoved")
        );
      }
    } catch (error) {
      logError("EmployerCandidateDetail.handleStatusChange", error);
      toast.error(t("errors.genericError"));
    }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const lang = i18n.language as 'pl' | 'en';

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

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("employer.candidateDetail.notFound")}</h2>
            <Link to="/employer/candidates">
              <Button variant="outline">{t("common.back")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const matchDetails = match.match_details as MatchDetails | null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">idealnie<span className="text-accent">pasuje</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-primary-foreground/80">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-2" />{t("common.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/employer/candidates">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />{t("common.back")}
            </Button>
          </Link>
        </div>

        {/* Header with overall match */}
        <Card className="mb-8 border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-accent" />
                  </div>
                   <div>
                    <h1 className="text-2xl font-bold">
                      {t("employer.candidates.candidateNumber")} #{candidateId?.slice(0, 8)}
                    </h1>
                    {candidateData?.position_level && (
                      <p className="text-sm text-muted-foreground">
                        {t(`candidate.additional.positionLevels.${candidateData.position_level}`)}
                        {candidateData?.industry && ` • ${t(`candidate.additional.industries.${candidateData.industry}`)}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="outline" className="gap-1">
                    <Target className="w-3 h-3" />{t("common.competencies")}: {match.competence_percent}%
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Heart className="w-3 h-3" />{t("common.culture")}: {match.culture_percent}%
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="w-3 h-3" />{t("common.additional")}: {match.extra_percent}%
                  </Badge>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-5xl font-bold text-accent">{match.overall_percent}%</div>
                <div className="text-sm text-muted-foreground mb-3">{t("common.totalMatch")}</div>
                <div className="flex gap-2 justify-center md:justify-end">
                  <Button 
                    onClick={() => handleStatusChange('considering')}
                    variant={currentStatus === 'considering' ? "default" : "outline"}
                    className={currentStatus === 'considering' ? "bg-success hover:bg-success/90" : ""}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {t("employer.candidateDetail.markInterested")}
                  </Button>
                  <Button 
                    onClick={() => handleStatusChange('rejected')}
                    variant={currentStatus === 'rejected' ? "destructive" : "outline"}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    {t("employer.candidateDetail.markRejected")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why is this a good match */}
        {matchDetails?.strengths && matchDetails.strengths.length > 0 && (
          <Card className="mb-6 border-accent/30 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Sparkles className="w-5 h-5" />
                {t("employer.candidateDetail.whyGoodMatch")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t("employer.candidateDetail.matchExplanation", { 
                  name: t("employer.candidateDetail.thisCandidate"),
                  percent: match.overall_percent 
                })}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {matchDetails.strengths.slice(0, 4).map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          {matchDetails?.strengths && matchDetails.strengths.length > 0 && (
            <Card className="border-success/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <TrendingUp className="w-5 h-5" />
                  {t("employer.candidateDetail.strengths")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {matchDetails.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {matchDetails?.risks && matchDetails.risks.length > 0 && (
            <Card className="border-warning/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <TrendingDown className="w-5 h-5" />
                  {t("employer.candidateDetail.risks")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {matchDetails.risks.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Competencies */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t("employer.candidateDetail.competencies")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {matchDetails?.competenceDetails?.map((comp) => {
                const level = getLevel(comp.candidateScore);
                const feedback = getFeedback('competency', comp.competency, level, 'employer', i18n.language);
                const levelLabels = getLocalizedLevelLabels(i18n.language);

                // Calculate aprobata score for this competency
                const compAnswers = (candidateData?.competency_answers as Record<string, Record<string, number>>)?.[comp.competency];
                const aprobataQs = getAprobataQuestions(comp.competency);
                let aprobataScore: number | null = null;
                if (compAnswers && aprobataQs.length > 0) {
                  let sum = 0, count = 0;
                  aprobataQs.forEach(q => {
                    if (compAnswers[q.id] !== undefined) {
                      const value = q.reversed ? (6 - compAnswers[q.id]) : compAnswers[q.id];
                      sum += value;
                      count++;
                    }
                  });
                  if (count > 0) aprobataScore = sum / count;
                }
                
                return (
                  <div key={comp.competency} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {competencyNames[comp.competency]?.[lang] || comp.competency}
                      </span>
                      <Badge variant={
                        comp.status === 'excellent' ? 'default' :
                        comp.status === 'good' ? 'secondary' : 'outline'
                      }>
                        {Math.round(comp.matchPercent)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{t("employer.candidateDetail.candidateScore")}: {comp.candidateScore.toFixed(1)}</span>
                      <span>{t("employer.candidateDetail.yourRequirement")}: {comp.employerRequirement}</span>
                    </div>
                    <Progress value={comp.matchPercent} className="h-2" />
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          level === 'high' ? 'bg-success/20 text-success' : 
                          level === 'medium' ? 'bg-cta/20 text-cta' : 
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {levelLabels[level].label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feedback}</p>
                    </div>
                    {/* Aprobata / reliability inline */}
                    {aprobataScore !== null && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-accent/5 border border-accent/10">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                          {t("employer.candidateDetail.reliabilityScale")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            aprobataScore >= 4.5 ? 'bg-destructive/20 text-destructive' :
                            aprobataScore >= 3.5 ? 'bg-cta/20 text-cta' :
                            'bg-success/20 text-success'
                          }`}>
                            {aprobataScore >= 4.5 ? t("employer.candidateDetail.reliabilityLow") :
                             aprobataScore >= 3.5 ? t("employer.candidateDetail.reliabilityMedium") :
                             t("employer.candidateDetail.reliabilityHigh")}
                          </span>
                          <span className="text-xs text-muted-foreground">{aprobataScore.toFixed(1)}/5.0</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              {t("employer.candidateDetail.culture")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {matchDetails?.cultureDetails?.map((cult) => {
                const level = getLevel(cult.candidateScore);
                const feedback = getFeedback('culture', cult.dimension, level, 'employer', i18n.language);
                const levelLabels = getLocalizedLevelLabels(i18n.language);
                
                return (
                  <div key={cult.dimension} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {cultureNames[cult.dimension]?.[lang] || cult.dimension}
                      </span>
                      <Badge variant={
                        cult.status === 'aligned' ? 'default' :
                        cult.status === 'partial' ? 'secondary' : 'outline'
                      }>
                        {Math.round(cult.matchPercent)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{t("employer.candidateDetail.candidateScore")}: {cult.candidateScore.toFixed(1)}</span>
                      <span>{t("employer.candidateDetail.yourScore")}: {cult.employerScore.toFixed(1)}</span>
                    </div>
                    <Progress value={cult.matchPercent} className="h-2" />
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          level === 'high' ? 'bg-success/20 text-success' : 
                          level === 'medium' ? 'bg-cta/20 text-cta' : 
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {levelLabels[level].label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feedback}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Additional criteria */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {t("employer.candidateDetail.additionalCriteria")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Build criteria from live data */}
              {(() => {
                const getDisplayValue = (value: string | null | undefined, field: string, isExperience = false) => {
                  if (value === null || value === undefined || value === '') return '-';
                  if (field === 'industry') {
                    return t(`candidate.additional.industries.${value}`, value);
                  }
                  if (field === 'position_level') {
                    return t(`candidate.additional.positionLevels.${value}`, value);
                  }
                  if (isExperience) {
                    if (String(value) === '0') return t("employer.requirements.noExperienceRequired");
                    return `${value} ${t("common.years")}`;
                  }
                  return value;
                };

                // Industry match
                const industryMatch = 
                  candidateData?.industry === employerData?.industry ||
                  (employerData?.accepted_industries?.includes(candidateData?.industry) ?? false);
                
                // Experience match
                const candidateExp = parseInt(candidateData?.experience || '0') || 0;
                const requiredExp = parseInt(employerData?.required_experience || '0') || 0;
                const experienceMatch = employerData?.no_experience_required || candidateExp >= requiredExp;
                
                // Position level match
                const positionLevelOrder = ['junior', 'mid', 'senior', 'lead', 'manager', 'director'];
                const candidateLevelIndex = positionLevelOrder.indexOf(candidateData?.position_level || '');
                const employerLevelIndex = positionLevelOrder.indexOf(employerData?.position_level || '');
                const positionMatch = candidateData?.position_level === employerData?.position_level || 
                  (candidateLevelIndex >= employerLevelIndex && employerLevelIndex !== -1);

                const criteria = [
                  {
                    field: t("employer.candidateDetail.criteriaIndustry"),
                    matched: industryMatch,
                    candidateValue: candidateData?.industry,
                    employerValue: employerData?.industry,
                    acceptedValues: employerData?.accepted_industries || [],
                    fieldType: 'industry'
                  },
                  {
                    field: t("employer.candidateDetail.criteriaExperience"),
                    matched: experienceMatch,
                    candidateValue: candidateData?.experience,
                    employerValue: employerData?.no_experience_required ? '0' : employerData?.required_experience,
                    fieldType: 'experience'
                  },
                  {
                    field: t("employer.candidateDetail.criteriaPositionLevel"),
                    matched: positionMatch,
                    candidateValue: candidateData?.position_level,
                    employerValue: employerData?.position_level,
                    fieldType: 'position_level'
                  },
                ];

                return criteria.map((crit) => (
                  <div 
                    key={crit.field} 
                    className={`p-4 rounded-lg border ${
                      crit.matched ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {crit.matched ? (
                        <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-medium ${crit.matched ? '' : 'text-muted-foreground'}`}>
                            {crit.field}
                          </span>
                          <Badge variant={crit.matched ? "default" : "destructive"} className={crit.matched ? "bg-success" : ""}>
                            {crit.matched ? t("common.match") : t("employer.candidateDetail.noMatch")}
                          </Badge>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{t("employer.candidateDetail.candidateScore")}:</span>
                            <span className="font-medium">
                              {getDisplayValue(crit.candidateValue, crit.fieldType, crit.fieldType === 'experience')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{t("employer.candidateDetail.yourRequirement")}:</span>
                            <span className="font-medium">
                              {getDisplayValue(crit.employerValue, crit.fieldType, crit.fieldType === 'experience')}
                            </span>
                          </div>
                        </div>
                        {crit.acceptedValues && crit.acceptedValues.length > 0 && crit.fieldType === 'industry' && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {t("employer.candidateDetail.acceptedIndustries")}: {crit.acceptedValues.map((v: string) => t(`candidate.additional.industries.${v}`, v)).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <Link to="/employer/candidates">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("employer.candidateDetail.backToList")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default EmployerCandidateDetail;
