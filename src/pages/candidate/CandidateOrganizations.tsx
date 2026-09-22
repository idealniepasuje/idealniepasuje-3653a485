import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ShieldCheck,
  BarChart3,
  Briefcase,
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { CandidateSidebar } from "@/components/layouts/CandidateSidebar";
import { toast } from "sonner";

interface MembershipRow {
  id: string;
  organization_id: string;
  status: string;
  joined_at: string | null;
  organizations: {
    name: string;
  } | null;
}

interface AssessmentRow extends InternalAssessmentRecord {
  organization_id: string;
  job_offer_id: string;
  organizations: {
    name: string;
  } | null;
  job_offers: {
    title: string;
  } | null;
}

interface InvitationRow {
  id: string;
  token: string;
  organization_id: string;
  job_offer_id: string;
  expires_at: string;
  organizations: {
    name: string;
  } | null;
  job_offers: {
    title: string;
  } | null;
}

const CandidateOrganizations = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const inviteToken = searchParams.get("invite");

  const [memberships, setMemberships] = useState<
    MembershipRow[]
  >([]);

  const [assessments, setAssessments] = useState<
    AssessmentRow[]
  >([]);

  const [pendingInvitations, setPendingInvitations] =
    useState<InvitationRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [detailsFor, setDetailsFor] =
    useState<AssessmentRow | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();

      const [membershipResult, assessmentResult, invitationResult] =
        await Promise.all([
          supabase
            .from("organization_employees")
            .select(
              "id, organization_id, status, joined_at, organizations(name)",
            )
            .eq("user_id", user.id),

          supabase
            .from("internal_assessments")
            .select(
              "id, organization_id, job_offer_id, consent_status, overall_percent, competence_percent, culture_percent, extra_percent, computed_at, match_details, organizations(name), job_offers(title)",
            )
            .eq("employee_user_id", user.id),

          supabase
            .from("organization_invitations")
            .select(
              "id, token, organization_id, job_offer_id, expires_at, organizations(name), job_offers(title)",
            )
            .eq("status", "pending")
            .not("job_offer_id", "is", null)
            .gt("expires_at", now),
        ]);

      if (membershipResult.error) {
        throw membershipResult.error;
      }

      if (assessmentResult.error) {
        throw assessmentResult.error;
      }

      if (invitationResult.error) {
        throw invitationResult.error;
      }

      let invitations =
        (invitationResult.data || []) as InvitationRow[];

      /*
       * Jeżeli kandydat wszedł bezpośrednio z linku
       * otrzymanego w e-mailu, upewniamy się, że konkretne
       * zaproszenie znajduje się na liście.
       */
      if (
        inviteToken &&
        !invitations.some(
          (invitation) =>
            invitation.token === inviteToken,
        )
      ) {
        const {
          data: tokenInvitation,
          error: tokenInvitationError,
        } = await supabase
          .from("organization_invitations")
          .select(
            "id, token, organization_id, job_offer_id, expires_at, organizations(name), job_offers(title)",
          )
          .eq("token", inviteToken)
          .eq("status", "pending")
          .not("job_offer_id", "is", null)
          .gt("expires_at", now)
          .maybeSingle();

        if (tokenInvitationError) {
          throw tokenInvitationError;
        }

        if (tokenInvitation) {
          invitations = [
            ...invitations,
            tokenInvitation as InvitationRow,
          ];
        }
      }

      setMemberships(
        (membershipResult.data || []) as MembershipRow[],
      );

      setAssessments(
        (assessmentResult.data || []) as AssessmentRow[],
      );

      setPendingInvitations(invitations);
    } catch (error) {
      logError(
        "CandidateOrganizations.fetchData",
        error,
      );
    } finally {
      setLoading(false);
    }
  }, [user, inviteToken]);

  const acceptInvite = useCallback(
    async (
      token: string,
      action: "accept" | "decline",
    ) => {
      setBusy(true);

      try {
        const { data, error } =
          await supabase.functions.invoke(
            "accept-employee-invitation",
            {
              body: {
                invitation_token: token,
                action,
              },
            },
          );

        if (error) throw error;

        if ((data as any)?.status === "declined") {
          toast.success("Zaproszenie odrzucone");
        } else {
          toast.success(
            "Zaproszenie zaakceptowane. Twoje dopasowanie do tej oferty może zostać sprawdzone.",
          );
        }

        searchParams.delete("invite");

        setSearchParams(searchParams, {
          replace: true,
        });

        await fetchData();
      } catch (error: any) {
        logError(
          "CandidateOrganizations.acceptInvite",
          error,
        );

        toast.error(
          error?.message ||
            "Nie udało się obsłużyć zaproszenia",
        );
      } finally {
        setBusy(false);
      }
    },
    [
      fetchData,
      searchParams,
      setSearchParams,
    ],
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      void fetchData();
    }
  }, [
    user,
    authLoading,
    navigate,
    fetchData,
  ]);

  const leaveOrganization = async (
    membership: MembershipRow,
  ) => {
    setBusy(true);

    try {
      /*
       * Najpierw cofamy zgody na aktywne analizy
       * należące do tej organizacji.
       */
      const now = new Date().toISOString();

      const { error: assessmentError } =
        await supabase
          .from("internal_assessments")
          .update({
            consent_status: "revoked",
            revoked_at: now,
          })
          .eq("organization_id", membership.organization_id)
          .eq("employee_user_id", user!.id)
          .eq("consent_status", "granted");

      if (assessmentError) {
        throw assessmentError;
      }

      /*
       * Następnie kończymy relację kandydat-organizacja.
       */
      const { error: membershipError } =
        await supabase
          .from("organization_employees")
          .update({
            status: "removed",
            removed_at: now,
          })
          .eq("id", membership.id);

      if (membershipError) {
        throw membershipError;
      }

      toast.success(
        "Połączenie z organizacją zostało zakończone",
      );

      await fetchData();
    } catch (error) {
      logError(
        "CandidateOrganizations.leaveOrganization",
        error,
      );

      toast.error(
        "Nie udało się zakończyć połączenia z organizacją",
      );
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout
        sidebar={<CandidateSidebar />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  const activeMemberships = memberships.filter(
    (membership) =>
      membership.status !== "removed",
  );

  const activeOrganizationIds = new Set(
    activeMemberships.map(
      (membership) =>
        membership.organization_id,
    ),
  );

  /*
   * Pokazujemy wyłącznie analizy, na które kandydat
   * rzeczywiście wyraził zgodę.
   */
  const visibleAssessments = assessments.filter(
    (assessment) =>
      activeOrganizationIds.has(
        assessment.organization_id,
      ) &&
      assessment.consent_status === "granted",
  );

  return (
    <DashboardLayout
      sidebar={<CandidateSidebar />}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Zaproszenia
        </h1>

        <p className="text-muted-foreground">
          Tutaj znajdziesz zaproszenia od firm oraz
          wyniki dopasowania do ofert, na które
          wyraziłeś zgodę.
        </p>
      </div>

      {pendingInvitations.map(
        (invitation) => {
          const companyName =
            invitation.organizations?.name ||
            "Firma";

          const offerTitle =
            invitation.job_offers?.title ||
            "oferta pracy";

          return (
            <Card
              key={invitation.id}
              className="mb-6 border-accent/40 bg-accent/5"
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>

                  <div>
                    <CardTitle className="text-lg">
                      {companyName} zaprasza Cię do
                      sprawdzenia dopasowania
                    </CardTitle>

                    <CardDescription className="mt-2">
                      Oferta:{" "}
                      <strong className="text-foreground">
                        {offerTitle}
                      </strong>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground mb-5">
                  Akceptując zaproszenie, zgadzasz
                  się na udostępnienie firmie danych
                  potrzebnych do sprawdzenia Twojego
                  dopasowania wyłącznie do tej
                  konkretnej oferty. Nie zmieni to
                  ustawień Twojego konta ani wyników
                  testów.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      acceptInvite(
                        invitation.token,
                        "accept",
                      )
                    }
                  >
                    Akceptuję zaproszenie
                  </Button>

                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      acceptInvite(
                        invitation.token,
                        "decline",
                      )
                    }
                  >
                    Odrzuć
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        },
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-accent" />

            Moje dopasowania (
            {visibleAssessments.length})
          </CardTitle>

          <CardDescription>
            Wyniki dotyczą wyłącznie ofert, na
            których analizę wyraziłeś zgodę.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {visibleAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nie masz jeszcze zaakceptowanych
              analiz dopasowania.
            </p>
          ) : (
            visibleAssessments.map(
              (assessment) => (
                <div
                  key={assessment.id}
                  className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">
                      {assessment.organizations
                        ?.name || "Firma"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Oferta:{" "}
                      {assessment.job_offers
                        ?.title || "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {assessment.computed_at ? (
                      <>
                        <Badge className="bg-accent text-accent-foreground">
                          {assessment.overall_percent ===
                          null
                            ? "—"
                            : `${assessment.overall_percent}%`}
                        </Badge>

                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            setDetailsFor(
                              assessment,
                            )
                          }
                        >
                          <BarChart3 className="w-4 h-4" />
                          Zobacz analizę
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary">
                        Wynik jest przygotowywany
                      </Badge>
                    )}
                  </div>
                </div>
              ),
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-accent" />

            Połączone organizacje (
            {activeMemberships.length})
          </CardTitle>

          <CardDescription>
            Połączenie z organizacją nie daje jej
            automatycznie dostępu do analizy Twojego
            dopasowania do wszystkich ofert. Każde
            zaproszenie do oferty wymaga osobnej
            akceptacji.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          {activeMemberships.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nie masz obecnie aktywnych połączeń z
              organizacjami.
            </p>
          ) : (
            activeMemberships.map(
              (membership) => (
                <div
                  key={membership.id}
                  className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">
                      {membership.organizations
                        ?.name ||
                        "Organizacja"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {membership.joined_at
                        ? `Połączono ${new Date(
                            membership.joined_at,
                          ).toLocaleDateString(
                            "pl-PL",
                          )}`
                        : "Aktywne połączenie"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Połączono
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        leaveOrganization(
                          membership,
                        )
                      }
                    >
                      Zakończ połączenie
                    </Button>
                  </div>
                </div>
              ),
            )
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!detailsFor}
        onOpenChange={(open) =>
          !open && setDetailsFor(null)
        }
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Twoje dopasowanie do oferty
            </DialogTitle>

            <DialogDescription>
              {detailsFor?.organizations?.name ||
                "Firma"}{" "}
              —{" "}
              {detailsFor?.job_offers?.title ||
                "oferta"}
            </DialogDescription>
          </DialogHeader>

          {detailsFor && (
            <InternalAssessmentDetails
              assessment={detailsFor}
              subjectLabel={
                detailsFor.organizations?.name ||
                "Firma"
              }
              roleTitle={
                detailsFor.job_offers?.title ||
                "oferta"
              }
              perspective="employee"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CandidateOrganizations;