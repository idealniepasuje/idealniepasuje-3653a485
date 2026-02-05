import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ChevronRight, Plus, Briefcase, Calendar, Clock, FileText, Settings, Heart, CheckCircle2, Sparkles, MessageSquare, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { MatchStatusBadge, MatchStatus } from "@/components/match/MatchStatusBadge";

const EmployerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [offerMatchCounts, setOfferMatchCounts] = useState<Record<string, { count: number; avgMatch: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: profile, error: profileError } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (profileError && profileError.code !== "PGRST116") logError("EmployerDashboard.fetchData.profile", profileError);
      setEmployerProfile(profile);

      const { data: offersData, error: offersError } = await supabase
        .from("job_offers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (offersError) logError("EmployerDashboard.fetchData.offers", offersError);
      else setOffers(offersData || []);

      const { data: matchData, error: matchError } = await supabase
        .from("match_results")
        .select("*")
        .eq("employer_user_id", user.id)
        .not("job_offer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(3);
      if (matchError) logError("EmployerDashboard.fetchData.matches", matchError);
      else setMatches(matchData || []);

      if (offersData && offersData.length > 0) {
        const counts: Record<string, { count: number; avgMatch: number }> = {};
        for (const offer of offersData) {
          const { data: offerMatches } = await supabase
            .from("match_results")
            .select("overall_percent")
            .eq("job_offer_id", offer.id);
          const matchList = offerMatches || [];
          const avg = matchList.length > 0 
            ? Math.round(matchList.reduce((sum, m) => sum + (m.overall_percent || 0), 0) / matchList.length)
            : 0;
          counts[offer.id] = { count: matchList.length, avgMatch: avg };
        }
        setOfferMatchCounts(counts);
      }
    } catch (error) {
      logError("EmployerDashboard.fetchData", error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileProgress = () => {
    if (!employerProfile) return 0;
    let progress = 0;
    if (employerProfile.role_completed) progress += 33;
    if (employerProfile.requirements_completed) progress += 33;
    if (employerProfile.culture_completed) progress += 34;
    return Math.min(progress, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return t("match.timeAgo.justNow");
    if (diffHours < 24) return t("match.timeAgo.hoursAgo", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    return t("match.timeAgo.daysAgo", { count: diffDays });
  };

  const getAvatarColor = (id: string) => {
    const colors = ['bg-accent/20', 'bg-cta/20', 'bg-primary/20', 'bg-success/20'];
    const index = parseInt(id.slice(0, 2), 16) % colors.length;
    return colors[index];
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

  const progress = getProfileProgress();
  const isProfileComplete = employerProfile?.profile_completed;

  return (
    <DashboardLayout sidebar={<EmployerSidebar />}>
      {/* Expert Badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Sparkles className="w-4 h-4 text-accent" />
        <span>{t("expert.badge")} – {t("expert.description")}</span>
      </div>

      {/* Thank You Card - Show when profile is complete */}
      {isProfileComplete && (
        <Card className="mb-6 bg-gradient-to-r from-accent to-primary text-primary-foreground border-0">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{t("employer.dashboard.profileCompleteTitle")}</h2>
                <p className="text-primary-foreground/90 mb-3">
                  {t("employer.dashboard.profileCompleteDescription")}
                </p>
                <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-4">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("employer.dashboard.profileCompleteMatch")}</span>
                </div>
                <Link to="/employer/feedback">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {t("employer.dashboard.shareFeedback")}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Progress Card */}
      <Card className="mb-6 border-cta/20 bg-cta/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-cta/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-cta" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">{t("employer.dashboard.organizationProfile")}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {isProfileComplete 
                  ? t("employer.dashboard.profileComplete")
                  : progress < 33 
                    ? t("employer.dashboard.startWithRole")
                    : progress < 66 
                      ? t("employer.dashboard.defineRequirements")
                      : t("employer.dashboard.doCultureTest")
                }
              </p>
              <Progress value={isProfileComplete ? 100 : progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Steps - 3 Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="group hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <Badge variant={employerProfile?.role_completed ? "default" : "outline"} className={employerProfile?.role_completed ? "bg-success" : ""}>
                {employerProfile?.role_completed && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {employerProfile?.role_completed ? t("common.done") : `${t("common.step")} 1`}
              </Badge>
            </div>
            <CardTitle className="text-base">{t("employer.dashboard.roleDescription")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("employer.dashboard.roleDescriptionSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <Link to="/employer/role">
              <Button className="w-full gap-2" size="sm" variant={employerProfile?.role_completed ? "outline" : "default"}>
                {employerProfile?.role_completed ? t("common.edit") : t("common.fill")}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className={`group hover:shadow-lg transition-shadow ${!employerProfile?.role_completed ? "opacity-60" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-cta/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-cta" />
              </div>
              <Badge variant={employerProfile?.requirements_completed ? "default" : "outline"} className={employerProfile?.requirements_completed ? "bg-success" : ""}>
                {employerProfile?.requirements_completed && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {employerProfile?.requirements_completed ? t("common.done") : `${t("common.step")} 2`}
              </Badge>
            </div>
            <CardTitle className="text-base">{t("employer.dashboard.requirements")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("employer.dashboard.requirementsSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <Link to="/employer/requirements">
              <Button className="w-full gap-2" size="sm" variant={employerProfile?.requirements_completed ? "outline" : "default"} disabled={!employerProfile?.role_completed}>
                {employerProfile?.requirements_completed ? t("common.edit") : t("common.fill")}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className={`group hover:shadow-lg transition-shadow ${!employerProfile?.requirements_completed ? "opacity-60" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <Badge variant={employerProfile?.culture_completed ? "default" : "outline"} className={employerProfile?.culture_completed ? "bg-success" : ""}>
                {employerProfile?.culture_completed && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {employerProfile?.culture_completed ? t("common.done") : `${t("common.step")} 3`}
              </Badge>
            </div>
            <CardTitle className="text-base">{t("employer.dashboard.workCulture")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("employer.dashboard.workCultureSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <Link to="/employer/culture">
              <Button className="w-full gap-2" size="sm" variant={employerProfile?.culture_completed ? "outline" : "default"} disabled={!employerProfile?.requirements_completed}>
                {employerProfile?.culture_completed ? t("common.edit") : t("common.fill")}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Matched Candidates Section - Only show when profile complete */}
      {isProfileComplete && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t("employer.dashboard.matchedCandidates")}</h2>
          <Link to="/employer/candidates">
            <Button variant="outline" size="sm" className="gap-2">
              {t("employer.dashboard.viewAllMatches")}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {isProfileComplete && (
        matches.length === 0 ? (
          <Card className="mb-8">
            <CardContent className="pt-6 text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground">{t("employer.dashboard.searchingCandidates")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("employer.dashboard.searchingCandidatesDescription")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {matches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to={`/employer/candidate/${match.candidate_user_id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(match.candidate_user_id)} flex items-center justify-center shrink-0`}>
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm">
                            {t("employer.candidates.candidateNumber")} #{match.candidate_user_id.slice(0, 8)}
                          </h3>
                          {match.status && match.status !== 'pending' && (
                            <MatchStatusBadge status={match.status as MatchStatus} perspective="employer" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(match.created_at)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("common.match")}</span>
                            <span className="font-bold text-accent">{match.overall_percent}%</span>
                          </div>
                          <Progress value={match.overall_percent} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )
      )}
    </DashboardLayout>
  );
};

export default EmployerDashboard;
