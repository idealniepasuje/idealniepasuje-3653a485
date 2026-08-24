import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, UserPlus, Users, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InternalAssessmentDetails, type InternalAssessmentRecord } from "@/components/internal/InternalAssessmentDetails";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { toast } from "sonner";

interface Props {
  offerId: string;
  organizationId: string | null;
  offerTitle?: string;
}

interface EmployeeRow {
  id: string;
  user_id: string;
  invited_email: string | null;
}

interface AssessmentRow extends InternalAssessmentRecord {
  employee_user_id: string;
}

const consentLabel: Record<string, string> = {
  pending: "Analiza w przygotowaniu",
  granted: "Aktywny wybrany kandydat",
  declined: "Brak aktywnego członkostwa",
  revoked: "Brak aktywnego członkostwa",
};

/**
 * Analiza obecnych pracowników firmy względem konkretnego ogłoszenia.
 * Pracownicy NIE są kandydatami — dostęp wynika z aktywnego członkostwa pracownika w organizacji.
 */
export const InternalTeamPanel = ({ offerId, organizationId, offerTitle = "ta rola" }: Props) => {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [detailsFor, setDetailsFor] = useState<{ assessment: AssessmentRow; label: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    try {
      const [empRes, assessRes] = await Promise.all([
        supabase
          .from("organization_employees")
          .select("id, user_id, invited_email")
          .eq("organization_id", organizationId)
          .eq("status", "active"),
        supabase
          .from("internal_assessments")
          .select("id, employee_user_id, consent_status, overall_percent, competence_percent, culture_percent, extra_percent, computed_at, match_details")
          .eq("job_offer_id", offerId),
      ]);
      if (empRes.error) throw empRes.error;
      if (assessRes.error) throw assessRes.error;
      setEmployees(empRes.data || []);
      setAssessments(assessRes.data || []);
    } catch (e) {
      logError("InternalTeamPanel.fetchData", e);
    } finally {
      setLoading(false);
    }
  }, [organizationId, offerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const assessmentFor = (userId: string) => assessments.find((a) => a.employee_user_id === userId);

  const handleAdd = async (employeeUserId: string) => {
    if (!organizationId) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("internal_assessments").insert({
        organization_id: organizationId,
        job_offer_id: offerId,
        employee_user_id: employeeUserId,
      });
      if (error) {
        if ((error as any).code === "23505") {
          toast.info("Ten wybrany kandydat jest już dodany do analizy tej roli");
        } else {
          throw error;
        }
      } else {
        toast.success("Wybrany kandydat dodany do analizy tej roli");
      }
      await fetchData();
    } catch (e) {
      logError("InternalTeamPanel.handleAdd", e);
      toast.error("Nie udało się dodać wybranego kandydata do analizy");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (assessmentId: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("internal_assessments").delete().eq("id", assessmentId);
      if (error) throw error;
      toast.success("Usunięto z analizy tej roli");
      await fetchData();
    } catch (e) {
      logError("InternalTeamPanel.handleRemove", e);
      toast.error("Nie udało się usunąć analizy");
    } finally {
      setBusy(false);
    }
  };

  const handleRecalculate = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-internal-assessments", {
        body: { job_offer_id: offerId },
      });
      if (error) throw error;
      const computed = (data as any)?.computed ?? 0;
      toast.success(`Przeliczono analizy: ${computed}`);
      await fetchData();
    } catch (e) {
      logError("InternalTeamPanel.handleRecalculate", e);
      toast.error("Nie udało się przeliczyć analiz");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="h-24 rounded-lg bg-muted/40 animate-pulse" />;
  }

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          To ogłoszenie nie jest jeszcze powiązane z organizacją. Zapisz ogłoszenie ponownie, aby włączyć analizę zespołu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-accent" /> Wybrani kandydaci
          </CardTitle>
          <CardDescription>
            Dopasowanie wybranych kandydatów do tej roli. Wynik pojawia się dopiero po ich zgodzie.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {employees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              W Twojej organizacji nie ma jeszcze wybranych kandydatów.
            </p>
            <Link to="/employer/team">
              <Button variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" /> Zaproś wybranych kandydatów
              </Button>
            </Link>
          </div>
        ) : (
          employees.map((emp) => {
            const assessment = assessmentFor(emp.user_id);
            return (
              <div key={emp.id} className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3">
                <div>
                  <p className="font-medium">{emp.invited_email || "Wybrany kandydat"}</p>
                  {assessment ? (
                    <p className="text-xs text-muted-foreground">
                      {consentLabel[assessment.consent_status] || assessment.consent_status}
                      {assessment.consent_status === "granted" && !assessment.computed_at && " — brak wyniku, przelicz analizę"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nie uczestniczy w analizie tej roli</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {assessment?.consent_status === "granted" && assessment.overall_percent !== null && (
                    <Badge className="bg-accent text-accent-foreground text-sm">
                      {assessment.overall_percent}% dopasowania
                    </Badge>
                  )}
                  {assessment?.consent_status === "granted" && assessment.computed_at && (
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => setDetailsFor({ assessment, label: emp.invited_email || "Wybrany kandydat" })}
                    >
                      <BarChart3 className="w-4 h-4" /> Zobacz analizę
                    </Button>
                  )}
                  {assessment ? (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleRemove(assessment.id)}>
                      Usuń z analizy
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => handleAdd(emp.user_id)}>
                      Dodaj do analizy
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {employees.length > 0 && (
          <div className="pt-2 border-t flex justify-end">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={handleRecalculate} disabled={busy}>
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> Przelicz analizy
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={!!detailsFor} onOpenChange={(open) => !open && setDetailsFor(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analiza wybranego kandydata</DialogTitle>
            <DialogDescription>Dopasowanie wybranego kandydata do roli: {offerTitle}</DialogDescription>
          </DialogHeader>
          {detailsFor && (
            <InternalAssessmentDetails
              assessment={detailsFor.assessment}
              subjectLabel={detailsFor.label}
              roleTitle={offerTitle}
              perspective="employer"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
