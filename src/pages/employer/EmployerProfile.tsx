import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { logError } from "@/lib/errorLogger";
import { Building2 } from "lucide-react";

const EmployerProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [companyName, setCompanyName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchProfile();
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("employer_profiles")
        .select("company_name, linkedin_url")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== "PGRST116") {
        logError("EmployerProfile.fetchProfile", error);
      }
      if (data) {
        setCompanyName(data.company_name || "");
        setLinkedinUrl(data.linkedin_url || "");
      }
    } catch (error) {
      logError("EmployerProfile.fetchProfile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("employer_profiles")
        .update({
          company_name: companyName,
          linkedin_url: linkedinUrl
        })
        .eq("user_id", user.id);
      
      if (error) throw error;
      toast.success(t("employer.role.saved"));
    } catch (error) {
      logError("EmployerProfile.handleSubmit", error);
      toast.error(t("errors.genericError"));
    } finally {
      setSaving(false);
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{t("employer.profile.title")}</h1>
          <p className="text-muted-foreground">{t("employer.profile.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>{t("employer.profile.companyInfo")}</CardTitle>
                <CardDescription>{t("employer.profile.companyInfoDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("common.companyName")}</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t("register.companyPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("employer.role.linkedinLabel")}</Label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder={t("employer.role.linkedinPlaceholder")}
              />
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full">
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmployerProfile;
