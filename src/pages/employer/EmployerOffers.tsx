import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, ChevronRight, Users, MoreVertical, Trash2, Edit, Archive, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const EmployerOffers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [offers, setOffers] = useState<any[]>([]);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchOffers();
  }, [user, authLoading, navigate]);

  const fetchOffers = async () => {
    if (!user) return;
    try {
      const { data: offersData, error: offersError } = await supabase
        .from("job_offers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (offersError) {
        logError("EmployerOffers.fetchOffers", offersError);
      } else {
        setOffers(offersData || []);
        
        // Fetch match counts for each offer
        if (offersData && offersData.length > 0) {
          const counts: Record<string, number> = {};
          for (const offer of offersData) {
            const { count } = await supabase
              .from("match_results")
              .select("*", { count: "exact", head: true })
              .eq("job_offer_id", offer.id);
            counts[offer.id] = count || 0;
          }
          setMatchCounts(counts);
        }
      }
    } catch (error) {
      logError("EmployerOffers.fetchOffers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async () => {
    if (!offerToDelete) return;
    try {
      const { error } = await supabase
        .from("job_offers")
        .delete()
        .eq("id", offerToDelete);
      
      if (error) throw error;
      
      setOffers(offers.filter(o => o.id !== offerToDelete));
      toast.success(t("employer.offers.deleted"));
    } catch (error) {
      logError("EmployerOffers.handleDeleteOffer", error);
      toast.error(t("errors.genericError"));
    } finally {
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  };

  const handleToggleActive = async (offerId: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase
        .from("job_offers")
        .update({ is_active: !currentlyActive })
        .eq("id", offerId);
      if (error) throw error;
      setOffers(offers.map(o => o.id === offerId ? { ...o, is_active: !currentlyActive } : o));
      toast.success(!currentlyActive ? t("employer.offers.reopened") : t("employer.offers.closed"));
    } catch (error) {
      logError("EmployerOffers.handleToggleActive", error);
      toast.error(t("errors.genericError"));
    }
  };

  const activeOffers = offers.filter(o => o.is_active !== false);
  const archivedOffers = offers.filter(o => o.is_active === false);

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("employer.offers.title")}</h1>
          <p className="text-muted-foreground">{t("employer.offers.subtitle")}</p>
        </div>
        <Link to="/employer/offer/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t("employer.offers.addNew")}
          </Button>
        </Link>
      </div>

      {offers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-16">
            <div className="w-16 h-16 rounded-full bg-accent/20 mx-auto mb-6 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t("employer.offers.noOffers")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">{t("employer.offers.noOffersDescription")}</p>
            <Link to="/employer/offer/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("employer.offers.createFirst")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {activeOffers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{t("employer.offers.activeOffers")}</h2>
              <div className="grid gap-4">
                {activeOffers.map((offer) => renderOfferCard(offer))}
              </div>
            </div>
          )}

          {archivedOffers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">{t("employer.offers.archivedOffers")}</h2>
              <div className="grid gap-4">
                {archivedOffers.map((offer) => renderOfferCard(offer))}
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("employer.offers.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("employer.offers.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOffer} className="bg-destructive text-destructive-foreground">
              {t("employer.offers.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default EmployerOffers;
