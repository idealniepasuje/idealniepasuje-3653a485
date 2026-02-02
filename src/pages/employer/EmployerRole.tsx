import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EmployerRole = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ roleDescription: "", roleResponsibilities: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("employer_profiles").select("role_description, role_responsibilities").eq("user_id", user.id).single();
    if (data) setFormData({ roleDescription: data.role_description || "", roleResponsibilities: data.role_responsibilities || "" });
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.roleDescription) { toast.error(t("employer.role.fillRoleDescription")); return; }
    setSaving(true);
    try {
      await supabase.from("employer_profiles").update({ role_description: formData.roleDescription, role_responsibilities: formData.roleResponsibilities, role_completed: true }).eq("user_id", user!.id);
      toast.success(t("employer.role.saved")); navigate("/employer/dashboard");
    } catch { toast.error(t("errors.genericError")); } finally { setSaving(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground"><div className="container mx-auto px-4 py-4"><Link to="/employer/dashboard" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"><ArrowLeft className="w-4 h-4" />{t("common.back")}</Link></div></header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">{t("employer.role.title")}</h1>
        <Card><CardContent className="pt-6 space-y-4">
          <div><Label>{t("employer.role.roleDescriptionLabel")}</Label><Textarea value={formData.roleDescription} onChange={(e) => setFormData(p => ({...p, roleDescription: e.target.value}))} rows={3} /></div>
          <div><Label>{t("employer.role.responsibilitiesLabel")}</Label><Textarea value={formData.roleResponsibilities} onChange={(e) => setFormData(p => ({...p, roleResponsibilities: e.target.value}))} rows={4} /></div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full bg-cta text-cta-foreground">{saving ? t("common.saving") : t("common.saveAndContinue")}</Button>
          <Button onClick={handleSubmit} disabled={saving} className="w-full bg-cta text-cta-foreground">{saving ? t("common.saving") : t("common.saveAndContinue")}</Button>
        </CardContent></Card>
      </main>
    </div>
  );
};

export default EmployerRole;
