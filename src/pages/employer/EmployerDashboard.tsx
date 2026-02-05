import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ChevronRight, Plus, MapPin, Briefcase, Calendar, Clock, FileText, Settings, Heart, CheckCircle2 } from "lucide-react";
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
      // Fetch employer profile
      const { data: profile, error: profileError } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (profileError && profileError.code !== "PGRST116") logError("EmployerDashboard.fetchData.profile", profileError);
      setEmployerProfile(profile);

      // Fetch job offers
      const { data: offersData, error: offersError } = await supabase
        .from("job_offers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (offersError) logError("EmployerDashboard.fetchData.offers", offersError);
      else setOffers(offersData || []);

      // Fetch matches
      const { data: matchData, error: matchError } = await supabase
        .from("match_results")
        .select("*")
        .eq("employer_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (matchError) logError("EmployerDashboard.fetchData.matches", matchError);
      else setMatches(matchData || []);

      // Calculate stats for each offer
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
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Cześć 👋</h1>
        <p className="text-muted-foreground">{t("employer.dashboard.subtitle")}</p>
      </div>

      {/* Company Profile Card */}
      <Card className="mb-8 border-cta/20 bg-cta/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-cta/20 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-cta" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("employer.profile.companyInfo")}</p>
                <h2 className="text-xl font-bold">{employerProfile?.company_name || t("common.companyName")}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {employerProfile?.industry && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {employerProfile.industry}
                    </span>
                  )}
                  {employerProfile?.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(employerProfile.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Progress Section - Show if not complete */}
      {!isProfileComplete && (
        <>
          <Card className="mb-6 border-cta/20 bg-cta/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-cta/20 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-cta" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-1">{t("employer.dashboard.organizationProfile")}</h2>
                  <p className="text-sm text-muted-foreground mb-2">
                    {progress < 33 && t("employer.dashboard.startWithRole")}
                    {progress >= 33 && progress < 66 && t("employer.dashboard.defineRequirements")}
                    {progress >= 66 && progress < 100 && t("employer.dashboard.doCultureTest")}
                    {progress === 100 && t("employer.dashboard.profileComplete")}
                  </p>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

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
        </>
      )}

      {/* Two Column Layout: Offers + Matches */}
      {isProfileComplete && (
        <div className={`grid ${offers.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Recent Offers Column */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg text-accent">{t("employer.dashboard.recentOffers")}</CardTitle>
                </div>
                <Link to="/employer/offer/new">
                  <Button size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    {t("employer.dashboard.newOffer")}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {offers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>{t("employer.offers.noOffers")}</p>
                  <Link to="/employer/offer/new">
                    <Button variant="outline" size="sm" className="mt-3">
                      {t("employer.offers.createFirst")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {offers.map((offer) => {
                    const stats = offerMatchCounts[offer.id] || { count: 0, avgMatch: 0 };
                    return (
                      <div key={offer.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{offer.title}</h3>
                              <Badge variant={offer.is_active ? "default" : "secondary"} className={offer.is_active ? "bg-success text-success-foreground" : ""}>
                                {offer.is_active ? t("employer.offers.active") : t("employer.offers.inactive")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {stats.count} {t("common.candidates")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(offer.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {offer.role_description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{offer.role_description}</p>
                        )}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("employer.dashboard.avgMatch")}</span>
                            <span className="font-semibold text-accent">{stats.avgMatch}%</span>
                          </div>
                          <Progress value={stats.avgMatch} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                  <Link to="/employer/offers" className="block text-center">
                    <Button variant="ghost" size="sm" className="w-full">
                      {t("employer.dashboard.viewMore")}
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Matches Column - Only show if there are offers */}
          {offers.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <CardTitle className="text-lg text-accent">{t("employer.dashboard.recentMatches")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {matches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>{t("employer.dashboard.searchingCandidates")}</p>
                  <p className="text-sm mt-1">{t("employer.dashboard.searchingCandidatesDescription")}</p>
                </div>
              ) : (
                <>
                  {matches.map((match) => (
                    <div key={match.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(match.candidate_user_id)} flex items-center justify-center shrink-0`}>
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {t("employer.candidates.candidateNumber")} #{match.candidate_user_id.slice(0, 8)}
                              </h3>
                              {match.status && match.status !== 'pending' && (
                                <MatchStatusBadge status={match.status as MatchStatus} perspective="employer" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(match.created_at)}
                            </div>
                          </div>
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{t("common.match")}</span>
                              <span className="font-semibold text-accent">{match.overall_percent}%</span>
                            </div>
                            <Progress value={match.overall_percent} className="h-2" />
                          </div>
                          <Link to={`/employer/candidate/${match.candidate_user_id}`}>
                            <Button size="sm" className="w-full">
                              {t("common.viewProfile")}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link to="/employer/candidates" className="block text-center">
                    <Button variant="ghost" size="sm" className="w-full">
                      {t("employer.dashboard.viewMore")}
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployerDashboard;
