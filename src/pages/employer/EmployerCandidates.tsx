import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, ArrowLeft, Users, ChevronRight, Target, Heart, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MatchStatusBadge, MatchStatus } from "@/components/match/MatchStatusBadge";

const EmployerCandidates = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<any[]>([]);
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
        .eq("employer_user_id", user.id);
      
      if (matchError) {
        logError("EmployerCandidates.fetchMatches", matchError);
      } else {
        // Sort: interested first, then by overall_percent descending
        const sorted = (matchData || []).sort((a, b) => {
          if (a.status === 'considering' && b.status !== 'considering') return -1;
          if (b.status === 'considering' && a.status !== 'considering') return 1;
          return (b.overall_percent || 0) - (a.overall_percent || 0);
        });
        setMatches(sorted);
      }
    } catch (error) {
      logError("EmployerCandidates.fetchMatches", error);
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
          <Link to="/employer/dashboard"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" />{t("common.backToPanel")}</Button></Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("employer.candidates.title")}</h1>
          <p className="text-muted-foreground">{t("employer.candidates.subtitle")}</p>
        </div>

        <Card className="mb-8 border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center"><Users className="w-8 h-8 text-accent" /></div>
              <div>
                <h2 className="text-2xl font-bold">{matches.length}</h2>
                <p className="text-muted-foreground">
                  {matches.length === 0 && t("common.noMatchedCandidates")}
                  {matches.length === 1 && t("common.matchedCandidate")}
                  {matches.length > 1 && t("common.matchedCandidates")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {matches.length === 0 ? (
          <Card className="border-muted">
            <CardContent className="pt-6 text-center py-16">
              <div className="w-16 h-16 rounded-full bg-accent/20 mx-auto mb-6 flex items-center justify-center opacity-50"><Users className="w-8 h-8 text-accent" /></div>
              <h3 className="text-xl font-semibold mb-3">{t("employer.candidates.searchingTitle")}</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">{t("employer.candidates.searchingDescription")}</p>
              <Link to="/employer/dashboard"><Button variant="outline">{t("common.backToPanel")}</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center"><Users className="w-7 h-7 text-accent" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{t("employer.candidates.candidateNumber")} #{match.candidate_user_id.slice(0, 8)}</h3>
                          {match.status && match.status !== 'pending' && (
                            <MatchStatusBadge status={match.status as MatchStatus} perspective="employer" />
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
                      <Link to={`/employer/candidate/${match.candidate_user_id}`}><Button className="gap-2">{t("common.viewProfile")}<ChevronRight className="w-4 h-4" /></Button></Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployerCandidates;
