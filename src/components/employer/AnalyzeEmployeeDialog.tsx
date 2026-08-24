import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { toast } from "sonner";
import { Briefcase, RefreshCw, Send, ToggleRight } from "lucide-react";

interface OfferRow {
  id: string;
  title: string;
  is_active: boolean | null;
  analyze_internal_team: boolean | null;
  recruit_external_candidates: boolean | null;
}

interface AssessmentRow {
  id: string;
  job_offer_id: string;
  consent_status: string;
  overall_percent: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  employeeUserId: string;
  employeeLabel: string;
}

export const AnalyzeEmployeeDialog = ({
  open,
  onOpenChange,
  organizationId,
  employeeUserId,
  employeeLabel,
}: Props) => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [offersRes, assessRes] = await Promise.all([
        supabase
          .from("job_offers")
          .select("id, title, is_active, analyze_internal_team, recruit_external_candidates")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false }),
        supabase
          .from("internal_assessments")
          .select("id, job_offer_id, consent_status, overall_percent")
          .eq("organization_id", organizationId)
          .eq("employee_user_id", employeeUserId),
      ]);
      if (offersRes.error) throw offersRes.error;
      if (assessRes.error) throw assessRes.error;
      setOffers(offersRes.data || []);
      setAssessments(assessRes.data || []);
    } catch (e) {
      logError("AnalyzeEmployeeDialog.fetchData", e);
      toast.error("Nie udało się pobrać ról do analizy");
    } finally {
      setLoading(false);
    }
  }, [organizationId, employeeUserId]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const requestAssessment = async (offer: OfferRow) => {
    setBusyOfferId(offer.id);
    try {
      const { error } = await supabase.from("internal_assessments").insert({
        organization_id: organizationId,
        job_offer_id: offer.id,
        employee_user_id: employeeUserId,
        consent_status: "pending",
        requested_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Prośba o zgodę wysłana do pracownika");
      await fetchData();
    } catch (e: any) {
      logError("AnalyzeEmployeeDialog.requestAssessment", e);
      toast.error(e?.message || "Nie udało się wysłać prośby o analizę");
    } finally {
      setBusyOfferId(null);
    }
  };

  const recompute = async (offer: OfferRow) => {
    setBusyOfferId(offer.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-internal-assessments", {
        body: { job_offer_id: offer.id, employee_user_id: employeeUserId },
      });
      if (error) throw error;
      if ((data as any)?.success === false) {
        toast.warning((data as any)?.message || "Nie udało się przeliczyć analizy");
      } else {
        toast.success("Analiza przeliczona");
      }
      await fetchData();
    } catch (e: any) {
      logError("AnalyzeEmployeeDialog.recompute", e);
      toast.error(e?.message || "Nie udało się przeliczyć analizy");
    } finally {
      setBusyOfferId(null);
    }
  };

  const enableInternal = async (offer: OfferRow) => {
    setBusyOfferId(offer.id);
    try {
      const { error } = await supabase
        .from("job_offers")
        .update({ analyze_internal_team: true })
        .eq("id", offer.id);
      if (error) throw error;
      toast.success("Analiza zespołu włączona dla tej roli");
      await fetchData();
    } catch (e: any) {
      logError("AnalyzeEmployeeDialog.enableInternal", e);
      toast.error(e?.message || "Nie udało się włączyć analizy zespołu");
    } finally {
      setBusyOfferId(null);
    }
  };

  const renderState = (offer: OfferRow) => {
    const a = assessments.find((x) => x.job_offer_id === offer.id);
    const busy = busyOfferId === offer.id;

    if (!offer.analyze_internal_team) {
      return (
        <Button size="sm" variant="outline" className="gap-2" disabled={busy} onClick={() => enableInternal(offer)}>
          <ToggleRight className="w-4 h-4" /> Włącz analizę zespołu
        </Button>
      );
    }

    if (!a) {

      return (
        <Button size="sm" className="gap-2" disabled={busy} onClick={() => requestAssessment(offer)}>
          <Send className="w-4 h-4" /> Poproś o analizę
        </Button>
      );
    }
    if (a.consent_status === "pending") {
      return <Badge variant="secondary">Oczekuje na zgodę</Badge>;
    }
    if (a.consent_status === "declined") {
      return <Badge variant="outline">Pracownik odmówił</Badge>;
    }
    if (a.consent_status === "revoked") {
      return <Badge variant="outline">Zgoda wycofana</Badge>;
    }
    // granted
    if (a.overall_percent === null || a.overall_percent === undefined) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-accent/15 text-accent border-0">Zgoda udzielona</Badge>
          <Button size="sm" variant="outline" className="gap-2" disabled={busy} onClick={() => recompute(offer)}>
            <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> Przelicz
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-accent/15 text-accent border-0">{a.overall_percent}% dopasowania</Badge>
        <Button size="sm" variant="outline" onClick={() => navigate(`/employer/offer/${offer.id}`)}>
          Zobacz analizę
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analizuj względem roli</DialogTitle>
          <DialogDescription>
            {employeeLabel} — wybierz rolę, dla której chcesz sprawdzić dopasowanie. Analiza uruchamia się dopiero po
            zgodzie pracownika.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-10 h-10 rounded-full bg-accent/20 animate-pulse" />
          </div>
        ) : offers.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">Nie masz jeszcze roli z włączoną analizą zespołu.</p>
            <Button onClick={() => navigate("/employer/offer/new")} className="gap-2">
              <Briefcase className="w-4 h-4" /> Dodaj ogłoszenie z analizą zespołu
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">{offer.title}</p>
                  {!offer.is_active && (
                    <p className="text-xs text-muted-foreground">Ogłoszenie nieaktywne</p>
                  )}
                </div>
                {renderState(offer)}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
