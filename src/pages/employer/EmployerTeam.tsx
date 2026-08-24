import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Mail, X, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface EmployeeRow {
  id: string;
  user_id: string;
  invited_email: string | null;
  status: string;
  joined_at: string | null;
}

interface InvitationRow {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
}

const EmployerTeam = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { organization, loading: orgLoading } = useOrganization();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!organization) return;
    try {
      const [empRes, invRes] = await Promise.all([
        supabase
          .from("organization_employees")
          .select("id, user_id, invited_email, status, joined_at")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("organization_invitations")
          .select("id, email, status, expires_at, created_at")
          .eq("organization_id", organization.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);
      if (empRes.error) throw empRes.error;
      if (invRes.error) throw invRes.error;
      setEmployees(empRes.data || []);
      setInvitations(invRes.data || []);
    } catch (e) {
      logError("EmployerTeam.fetchData", e);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (!orgLoading) fetchData();
  }, [user, authLoading, orgLoading, navigate, fetchData]);

  const handleInvite = async () => {
    if (!organization) return;
    const value = email.trim().toLowerCase();
    if (!value) { toast.error("Podaj adres e-mail pracownika"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-employee", {
        body: { organization_id: organization.id, email: value },
      });
      if (error) throw error;
      if ((data as any)?.email_sent === false) {
        toast.warning("Zaproszenie zapisane, ale nie udało się wysłać e-maila.");
      } else {
        toast.success("Zaproszenie wysłane");
      }
      setEmail("");
      await fetchData();
    } catch (e: any) {
      logError("EmployerTeam.handleInvite", e);
      toast.error(e?.message || "Nie udało się wysłać zaproszenia");
    } finally {
      setSending(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from("organization_invitations")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw error;
      toast.success("Zaproszenie anulowane");
      await fetchData();
    } catch (e) {
      logError("EmployerTeam.handleRevokeInvite", e);
      toast.error("Nie udało się anulować zaproszenia");
    }
  };

  const handleRemoveEmployee = async (row: EmployeeRow) => {
    if (!organization) return;
    try {
      const { error } = await supabase
        .from("organization_employees")
        .update({ status: "removed", removed_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;

      // Odłączenie odbiera firmie dostęp — usuwamy analizy tego pracownika
      const { error: delErr } = await supabase
        .from("internal_assessments")
        .delete()
        .eq("organization_id", organization.id)
        .eq("employee_user_id", row.user_id);
      if (delErr) logError("EmployerTeam.removeAssessments", delErr);

      toast.success("Pracownik odłączony od organizacji");
      await fetchData();
    } catch (e) {
      logError("EmployerTeam.handleRemoveEmployee", e);
      toast.error("Nie udało się odłączyć pracownika");
    }
  };

  const activeEmployees = employees.filter((e) => e.status === "active");
  const removedEmployees = employees.filter((e) => e.status === "removed");

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
        <h1 className="text-3xl font-bold mb-2">Mój zespół</h1>
        <p className="text-muted-foreground">
          Pracownicy {organization?.name ? `organizacji ${organization.name}` : "Twojej organizacji"}. Analiza ich dopasowania
          do roli wymaga ich zgody i zawsze dotyczy konkretnego ogłoszenia.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-accent" /> Zaproś pracownika
          </CardTitle>
          <CardDescription>
            Zapraszamy wyłącznie po adresie e-mail. Pracownik świadomie akceptuje dołączenie do organizacji.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="employee-email">Adres e-mail</Label>
              <Input
                id="employee-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pracownik@firma.pl"
              />
            </div>
            <Button onClick={handleInvite} disabled={sending} className="gap-2">
              <Mail className="w-4 h-4" />
              {sending ? "Wysyłanie..." : "Wyślij zaproszenie"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Oczekujące zaproszenia ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                <div>
                  <p className="font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Ważne do {new Date(inv.expires_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleRevokeInvite(inv.id)}>
                  <X className="w-4 h-4" /> Anuluj
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-accent" /> Pracownicy ({activeEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeEmployees.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              Nikt jeszcze nie dołączył do organizacji.
            </p>
          ) : (
            activeEmployees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{emp.invited_email || "Pracownik"}</p>
                    <p className="text-xs text-muted-foreground">
                      W organizacji od {emp.joined_at ? new Date(emp.joined_at).toLocaleDateString("pl-PL") : "—"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRemoveEmployee(emp)}>
                  Odłącz
                </Button>
              </div>
            ))
          )}

          {removedEmployees.length > 0 && (
            <div className="pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Odłączeni ({removedEmployees.length})</p>
              {removedEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between gap-3 border rounded-lg p-3 opacity-60">
                  <p className="text-sm">{emp.invited_email || "Pracownik"}</p>
                  <Badge variant="secondary">Odłączony</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default EmployerTeam;
