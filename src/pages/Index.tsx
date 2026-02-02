import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Building2, Target, Heart, CheckCircle2, ClipboardList, Search, Handshake } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user && userType) {
      if (userType === "employer") {
        navigate("/employer/dashboard");
      } else {
        navigate("/candidate/dashboard");
      }
    }
  }, [user, userType, loading, navigate]);

  const steps = [
    {
      step: 1,
      icon: ClipboardList,
      titleKey: "howItWorks.step1Title",
      descriptionKey: "howItWorks.step1Description",
    },
    {
      step: 2,
      icon: Search,
      titleKey: "howItWorks.step2Title",
      descriptionKey: "howItWorks.step2Description",
    },
    {
      step: 3,
      icon: Handshake,
      titleKey: "howItWorks.step3Title",
      descriptionKey: "howItWorks.step3Description",
    },
  ];

  const candidateBenefits = [
    "benefits.candidate1",
    "benefits.candidate2",
    "benefits.candidate3",
  ];

  const employerBenefits = [
    "benefits.employer1",
    "benefits.employer2",
    "benefits.employer3",
  ];

  const values = [
    {
      icon: Heart,
      titleKey: "values.value1Title",
      descriptionKey: "values.value1Description",
    },
    {
      icon: Target,
      titleKey: "values.value2Title",
      descriptionKey: "values.value2Description",
    },
    {
      icon: Target,
      titleKey: "values.value3Title",
      descriptionKey: "values.value3Description",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo_idealnie_pasuje.png" alt="IdealniePasuje" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/login">
              <Button variant="ghost" size="sm">{t("common.login")}</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-cta text-cta-foreground hover:bg-cta/90">
                {t("common.register")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              {t("hero.title")}
              <span className="block text-gradient mt-2">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register?type=candidate">
                <Button size="lg" className="bg-cta text-cta-foreground hover:bg-cta/90 gap-2 w-full sm:w-auto">
                  <Users className="w-5 h-5" />
                  {t("hero.candidateButton")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/register?type=employer">
                <Button size="lg" variant="outline" className="bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 gap-2 w-full sm:w-auto">
                  <Building2 className="w-5 h-5" />
                  {t("hero.employerButton")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("howItWorks.title")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {t("howItWorks.subtitle")}
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((item) => (
              <Card key={item.step} className="floating-card text-center group">
                <CardContent className="pt-8 pb-6">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto group-hover:bg-accent/20 transition-colors">
                      <item.icon className="w-8 h-8 text-accent" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-cta text-cta-foreground font-bold flex items-center justify-center text-sm">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t(item.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(item.descriptionKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Candidate benefits */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold">{t("benefits.forCandidate")}</h3>
              </div>
              <ul className="space-y-4">
                {candidateBenefits.map((benefitKey, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground">{t(benefitKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Employer benefits */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-cta flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-cta-foreground" />
                </div>
                <h3 className="text-2xl font-bold">{t("benefits.forEmployer")}</h3>
              </div>
              <ul className="space-y-4">
                {employerBenefits.map((benefitKey, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground">{t(benefitKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("values.title")}</h2>
            <p className="text-muted-foreground">
              {t("values.subtitle")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {values.map((value, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-bold mb-2 text-base">{t(value.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(value.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prototype notice */}
      <section className="py-12 bg-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-foreground/80">
              {t("prototype.notice")}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              {t("cta.title")}
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              {t("cta.description")}
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-cta text-cta-foreground hover:bg-cta/90 gap-2">
                {t("common.startNow")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-primary">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="text-primary-foreground font-semibold">idealniepasuje</span>
            </div>
            <p className="text-primary-foreground/60 text-sm">
              © 2026 idealniepasuje. {t("common.allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
