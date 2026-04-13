import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase, Calendar, Users, ChevronRight, FileText, Settings, Edit, Archive, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
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

  const sections = [
    {
      title: t("employer.offerForm.roleTitle"),
      description: offer.role_description || offer.role_responsibilities 
        ? t("common.completed") 
        : t("common.toDo"),
      completed: !!(offer.role_description || offer.role_responsibilities),
      icon: FileText,
    },
    {
      title: t("employer.offerForm.requirementsTitle"),
      description: offer.industry && offer.position_level 
        ? `${offer.industry} · ${offer.position_level}` 
        : t("common.toDo"),
      completed: !!(offer.industry && offer.position_level),
      icon: Settings,
    },
  ];

  return (
    <DashboardLayout sidebar={<EmployerSidebar />}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/employer/dashboard")} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{offer.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(offer.created_at)}
                </span>
                <Badge variant={offer.is_active ? "default" : "secondary"}>
                  {offer.is_active ? t("employer.offers.active") : t("employer.offers.archived")}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {offer.is_active ? (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setCloseDialogOpen(true)}>
                  <Archive className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("employer.offers.close")}</span>
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleToggleActive}>
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("employer.offers.reopen")}</span>
                </Button>
              )}
              <Link to={`/employer/offer/${offer.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("common.edit")}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("employer.orderDetail.detailsTitle")}</CardTitle>
            <CardDescription>{t("employer.orderDetail.detailsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <div key={section.title} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{section.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                  </div>
                  <Badge variant={section.completed ? "default" : "outline"} className={section.completed ? "bg-success text-success-foreground" : ""}>
                    {section.completed ? t("common.completed") : t("common.toDo")}
                  </Badge>
                </div>
              );
            })}

            {offer.role_description && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">{t("employer.offerForm.roleTitle")}</p>
                <p className="text-sm text-muted-foreground">{offer.role_description}</p>
              </div>
            )}

            {offer.role_responsibilities && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">{t("candidate.employerDetail.roleResponsibilities")}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{offer.role_responsibilities}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:shadow-lg transition-shadow">
          <Link to={`/employer/candidates?offerId=${offer.id}`} className="block">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{t("employer.orderDetail.candidatesTitle")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {matchCount === 0 && t("employer.orderDetail.noCandidatesYet")}
                      {matchCount === 1 && `1 ${t("common.matchedCandidate")}`}
                      {matchCount > 1 && `${matchCount} ${t("common.matchedCandidates")}`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>
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
