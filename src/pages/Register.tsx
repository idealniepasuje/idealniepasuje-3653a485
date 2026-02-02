import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get("type") || "candidate";
  
  const [userType, setUserType] = useState<"candidate" | "employer">(
    defaultType === "employer" ? "employer" : "candidate"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            user_type: userType,
            full_name: fullName,
            company_name: userType === "employer" ? companyName : undefined,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success(t("register.successMessage"));
        navigate("/login");
      }
    } catch (error: any) {
      toast.error(t("register.errorMessage"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            {t("common.backToHome")}
          </Link>
          <LanguageSwitcher />
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xl font-bold">idealnie<span className="text-accent">pasuje</span></span>
            </div>
            <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
            <CardDescription>{t("register.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={userType} onValueChange={(v) => setUserType(v as "candidate" | "employer")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="candidate" className="gap-2">
                  <Users className="w-4 h-4" />
                  {t("register.candidateTab")}
                </TabsTrigger>
                <TabsTrigger value="employer" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  {t("register.employerTab")}
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleRegister} className="space-y-4">
                <TabsContent value="candidate" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("common.fullName")}</Label>
                    <Input
                      id="fullName"
                      placeholder={t("register.namePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </TabsContent>

                <TabsContent value="employer" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t("common.companyName")}</Label>
                    <Input
                      id="companyName"
                      placeholder={t("register.companyPlaceholder")}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required={userType === "employer"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullNameEmployer">{t("common.fullName")}</Label>
                    <Input
                      id="fullNameEmployer"
                      placeholder={t("register.namePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </TabsContent>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("register.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("common.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t("register.passwordHint")}</p>
                </div>

                <Button type="submit" className="w-full bg-cta text-cta-foreground hover:bg-cta/90" disabled={loading}>
                  {loading ? t("common.creatingAccount") : t("register.title")}
                </Button>
              </form>
            </Tabs>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("register.hasAccount")}{" "}
              <Link to="/login" className="text-accent hover:underline font-medium">
                {t("common.login")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
