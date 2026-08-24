import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { toast } from "sonner";

interface Props {
  offerId: string;
  organizationId: string | null;
}

interface EmployeeRow {
  id: string;
  user_id: string;
  invited_email: string | null;
}

interface AssessmentRow {
  id: string;
  employee_user_id: string;
  consent_status: string;
  overall_percent: number | null;
  competence_percent: number | null;
  culture_percent: number | null;
  computed_at: string | null;
}

const consentLabel: Record<string, string> = {
  pending: "Oczekuje na zgodę",
  granted: "Zgoda udzielona",
  declined: "Zgoda odrzucona",
  revoked: "Zgoda wycofana",
};

/**
 * Analiza obecnych pracowników firmy względem konkretnego ogłoszenia.
 * Pracownicy NIE są kandydatami — dane widoczne są wyłącznie po ich zgodzie.
 */
export const InternalTeamPanel = ({ offerId, organizationId }: Props) => {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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
          .select("id, employee_user_id, consent_status, overall_percent, competence_percent, culture_percent, computed_at")
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
          toast.info("Ten pracownik jest już dodany do analizy tej roli");
        } else {
          throw error;
        }
      } else {
        toast.success("Wysłano prośbę o zgodę na analizę");
      }
      await fetchData();
    } catch (e) {
      logError("InternalTeamPanel.handleAdd", e);
      toast.error("Nie udało się dodać pracownika do analizy");
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
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-accent" /> Pracownicy firmy
          </CardTitle>
          <CardDescription>
            Dopasowanie obecnych pracowników do tej roli. Wynik pojawia się dopiero po zgodzie pracownika.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleRecalculate} disabled={busy}>
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> Przelicz
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {employees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              W Twojej organizacji nie ma jeszcze pracowników.
            </p>
            <Link to="/employer/team">
              <Button variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" /> Zaproś pracowników
              </Button>
            </Link>
          </div>
        ) : (
          employees.map((emp) => {
            const assessment = assessmentFor(emp.user_id);
            return (
              <div key={emp.id} className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3">
                <div>
                  <p className="font-medium">{emp.invited_email || "Pracownik"}</p>
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
      </CardContent>
    </Card>
  );
};
