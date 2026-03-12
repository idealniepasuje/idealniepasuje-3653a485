import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ChevronRight, Plus, Briefcase, Calendar, Sparkles, MessageSquare, CheckCircle, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { FeedbackModal } from "@/components/FeedbackModal";

const EmployerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
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
        .limit(10);
      if (offersError) logError("EmployerDashboard.fetchData.offers", offersError);
      setOffers(offersData || []);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  const hasCompanyProfile = !!(employerProfile?.company_name && employerProfile?.industry);
  const hasOffers = offers.length > 0;

  return (
    <DashboardLayout sidebar={<EmployerSidebar />}>
      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cześć 👋</h1>
        <p className="text-muted-foreground">{t("employer.dashboard.subtitle")}</p>
      </div>

      {/* Expert Badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Sparkles className="w-4 h-4 text-accent" />
        <span>{t("expert.badge")} – {t("expert.description")}</span>
      </div>

      {/* Step 1: Complete company profile */}
      {!hasCompanyProfile && (
        <Card className="mb-6 bg-gradient-to-r from-cta/10 to-accent/10 border-cta/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-cta/20 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-cta" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{t("employer.dashboard.completeProfileTitle")}</h2>
                <p className="text-muted-foreground mb-4">
                  {t("employer.dashboard.completeProfileDescription")}
                </p>
                <Link to="/employer/profile">
                  <Button className="gap-2 bg-cta text-cta-foreground hover:bg-cta/90">
                    <Settings className="w-4 h-4" />
                    {t("employer.dashboard.goToProfile")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Create first job */}
      {hasCompanyProfile && !hasOffers && (
        <Card className="mb-6 bg-gradient-to-r from-cta/10 to-accent/10 border-cta/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-cta/20 flex items-center justify-center shrink-0">
                <Briefcase className="w-7 h-7 text-cta" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{t("employer.dashboard.createFirstJobTitle")}</h2>
                <p className="text-muted-foreground mb-4">
                  {t("employer.dashboard.createFirstJobDescription")}
                </p>
                <Link to="/employer/offer/new">
                  <Button className="gap-2 bg-cta text-cta-foreground hover:bg-cta/90">
                    <Plus className="w-4 h-4" />
                    {t("employer.dashboard.newOffer")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thank You Card - Show when profile is complete and has offers */}
      {hasCompanyProfile && hasOffers && (
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

      {/* Orders List */}
      {hasOffers && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                <CardTitle className="text-lg text-accent">{t("employer.dashboard.yourOrders")}</CardTitle>
              </div>
              <Link to="/employer/offer/new">
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  {t("employer.dashboard.newOffer")}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {offers.map((offer) => {
              const stats = offerMatchCounts[offer.id] || { count: 0, avgMatch: 0 };
              return (
                <Link key={offer.id} to={`/employer/order/${offer.id}`} className="block">
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="w-4 h-4 text-accent shrink-0" />
                          <h3 className="font-semibold truncate">{offer.title}</h3>
                          <Badge variant={offer.is_active ? "default" : "secondary"} className={`shrink-0 ${offer.is_active ? "bg-success text-success-foreground" : ""}`}>
                            {offer.is_active ? t("employer.offers.active") : t("employer.offers.inactive")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(offer.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {stats.count} {stats.count === 1 ? t("common.matchedCandidate") : t("common.matchedCandidates")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
            <Link to="/employer/offers" className="block text-center">
              <Button variant="ghost" size="sm" className="w-full">
                {t("employer.dashboard.viewMore")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      <FeedbackModal userType="employer" isComplete={hasCompanyProfile && hasOffers} />
    </DashboardLayout>
  );
};

export default EmployerDashboard;
