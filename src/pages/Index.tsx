import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Building2 } from "lucide-react";
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
            <Link to="/register">
              <Button size="sm" className="text-base font-bold px-6 py-2">
                {t("common.register")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero – gateway */}
        <section className="relative pt-32 pb-24 overflow-hidden hero-section">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cta/15 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
                {t("gateway.title")}
                <span className="block text-gradient-gold mt-2">{t("gateway.titleHighlight")}</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                {t("gateway.description")}
              </p>
            </div>

            {/* Two paths */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Candidate path */}
              <div className="group relative bg-card/10 backdrop-blur-sm border border-primary-foreground/20 rounded-2xl p-8 md:p-10 text-center hover:bg-card/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-cta/20 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-cta" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
                  {t("gateway.candidateTitle")}
                </h2>
                <p className="text-primary-foreground/70 mb-4 text-base leading-relaxed">
                  {t("gateway.candidateDesc1")}
                </p>
                <p className="text-primary-foreground/70 mb-8 text-base leading-relaxed">
                  {t("gateway.candidateDesc2")}
                </p>
                <Link to="/dla-kandydatow">
                  <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg w-full md:w-auto">
                    {t("gateway.candidateCTA")}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              {/* Employer path */}
              <div className="group relative bg-card/10 backdrop-blur-sm border border-primary-foreground/20 rounded-2xl p-8 md:p-10 text-center hover:bg-card/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
                  {t("gateway.employerTitle")}
                </h2>
                <p className="text-primary-foreground/70 mb-4 text-base leading-relaxed">
                  {t("gateway.employerDesc1")}
                </p>
                <p className="text-primary-foreground/70 mb-8 text-base leading-relaxed">
                  {t("gateway.employerDesc2")}
                </p>
                <Link to="/dla-pracodawcow">
                  <Button size="lg" variant="secondary" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg w-full md:w-auto">
                    {t("gateway.employerCTA")}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Wave */}
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
                {t("gateway.valueProp")}
              </h2>
              <p className="text-lg md:text-xl text-primary-foreground/80 mt-3">
                {t("gateway.valuePropSub")}
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
              {[
                { step: 1, icon: "📋", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Description" },
                { step: 2, icon: "🔍", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Description" },
                { step: 3, icon: "🤝", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Description" },
              ].map((item) => (
                <div key={item.step} className="floating-card text-center rounded-xl p-8">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-3xl">
                      {item.icon}
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

        {/* CTA bottom */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("gateway.ctaTitle")}</h2>
            <p className="text-muted-foreground mb-10 text-lg max-w-2xl mx-auto">{t("gateway.ctaDesc")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dla-kandydatow">
                <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg">
                  <Users className="w-5 h-5" />
                  {t("gateway.candidateCTA")}
                </Button>
              </Link>
              <Link to="/dla-pracodawcow">
                <Button size="lg" variant="secondary" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg">
                  <Building2 className="w-5 h-5" />
                  {t("gateway.employerCTA")}
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

export default Index;
