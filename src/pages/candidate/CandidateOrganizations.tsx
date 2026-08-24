import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2, ShieldCheck, Globe, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InternalAssessmentDetails, type InternalAssessmentRecord } from "@/components/internal/InternalAssessmentDetails";
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
  organizations: { name: string } | null;
}

interface AssessmentRow extends InternalAssessmentRecord {
  organization_id: string;
  job_offer_id: string;
  organizations: { name: string } | null;
  job_offers: { title: string } | null;
}

const CandidateOrganizations = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [openToExternal, setOpenToExternal] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [detailsFor, setDetailsFor] = useState<AssessmentRow | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [memRes, assessRes, prefRes] = await Promise.all([
        supabase
          .from("organization_employees")
          .select("id, organization_id, status, joined_at, organizations(name)")
          .eq("user_id", user.id),
        supabase
          .from("internal_assessments")
          .select("id, organization_id, job_offer_id, consent_status, overall_percent, competence_percent, culture_percent, extra_percent, computed_at, match_details, organizations(name), job_offers(title)")
          .eq("employee_user_id", user.id),
        supabase
          .from("candidate_test_results")
          .select("open_to_external_offers")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (memRes.error) throw memRes.error;
      if (assessRes.error) throw assessRes.error;
      setMemberships((memRes.data || []) as any);
      setAssessments((assessRes.data || []) as any);
      setOpenToExternal(prefRes.data?.open_to_external_offers !== false);
    } catch (e) {
      logError("CandidateOrganizations.fetchData", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const acceptInvite = useCallback(async (token: string, action: "accept" | "decline") => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("accept-employee-invitation", {
        body: { invitation_token: token, action },
      });
      if (error) throw error;
      toast.success((data as any)?.status === "declined" ? "Zaproszenie odrzucone" : "Dołączono do organizacji");
      searchParams.delete("invite");
      setSearchParams(searchParams, { replace: true });
      await fetchData();
    } catch (e: any) {
      logError("CandidateOrganizations.acceptInvite", e);
      toast.error(e?.message || "Nie udało się obsłużyć zaproszenia");
    } finally {
      setBusy(false);
    }
  }, [fetchData, searchParams, setSearchParams]);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchData();
  }, [user, authLoading, navigate, fetchData]);

  const leaveOrganization = async (row: MembershipRow) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("organization_employees")
        .update({ status: "removed", removed_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
      toast.success("Odłączono od organizacji");
      await fetchData();
    } catch (e) {
      logError("CandidateOrganizations.leaveOrganization", e);
      toast.error("Nie udało się odłączyć od organizacji");
    } finally {
      setBusy(false);
    }
  };

  const toggleExternal = async (value: boolean) => {
    if (!user) return;
    setOpenToExternal(value);
    const { error } = await supabase
      .from("candidate_test_results")
      .update({ open_to_external_offers: value })
      .eq("user_id", user.id);
    if (error) {
      logError("CandidateOrganizations.toggleExternal", error);
      setOpenToExternal(!value);
      toast.error("Nie udało się zapisać ustawienia");
      return;
    }
    toast.success(value ? "Będziesz otrzymywać propozycje z rynku" : "Nie będziesz otrzymywać propozycji z rynku");
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout sidebar={<CandidateSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  const activeMemberships = memberships.filter((m) => m.status !== "removed");
  const activeOrgIds = new Set(activeMemberships.map((m) => m.organization_id));
  const visibleAssessments = assessments.filter((a) => activeOrgIds.has(a.organization_id));

  return (
    <DashboardLayout sidebar={<CandidateSidebar />}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Moje firmy</h1>
        <p className="text-muted-foreground">
          Zarządzaj przynależnością do organizacji, analizami dopasowania do ról oraz udziałem w rynku pracy.
        </p>
      </div>

      {inviteToken && (
        <Card className="mb-6 border-accent/40 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-lg">Masz zaproszenie do organizacji</CardTitle>
            <CardDescription>
              Dołączenie do organizacji oznacza, że udostępniasz tej firmie wyniki swoich testów kompetencji,
              dopasowania kulturowego oraz dane profilowe potrzebne do analizy dopasowania względem ról i ofert tej
              organizacji. Firma nie musi prosić o zgodę dla każdej roli osobno. Dostęp trwa tak długo, jak należysz
              do organizacji — po odłączeniu się firma natychmiast traci dostęp, a wyniki analiz są usuwane.
              Dołączenie nie zmienia Twojego udziału w rynku pracy ani widoczności dla innych pracodawców.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button disabled={busy} onClick={() => acceptInvite(inviteToken, "accept")}>Dołącz</Button>
            <Button variant="outline" disabled={busy} onClick={() => acceptInvite(inviteToken, "decline")}>
              Odrzuć
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-accent" /> Propozycje z rynku pracy
          </CardTitle>
          <CardDescription>
            Ustawienie niezależne od przynależności do firmy. Możesz być analizowany wewnętrznie i jednocześnie nie
            uczestniczyć w rynku — lub odwrotnie.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <Label htmlFor="external-toggle" className="text-sm">
            Chcę otrzymywać propozycje pracy od nowych pracodawców
          </Label>
          <Switch id="external-toggle" checked={openToExternal} onCheckedChange={toggleExternal} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-accent" /> Analizy dopasowania do ról ({visibleAssessments.length})
          </CardTitle>
          <CardDescription>
            Firmy, do których należysz, analizują Twoje wyniki względem swoich ról na podstawie aktywnego członkostwa
            w organizacji. Nie zatwierdzasz każdej analizy osobno. Odłączenie się od organizacji natychmiast cofa
            firmie dostęp i usuwa wyniki analiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Brak analiz dla Twoich organizacji.</p>
          ) : (
            visibleAssessments.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3">
                <div>
                  <p className="font-medium">{a.organizations?.name || "Firma"}</p>
                  <p className="text-sm text-muted-foreground">Rola: {a.job_offers?.title || "—"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {a.computed_at && a.consent_status === "granted" ? (
                    <>
                      <Badge className="bg-accent text-accent-foreground">
                        {a.overall_percent === null ? "—" : `${a.overall_percent}%`}
                      </Badge>
                      <Button size="sm" className="gap-2" onClick={() => setDetailsFor(a)}>
                        <BarChart3 className="w-4 h-4" /> Zobacz analizę
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary">Analiza jeszcze nieprzeliczona</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-accent" /> Organizacje ({activeMemberships.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeMemberships.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nie należysz do żadnej organizacji.</p>
          ) : (
            activeMemberships.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                <div>
                  <p className="font-medium">{m.organizations?.name || "Organizacja"}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.joined_at ? `Od ${new Date(m.joined_at).toLocaleDateString("pl-PL")}` : "Zaproszenie"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Firma analizuje Twoje wyniki</Badge>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => leaveOrganization(m)}>
                    Odłącz się
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailsFor} onOpenChange={(open) => !open && setDetailsFor(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Twoje dopasowanie do roli</DialogTitle>
            <DialogDescription>
              {detailsFor?.organizations?.name || "Firma"} — {detailsFor?.job_offers?.title || "rola"}
            </DialogDescription>
          </DialogHeader>
          {detailsFor && (
            <InternalAssessmentDetails
              assessment={detailsFor}
              subjectLabel={detailsFor.organizations?.name || "Firma"}
              roleTitle={detailsFor.job_offers?.title || "rola"}
              perspective="employee"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CandidateOrganizations;
