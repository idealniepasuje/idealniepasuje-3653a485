import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, CheckCircle2, Target, Heart, ShieldCheck, Sparkles, TrendingUp, Gift, Building2, FileSearch, Brain, BarChart3, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const CandidateLanding = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user && userType) {
      navigate(userType === "employer" ? "/employer/dashboard" : "/candidate/dashboard");
    }
  }, [user, userType, loading, navigate]);

  const problems = [
    {
      icon: FileSearch,
      problemKey: "candidateLanding.problems.cv.problem",
      solutionKey: "candidateLanding.problems.cv.solution",
    },
    {
      icon: Brain,
      problemKey: "candidateLanding.problems.soft.problem",
      solutionKey: "candidateLanding.problems.soft.solution",
    },
    {
      icon: RefreshCw,
      problemKey: "candidateLanding.problems.career.problem",
      solutionKey: "candidateLanding.problems.career.solution",
    },
    {
      icon: BarChart3,
      problemKey: "candidateLanding.problems.bias.problem",
      solutionKey: "candidateLanding.problems.bias.solution",
    },
  ];

  const benefits = [
    "candidateLanding.benefits.b1",
    "candidateLanding.benefits.b2",
    "candidateLanding.benefits.b3",
    "candidateLanding.benefits.b4",
    "candidateLanding.benefits.b5",
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
            <Link to="/dla-pracodawcow">
              <Button variant="ghost" size="sm">{t("candidateLanding.navEmployer")}</Button>
            </Link>
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
        {/* Hero */}
        <section className="relative pt-32 pb-24 overflow-hidden hero-section">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cta/15 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
                {t("candidateLanding.hero.title")}
                <span className="block text-gradient-gold mt-2">{t("candidateLanding.hero.highlight")}</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
                {t("candidateLanding.hero.description")}
              </p>
              <Link to="/register?type=candidate">
                <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg">
                  <Users className="w-6 h-6" />
                  {t("candidateLanding.hero.cta")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
            </svg>
          </div>
        </section>

        {/* Value prop */}
        <section className="py-14 bg-primary">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold text-primary-foreground leading-relaxed">
                {t("candidateLanding.valueProp.line1")}
              </h2>
              <p className="text-lg text-primary-foreground/80 mt-3">
                {t("candidateLanding.valueProp.line2")}
              </p>
            </div>
          </div>
        </section>

        {/* Problems & Solutions */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("candidateLanding.problemsTitle")}</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">{t("candidateLanding.problemsSubtitle")}</p>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {problems.map((item, i) => (
                <div key={i} className="floating-card rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-2">{t(item.problemKey)}</p>
                      <div className="flex items-start gap-2 mt-3 p-3 bg-success/10 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{t(item.solutionKey)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("candidateLanding.benefitsTitle")}</h2>
              <p className="text-muted-foreground text-center mb-12">{t("candidateLanding.benefitsSubtitle")}</p>
              <ul className="space-y-5 max-w-xl mx-auto">
                {benefits.map((key, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground text-lg">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("howItWorks.title")}</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">{t("howItWorks.subtitle")}</p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { step: 1, emoji: "📋", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Description" },
                { step: 2, emoji: "🔍", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Description" },
                { step: 3, emoji: "🤝", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Description" },
              ].map((item) => (
                <div key={item.step} className="floating-card text-center rounded-xl p-8">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-3xl">
                      {item.emoji}
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-cta text-cta-foreground font-bold flex items-center justify-center text-sm">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t(item.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(item.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("candidateLanding.valuesTitle")}</h2>
              <p className="text-muted-foreground">{t("candidateLanding.valuesSubtitle")}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Heart, titleKey: "candidateLanding.values.v1Title", descKey: "candidateLanding.values.v1Desc" },
                { icon: ShieldCheck, titleKey: "candidateLanding.values.v2Title", descKey: "candidateLanding.values.v2Desc" },
                { icon: Target, titleKey: "candidateLanding.values.v3Title", descKey: "candidateLanding.values.v3Desc" },
              ].map((v, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-bold mb-2 text-base">{t(v.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(v.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Early Adopter */}
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

        {/* Employer redirect */}
        <section className="py-20 hero-section">
          <div className="container mx-auto px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">{t("candidateLanding.employerCTA.title")}</h2>
            <p className="text-primary-foreground/80 mb-8 text-lg max-w-2xl mx-auto">{t("candidateLanding.employerCTA.desc")}</p>
            <Link to="/dla-pracodawcow">
              <Button size="lg" variant="secondary" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl">
                <Building2 className="w-5 h-5" />
                {t("candidateLanding.employerCTA.cta")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("candidateLanding.finalCTA.title")}</h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">{t("candidateLanding.finalCTA.desc")}</p>
            <Link to="/register?type=candidate">
              <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg">
                {t("common.startNow")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-primary">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-primary-foreground font-semibold">idealniepasuje</span>
            <p className="text-primary-foreground/60 text-sm">
              © 2026 idealniepasuje. {t("common.allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CandidateLanding;
