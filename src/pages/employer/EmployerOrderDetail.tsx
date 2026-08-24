import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Users, ChevronRight, Edit, Archive, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { InternalTeamPanel } from "@/components/internal/InternalTeamPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const EmployerOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [offer, setOffer] = useState<any>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user && orderId) fetchOrder();
  }, [user, authLoading, navigate, orderId]);

  const fetchOrder = async () => {
    if (!user || !orderId) return;
    try {
      const [offerResult, matchResult] = await Promise.all([
        supabase.from("job_offers").select("*").eq("id", orderId).eq("user_id", user.id).single(),
        supabase.from("match_results").select("*", { count: "exact", head: true }).eq("job_offer_id", orderId),
      ]);

      if (offerResult.error) throw offerResult.error;
      setOffer(offerResult.data);
      setMatchCount(matchResult.count || 0);
    } catch (error) {
      logError("EmployerOrderDetail.fetchOrder", error);
      navigate("/employer/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!offer) return;
    const newStatus = !offer.is_active;
    try {
      const { error } = await supabase
        .from("job_offers")
        .update({ is_active: newStatus })
        .eq("id", offer.id);
      if (error) throw error;
      setOffer({ ...offer, is_active: newStatus });
      toast.success(newStatus ? t("employer.offers.reopened") : t("employer.offers.closed"));
    } catch (error) {
      logError("EmployerOrderDetail.handleToggleActive", error);
      toast.error(t("errors.genericError"));
    } finally {
      setCloseDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  if (!offer) return null;


  return (
    <DashboardLayout sidebar={<EmployerSidebar />}>
      <div className="max-w-3xl mx-auto px-2 sm:px-0">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/employer/dashboard")} className="mb-3 gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>
          
          <div className="space-y-3">
            <h1 className="text-lg sm:text-2xl font-bold break-words">{offer.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {formatDate(offer.created_at)}
              </span>
              <Badge variant={offer.is_active ? "default" : "secondary"} className="text-xs">
                {offer.is_active ? t("employer.offers.active") : t("employer.offers.archived")}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {offer.is_active ? (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setCloseDialogOpen(true)}>
                  <Archive className="w-3.5 h-3.5" />
                  {t("employer.offers.close")}
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleToggleActive}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t("employer.offers.reopen")}
                </Button>
              )}
              <Link to={`/employer/offer/${offer.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Edit className="w-3.5 h-3.5" />
                  {t("common.edit")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {offer.analyze_internal_team && (
          <div className="mb-4 sm:mb-6">
            <InternalTeamPanel offerId={offer.id} organizationId={offer.organization_id ?? null} offerTitle={offer.title} />
          </div>
        )}

        {offer.recruit_external_candidates !== false && (
        <Card className="mb-4 sm:mb-6 border-accent/20 hover:shadow-lg transition-shadow">
          <Link to={`/employer/candidates?offerId=${offer.id}`} className="block">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 sm:w-7 sm:h-7 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-lg font-semibold">{t("employer.orderDetail.candidatesTitle")}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {matchCount === 0 && t("employer.orderDetail.noCandidatesYet")}
                      {matchCount === 1 && `1 ${t("common.matchedCandidate")}`}
                      {matchCount > 1 && `${matchCount} ${t("common.matchedCandidates")}`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Link>
        </Card>
        )}

      </div>

      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("employer.offers.closeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("employer.offers.closeConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive}>
              {t("employer.offers.close")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default EmployerOrderDetail;
