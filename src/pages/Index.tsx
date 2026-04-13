import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Building2, Target, Heart, CheckCircle2, ClipboardList, Search, Handshake, Instagram, Gift, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
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

  const values = [
    {
      icon: Heart,
      titleKey: "values.value1Title",
      descriptionKey: "values.value1Description",
    },
    {
      icon: ShieldCheck,
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
            <span className="text-xl font-bold text-foreground">idealnie<span className="text-accent">pasuje</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/login">
              <Button variant="ghost" size="sm">{t("common.login")}</Button>
            </Link>
            <Link to="/register?type=candidate">
              <Button size="sm" className="text-base font-bold px-6 py-2">
                {t("common.register")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section – focused on candidates */}
        <section className="relative pt-32 pb-20 overflow-hidden hero-section">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cta/15 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
                {t("hero.title")}
                <span className="block text-gradient-gold mt-2">{t("hero.titleHighlight")}</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
                {t("hero.description")}
              </p>
              <Link to="/register?type=candidate">
                <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg">
                  <Users className="w-6 h-6" />
                  {t("hero.candidateButton")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
            </svg>
          </div>
        </section>

        {/* What is it – concise value prop */}
        <section className="py-14 bg-primary">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold text-primary-foreground leading-relaxed">
                {t("whatIsIt.line1")}
              </h2>
              <p className="text-lg md:text-xl text-primary-foreground/80 mt-3">
                {t("whatIsIt.line2")}
              </p>
            </div>
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

        {/* Candidate Benefits */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-8 justify-center">
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{t("benefits.forCandidate")}</h2>
              </div>
              <ul className="space-y-5 max-w-xl mx-auto">
                {candidateBenefits.map((benefitKey, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground text-lg">{t(benefitKey)}</span>
                  </li>
                ))}
              </ul>
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

        {/* Trust / Social Proof */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">{t("trust.title")}</h2>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-accent">100+</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("trust.registered")}</p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-accent">5</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("trust.tests")}</p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-accent">93%</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("trust.satisfaction")}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-8 italic">
                „{t("trust.quote")}"
              </p>
            </div>
          </div>
        </section>

        {/* Early Adopter Value */}
        <section className="py-20 bg-cta/10 border-y border-cta/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-cta/20 flex items-center justify-center mx-auto mb-6">
                <Gift className="w-8 h-8 text-cta-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("earlyAdopter.title")}</h2>
              <p className="text-lg text-muted-foreground mb-4">{t("earlyAdopter.description")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Sparkles className="w-5 h-5 text-cta-foreground" />
                  {t("earlyAdopter.perk1")}
                </div>
                <span className="hidden sm:block text-muted-foreground">•</span>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <TrendingUp className="w-5 h-5 text-cta-foreground" />
                  {t("earlyAdopter.perk2")}
                </div>
              </div>
              <Link to="/register?type=candidate">
                <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg">
                  {t("earlyAdopter.cta")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Employer section */}
        <section className="py-20 hero-section">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                {t("employerSection.title")}
              </h2>
              <p className="text-primary-foreground/80 mb-8 text-lg">
                {t("employerSection.description")}
              </p>
              <Link to="/register?type=employer">
                <Button size="lg" variant="secondary" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl transition-all">
                  <Building2 className="w-5 h-5" />
                  {t("employerSection.cta")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA for candidates */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t("cta.title")}
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                {t("cta.description")}
              </p>
              <Link to="/register?type=candidate">
                <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg">
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
            <div className="flex items-center gap-4">
              <span className="text-primary-foreground font-semibold">idealniepasuje</span>
              <a
                href="https://www.instagram.com/idealniepasuje.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
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
