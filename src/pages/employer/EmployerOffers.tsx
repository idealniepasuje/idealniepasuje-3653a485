import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, ChevronRight, Users, MoreVertical, Trash2, Edit } from "lucide-react";
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
        <div className="grid gap-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <Link to={`/employer/order/${offer.id}`} className="block">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{offer.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          {offer.industry && <span>{offer.industry}</span>}
                          {offer.position_level && (
                            <>
                              <span>•</span>
                              <span>{offer.position_level}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={offer.is_active ? "default" : "secondary"}>
                        {offer.is_active ? t("employer.offers.active") : t("employer.offers.inactive")}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigate(`/employer/offer/${offer.id}`); }}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              setOfferToDelete(offer.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("employer.offers.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
              </Link>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{matchCounts[offer.id] || 0} {t("common.matchedCandidates")}</span>
                  </div>
                  <Link to={`/employer/order/${offer.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      {t("employer.offers.viewDetails")}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
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
