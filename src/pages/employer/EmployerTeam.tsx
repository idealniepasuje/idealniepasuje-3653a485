import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Briefcase,
  ChevronRight,
  Clock3,
  Mail,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { useOrganization } from "@/hooks/useOrganization";

interface OfferRow {
  id: string;
  title: string;
  is_active: boolean | null;
  analyze_internal_team: boolean | null;
  created_at: string;
}

interface InvitationRow {
  id: string;
  email: string;
  job_offer_id: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

interface AssessmentRow {
  id: string;
  job_offer_id: string;
  employee_user_id: string;
  consent_status: string;
  overall_percent: number | null;
  computed_at: string | null;
}

interface EmployeeRow {
  user_id: string;
  invited_email: string | null;
  status: string;
}

const EmployerTeam = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { organization, loading: orgLoading } = useOrganization();

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!organization) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [offersRes, invitationsRes, assessmentsRes, employeesRes] =
        await Promise.all([
          supabase
            .from("job_offers")
            .select(
              "id, title, is_active, analyze_internal_team, created_at",
            )
            .eq("organization_id", organization.id)
            .eq("analyze_internal_team", true)
            .order("created_at", { ascending: false }),

          supabase
            .from("organization_invitations")
            .select(
              "id, email, job_offer_id, status, expires_at, created_at",
            )
            .eq("organization_id", organization.id)
            .not("job_offer_id", "is", null)
            .order("created_at", { ascending: false }),

          supabase
            .from("internal_assessments")
            .select(
              "id, job_offer_id, employee_user_id, consent_status, overall_percent, computed_at",
            )
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("organization_employees")
            .select("user_id, invited_email, status")
            .eq("organization_id", organization.id),
        ]);

      if (offersRes.error) throw offersRes.error;
      if (invitationsRes.error) throw invitationsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setOffers((offersRes.data || []) as OfferRow[]);
      setInvitations((invitationsRes.data || []) as InvitationRow[]);
      setAssessments((assessmentsRes.data || []) as AssessmentRow[]);
      setEmployees((employeesRes.data || []) as EmployeeRow[]);
    } catch (error) {
      logError("EmployerTeam.fetchData", error);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (!orgLoading) {
      void fetchData();
    }
  }, [user, authLoading, orgLoading, navigate, fetchData]);

  const employeeEmailByUserId = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.user_id,
        employee.invited_email,
      ]),
    );
  }, [employees]);

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  const activeAssessments = assessments.filter(
    (assessment) =>
      assessment.consent_status === "granted" ||
      assessment.consent_status === "pending",
  );

  const totalPending = pendingInvitations.length;
  const totalAccepted = activeAssessments.filter(
    (assessment) => assessment.consent_status === "granted",
  ).length;

  if (authLoading || orgLoading || loading) {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Zaproszeni kandydaci
        </h1>

        <p className="text-muted-foreground max-w-3xl">
          Kandydaci zapraszani bezpośrednio do konkretnych ofert.
          Zaproszenie i zgoda zawsze dotyczą jednej wskazanej oferty.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-accent" />
              </div>

              <div>
                <p className="text-2xl font-bold">
                  {totalPending}
                </p>

                <p className="text-sm text-muted-foreground">
                  oczekujących zaproszeń
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-accent" />
              </div>

              <div>
                <p className="text-2xl font-bold">
                  {totalAccepted}
                </p>

                <p className="text-sm text-muted-foreground">
                  zaakceptowanych kandydatów
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />

            <h2 className="font-semibold text-lg mb-2">
              Brak ofert z zaproszonymi kandydatami
            </h2>

            <p className="text-sm text-muted-foreground mb-5">
              Utwórz lub edytuj ofertę i włącz możliwość
              zapraszania kandydatów.
            </p>

            <Link to="/employer/offers">
              <Button>
                Przejdź do ogłoszeń
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const offerInvitations = pendingInvitations.filter(
              (invitation) =>
                invitation.job_offer_id === offer.id,
            );

            const offerAssessments = activeAssessments.filter(
              (assessment) =>
                assessment.job_offer_id === offer.id,
            );

            const acceptedAssessments =
              offerAssessments.filter(
                (assessment) =>
                  assessment.consent_status === "granted",
              );

            return (
              <Card key={offer.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                        <Briefcase className="w-5 h-5 text-accent" />

                        {offer.title}

                        <Badge
                          variant={
                            offer.is_active
                              ? "default"
                              : "secondary"
                          }
                        >
                          {offer.is_active
                            ? "Aktywna"
                            : "Nieaktywna"}
                        </Badge>
                      </CardTitle>

                      <CardDescription className="mt-2">
                        {offerInvitations.length} oczekujących ·{" "}
                        {acceptedAssessments.length} zaakceptowanych
                      </CardDescription>
                    </div>

                    <Link
                      to={`/employer/order/${offer.id}#team`}
                    >
                      <Button
                        size="sm"
                        className="gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Zaproś kandydata
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />

                      <p className="text-sm font-medium">
                        Oczekujące zaproszenia (
                        {offerInvitations.length})
                      </p>
                    </div>

                    {offerInvitations.length === 0 ? (
                      <p className="text-sm text-muted-foreground border rounded-lg p-4">
                        Brak oczekujących zaproszeń do tej oferty.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {offerInvitations.map(
                          (invitation) => (
                            <div
                              key={invitation.id}
                              className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
                            >
                              <div>
                                <p className="font-medium">
                                  {invitation.email}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  Oczekiwanie na odpowiedź · ważne do{" "}
                                  {new Date(
                                    invitation.expires_at,
                                  ).toLocaleDateString(
                                    "pl-PL",
                                  )}
                                </p>
                              </div>

                              <Badge variant="secondary">
                                Oczekuje
                              </Badge>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-muted-foreground" />

                      <p className="text-sm font-medium">
                        Kandydaci w ofercie (
                        {acceptedAssessments.length})
                      </p>
                    </div>

                    {acceptedAssessments.length === 0 ? (
                      <p className="text-sm text-muted-foreground border rounded-lg p-4">
                        Nikt jeszcze nie zaakceptował zaproszenia
                        do tej oferty.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {acceptedAssessments.map(
                          (assessment) => {
                            const email =
                              employeeEmailByUserId.get(
                                assessment.employee_user_id,
                              ) ||
                              "Zaproszony kandydat";

                            return (
                              <div
                                key={assessment.id}
                                className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
                              >
                                <div>
                                  <p className="font-medium">
                                    {email}
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    Zaproszenie zaakceptowane
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {assessment.computed_at &&
                                  assessment.overall_percent !==
                                    null ? (
                                    <Badge className="bg-accent text-accent-foreground">
                                      {
                                        assessment.overall_percent
                                      }
                                      % dopasowania
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      Wynik w przygotowaniu
                                    </Badge>
                                  )}

                                  <Link
                                    to={`/employer/order/${offer.id}#team`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                    >
                                      Zobacz
                                      <ChevronRight className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployerTeam;