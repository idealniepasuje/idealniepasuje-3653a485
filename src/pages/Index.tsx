import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import heroCandidateImg from "@/assets/hero-candidate.jpg";
import heroEmployerImg from "@/assets/hero-employer.jpg";

const Index = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user && userType) {
      navigate(userType === "employer" ? "/employer/dashboard" : "/candidate/dashboard");
    }
  }, [user, userType, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
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
              <Button size="sm" className="text-base font-bold px-6 py-2">{t("common.register")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-28 overflow-hidden hero-section">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
                {t("gateway.title")}
                <span className="block text-gradient-gold mt-2">{t("gateway.titleHighlight")}</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                {t("gateway.description")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Link to="/dla-kandydatow" className="group block">
                <div className="relative rounded-2xl overflow-hidden shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <img src={heroCandidateImg} alt="" className="w-full h-64 object-cover" width={640} height={256} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-cta/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-cta" />
                      </div>
                      <h2 className="text-2xl font-bold text-primary-foreground">{t("gateway.candidateTitle")}</h2>
                    </div>
                    <p className="text-primary-foreground/80 text-sm mb-5 line-clamp-2">{t("gateway.candidateDesc1")}</p>
                    <Button size="lg" className="gap-2 font-bold px-8 py-5 rounded-xl shadow-lg w-full group-hover:shadow-xl transition-shadow">
                      {t("gateway.candidateCTA")}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Link>

              <Link to="/dla-pracodawcow" className="group block">
                <div className="relative rounded-2xl overflow-hidden shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <img src={heroEmployerImg} alt="" className="w-full h-64 object-cover" width={640} height={256} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-accent" />
                      </div>
                      <h2 className="text-2xl font-bold text-primary-foreground">{t("gateway.employerTitle")}</h2>
                    </div>
                    <p className="text-primary-foreground/80 text-sm mb-5 line-clamp-2">{t("gateway.employerDesc1")}</p>
                    <Button size="lg" variant="secondary" className="gap-2 font-bold px-8 py-5 rounded-xl shadow-lg w-full group-hover:shadow-xl transition-shadow">
                      {t("gateway.employerCTA")}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
            </svg>
          </div>
        </section>

        {/* How it works - compact */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("howItWorks.title")}</h2>
            <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto items-stretch">
              {[
                { step: 1, emoji: "📋", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Description" },
                { step: 2, emoji: "🔍", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Description" },
                { step: 3, emoji: "🤝", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Description" },
              ].map((item) => (
                <div key={item.step} className="relative flex-1 bg-card rounded-2xl p-6 text-center shadow-sm border border-border/40">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-cta text-cta-foreground font-bold flex items-center justify-center text-xs shadow">
                    {item.step}
                  </span>
                  <div className="text-2xl mb-3">{item.emoji}</div>
                  <h3 className="text-sm font-bold mb-1">{t(item.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA bottom */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("gateway.ctaTitle")}</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{t("gateway.ctaDesc")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dla-kandydatow">
                <Button size="lg" className="gap-2 text-lg font-bold px-10 py-5 rounded-xl shadow-lg">
                  <Users className="w-5 h-5" />
                  {t("gateway.candidateCTA")}
                </Button>
              </Link>
              <Link to="/dla-pracodawcow">
                <Button size="lg" variant="secondary" className="gap-2 text-lg font-bold px-10 py-5 rounded-xl shadow-lg">
                  <Building2 className="w-5 h-5" />
                  {t("gateway.employerCTA")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 bg-primary">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-primary-foreground font-semibold">idealniepasuje</span>
            <p className="text-primary-foreground/60 text-sm">© 2026 idealniepasuje. {t("common.allRightsReserved")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
