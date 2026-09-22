import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  UserPlus,
  Users,
  BarChart3,
  Mail,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InternalAssessmentDetails,
  type InternalAssessmentRecord,
} from "@/components/internal/InternalAssessmentDetails";
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

interface InvitationRow {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface AssessmentRow extends InternalAssessmentRecord {
  employee_user_id: string;
}

const consentLabel: Record<string, string> = {
  pending: "Oczekiwanie na zgodę",
  granted: "Zaproszenie zaakceptowane",
  declined: "Zaproszenie odrzucone",
  revoked: "Dostęp cofnięty",
};

export const InternalTeamPanel = ({
  offerId,
  organizationId,
  offerTitle = "ta rola",
}: Props) => {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  const [detailsFor, setDetailsFor] = useState<{
    assessment: AssessmentRow;
    label: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      const [employeesRes, assessmentsRes, invitationsRes] =
        await Promise.all([
          supabase
            .from("organization_employees")
            .select("id, user_id, invited_email")
            .eq("organization_id", organizationId)
            .eq("status", "active"),

          supabase
            .from("internal_assessments")
            .select(
              "id, employee_user_id, consent_status, overall_percent, competence_percent, culture_percent, extra_percent, computed_at, match_details",
            )
            .eq("organization_id", organizationId)
            .eq("job_offer_id", offerId),

          supabase
            .from("organization_invitations")
            .select(
              "id, email, status, expires_at, created_at, job_offer_id",
            )
            .eq("organization_id", organizationId)
            .eq("job_offer_id", offerId)
            .eq("status", "pending")
            .order("created_at", { ascending: false }),
        ]);

      if (employeesRes.error) throw employeesRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;
      if (invitationsRes.error) throw invitationsRes.error;

      setEmployees(employeesRes.data || []);
      setAssessments(assessmentsRes.data || []);
      setInvitations(invitationsRes.data || []);
    } catch (error) {
      logError("InternalTeamPanel.fetchData", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, offerId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const employeeByUserId = useMemo(() => {
    return new Map(
      employees.map((employee) => [employee.user_id, employee]),
    );
  }, [employees]);

  const activeAssessments = assessments.filter(
    (assessment) =>
      assessment.consent_status !== "declined" &&
      assessment.consent_status !== "revoked",
  );

  const handleInvite = async () => {
    if (!organizationId) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Podaj adres e-mail kandydata");
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "invite-employee",
        {
          body: {
            organization_id: organizationId,
            job_offer_id: offerId,
            email: normalizedEmail,
          },
        },
      );

      if (error) throw error;

      if ((data as any)?.email_sent === false) {
        toast.warning(
          "Zaproszenie zostało zapisane, ale nie udało się wysłać e-maila.",
        );
      } else {
        toast.success(
          `Zaproszenie do oferty „${offerTitle}” zostało wysłane`,
        );
      }

      setEmail("");
      await fetchData();
    } catch (error: any) {
      logError("InternalTeamPanel.handleInvite", error);

      toast.error(
        error?.message ||
          "Nie udało się wysłać zaproszenia",
      );
    } finally {
      setSending(false);
    }
  };

  const handleRevokeInvitation = async (
    invitationId: string,
  ) => {
    setBusy(true);

    try {
      const { error } = await supabase
        .from("organization_invitations")
        .update({
          status: "revoked",
        })
        .eq("id", invitationId)
        .eq("organization_id", organizationId)
        .eq("job_offer_id", offerId);

      if (error) throw error;

      toast.success("Zaproszenie zostało anulowane");

      await fetchData();
    } catch (error) {
      logError(
        "InternalTeamPanel.handleRevokeInvitation",
        error,
      );

      toast.error("Nie udało się anulować zaproszenia");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveAssessment = async (
    assessmentId: string,
  ) => {
    setBusy(true);

    try {
      const { error } = await supabase
        .from("internal_assessments")
        .delete()
        .eq("id", assessmentId)
        .eq("job_offer_id", offerId);

      if (error) throw error;

      toast.success(
        "Kandydat został usunięty z tej oferty",
      );

      await fetchData();
    } catch (error) {
      logError(
        "InternalTeamPanel.handleRemoveAssessment",
        error,
      );

      toast.error(
        "Nie udało się usunąć kandydata z tej oferty",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRecalculate = async () => {
    setBusy(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "generate-internal-assessments",
          {
            body: {
              job_offer_id: offerId,
            },
          },
        );

      if (error) throw error;

      const computed = (data as any)?.computed ?? 0;

      toast.success(
        `Przeliczono analizy: ${computed}`,
      );

      await fetchData();
    } catch (error) {
      logError(
        "InternalTeamPanel.handleRecalculate",
        error,
      );

      toast.error("Nie udało się przeliczyć analiz");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="h-24 rounded-lg bg-muted/40 animate-pulse" />
    );
  }

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          To ogłoszenie nie jest jeszcze powiązane z
          organizacją. Zapisz ogłoszenie ponownie, aby
          korzystać z zaproszonych kandydatów.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-accent" />
          Zaproszeni kandydaci
        </CardTitle>

        <CardDescription>
          Zapraszaj kandydatów bezpośrednio do oferty
          „{offerTitle}”. Kandydat sam decyduje, czy zgadza
          się na sprawdzenie dopasowania do tej konkretnej
          oferty.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-4 h-4 text-accent" />

            <p className="font-medium">
              Zaproś kandydata
            </p>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Kandydat otrzyma e-mail z nazwą tej oferty i
            możliwością zaakceptowania lub odrzucenia
            zaproszenia.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`candidate-email-${offerId}`}>
                Adres e-mail
              </Label>

              <Input
                id={`candidate-email-${offerId}`}
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="kandydat@email.pl"
              />
            </div>

            <Button
              onClick={handleInvite}
              disabled={sending}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />

              {sending
                ? "Wysyłanie..."
                : "Wyślij zaproszenie"}
            </Button>
          </div>
        </div>

        {invitations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3">
              Oczekujące zaproszenia ({invitations.length})
            </p>

            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {invitation.email}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Oczekiwanie na odpowiedź · ważne do{" "}
                      {new Date(
                        invitation.expires_at,
                      ).toLocaleDateString("pl-PL")}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      handleRevokeInvitation(
                        invitation.id,
                      )
                    }
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Anuluj
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-3">
            Kandydaci w tej ofercie (
            {activeAssessments.length})
          </p>

          {activeAssessments.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">
                Nie masz jeszcze kandydatów, którzy
                zaakceptowali zaproszenie do tej oferty.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAssessments.map((assessment) => {
                const employee =
                  employeeByUserId.get(
                    assessment.employee_user_id,
                  );

                const label =
                  employee?.invited_email ||
                  "Zaproszony kandydat";

                return (
                  <div
                    key={assessment.id}
                    className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {label}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {consentLabel[
                          assessment.consent_status
                        ] ||
                          assessment.consent_status}

                        {assessment.consent_status ===
                          "granted" &&
                          !assessment.computed_at &&
                          " · wynik jeszcze nie został obliczony"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {assessment.consent_status ===
                        "granted" &&
                        assessment.overall_percent !==
                          null && (
                          <Badge className="bg-accent text-accent-foreground text-sm">
                            {
                              assessment.overall_percent
                            }
                            % dopasowania
                          </Badge>
                        )}

                      {assessment.consent_status ===
                        "granted" &&
                        assessment.computed_at && (
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              setDetailsFor({
                                assessment,
                                label,
                              })
                            }
                          >
                            <BarChart3 className="w-4 h-4" />
                            Zobacz analizę
                          </Button>
                        )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          handleRemoveAssessment(
                            assessment.id,
                          )
                        }
                      >
                        Usuń z oferty
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activeAssessments.length > 0 && (
          <div className="pt-2 border-t flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={handleRecalculate}
              disabled={busy}
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  busy ? "animate-spin" : ""
                }`}
              />
              Przelicz wyniki
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!detailsFor}
        onOpenChange={(open) =>
          !open && setDetailsFor(null)
        }
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Analiza zaproszonego kandydata
            </DialogTitle>

            <DialogDescription>
              Dopasowanie do oferty: {offerTitle}
            </DialogDescription>
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