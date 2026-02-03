import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, ArrowLeft, Building2, ChevronRight, Target, Heart, Briefcase, ThumbsUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const CandidateMatches = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<any[]>([]);
  const [employers, setEmployers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchMatches();
  }, [user, authLoading, navigate]);

  const fetchMatches = async () => {
    if (!user) return;
    try {
      const { data: matchData, error: matchError } = await supabase
        .from("match_results")
        .select("*")
        .eq("candidate_user_id", user.id)
        .order("overall_percent", { ascending: false });
      
      if (matchError) {
        logError("CandidateMatches.fetchMatches", matchError);
      } else {
        setMatches(matchData || []);
        
        // Fetch employer profiles for company names
        if (matchData && matchData.length > 0) {
          const employerIds = matchData.map(m => m.employer_user_id);
          const { data: employerData, error: employerError } = await supabase
            .from("employer_profiles")
            .select("user_id, company_name")
            .in("user_id", employerIds);
          
          if (!employerError && employerData) {
            const employerMap: Record<string, any> = {};
            employerData.forEach(emp => {
              employerMap[emp.user_id] = emp;
            });
            setEmployers(employerMap);
          }
        }
      }
    } catch (error) {
      logError("CandidateMatches.fetchMatches", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

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
          <Link to="/candidate/dashboard"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" />{t("common.backToPanel")}</Button></Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("candidate.matches.title")}</h1>
          <p className="text-muted-foreground">{t("candidate.matches.subtitle")}</p>
        </div>

        <Card className="mb-8 border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center"><Building2 className="w-8 h-8 text-accent" /></div>
              <div>
                <h2 className="text-2xl font-bold">{matches.length}</h2>
                <p className="text-muted-foreground">
                  {matches.length === 0 && t("candidate.matches.noMatches")}
                  {matches.length === 1 && t("candidate.matches.oneMatch")}
                  {matches.length > 1 && t("candidate.matches.multipleMatches")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {matches.length === 0 ? (
          <Card className="border-muted">
            <CardContent className="pt-6 text-center py-16">
              <div className="w-16 h-16 rounded-full bg-accent/20 mx-auto mb-6 flex items-center justify-center opacity-50"><Building2 className="w-8 h-8 text-accent" /></div>
              <h3 className="text-xl font-semibold mb-3">{t("candidate.matches.searchingTitle")}</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">{t("candidate.matches.searchingDescription")}</p>
              <Link to="/candidate/dashboard"><Button variant="outline">{t("common.backToPanel")}</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => {
              const employer = employers[match.employer_user_id];
              return (
                <Card key={match.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center"><Building2 className="w-7 h-7 text-accent" /></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {employer?.company_name || t("candidate.matches.company")}
                            </h3>
                            {match.status === 'considering' && (
                              <Badge className="bg-success text-success-foreground gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {t("candidate.matches.employerInterested")}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="gap-1"><Target className="w-3 h-3" />{t("common.competencies")}: {match.competence_percent}%</Badge>
                            <Badge variant="outline" className="gap-1"><Heart className="w-3 h-3" />{t("common.culture")}: {match.culture_percent}%</Badge>
                            {match.extra_percent !== null && <Badge variant="outline" className="gap-1"><Briefcase className="w-3 h-3" />{t("common.additional")}: {match.extra_percent}%</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-3xl font-bold text-accent">{match.overall_percent}%</div>
                          <div className="text-xs text-muted-foreground">{t("common.totalMatch")}</div>
                        </div>
                        <Link to={`/candidate/employer/${match.employer_user_id}`}><Button className="gap-2">{t("common.viewDetails")}<ChevronRight className="w-4 h-4" /></Button></Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateMatches;
