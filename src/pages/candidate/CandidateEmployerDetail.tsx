import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogOut, ArrowLeft, Target, Heart, Briefcase, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

const CandidateEmployerDetail = () => {
  const { employerId } = useParams<{ employerId: string }>();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [match, setMatch] = useState<any>(null);
  const [employer, setEmployer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user && employerId) fetchMatchData();
  }, [user, authLoading, navigate, employerId]);

  const fetchMatchData = async () => {
    if (!user || !employerId) return;
    try {
      const [matchResult, employerResult] = await Promise.all([
        supabase
          .from("match_results")
          .select("*")
          .eq("candidate_user_id", user.id)
          .eq("employer_user_id", employerId)
          .single(),
        supabase
          .from("employer_profiles")
          .select("company_name, role_description, industry")
          .eq("user_id", employerId)
          .single()
      ]);
      
      if (matchResult.error) {
        logError("CandidateEmployerDetail.fetchMatchData", matchResult.error);
      } else {
        setMatch(matchResult.data);
      }

      if (!employerResult.error) {
        setEmployer(employerResult.data);
      }
    } catch (error) {
      logError("CandidateEmployerDetail.fetchMatchData", error);
    } finally {
      setLoading(false);
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
            <h2 className="text-xl font-semibold mb-2">{t("candidate.employerDetail.notFound")}</h2>
            <Link to="/candidate/matches">
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
          <Link to="/candidate/matches">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />{t("common.back")}
            </Button>
          </Link>
        </div>

        {/* Header with overall match */}
        <Card className="mb-8 border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    {employer?.company_name || t("candidate.matches.company")}
                  </h1>
                  {employer?.industry && (
                    <p className="text-muted-foreground mb-2">{employer.industry}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
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
              </div>
              <div className="text-center md:text-right">
                <div className="text-5xl font-bold text-accent">{match.overall_percent}%</div>
                <div className="text-sm text-muted-foreground">{t("common.totalMatch")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role description */}
        {employer?.role_description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("candidate.employerDetail.roleDescription")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{employer.role_description}</p>
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
                  {t("candidate.employerDetail.strengths")}
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

          {/* Areas to develop */}
          {matchDetails?.risks && matchDetails.risks.length > 0 && (
            <Card className="border-warning/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <TrendingDown className="w-5 h-5" />
                  {t("candidate.employerDetail.areasToImprove")}
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
              {t("candidate.employerDetail.competencies")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchDetails?.competenceDetails?.map((comp) => (
                <div key={comp.competency} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {competencyNames[comp.competency]?.[lang] || comp.competency}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        comp.status === 'excellent' ? 'default' :
                        comp.status === 'good' ? 'secondary' : 'outline'
                      }>
                        {Math.round(comp.matchPercent)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{t("candidate.employerDetail.yourScore")}: {comp.candidateScore.toFixed(1)}</span>
                    <span>{t("candidate.employerDetail.requirement")}: {comp.employerRequirement}</span>
                  </div>
                  <Progress value={comp.matchPercent} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Culture */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              {t("candidate.employerDetail.culture")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchDetails?.cultureDetails?.map((cult) => (
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
                    <span>{t("candidate.employerDetail.yourScore")}: {cult.candidateScore.toFixed(1)}</span>
                    <span>{t("candidate.employerDetail.companyScore")}: {cult.employerScore.toFixed(1)}</span>
                  </div>
                  <Progress value={cult.matchPercent} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional criteria */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {t("candidate.employerDetail.additionalCriteria")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {matchDetails?.extraDetails?.map((extra) => (
                <div 
                  key={extra.field} 
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    extra.matched ? 'border-success/30 bg-success/5' : 'border-muted bg-muted/30'
                  }`}
                >
                  {extra.matched ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={extra.matched ? '' : 'text-muted-foreground'}>
                    {extra.field}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <Link to="/candidate/matches">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("candidate.employerDetail.backToList")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CandidateEmployerDetail;
