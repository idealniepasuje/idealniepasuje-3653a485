import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, CheckCircle2, Heart, ShieldCheck, Sparkles, TrendingUp, Gift, Building2, Target, Eye, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import heroCandidateImg from "@/assets/hero-candidate.jpg";
import benefitDiscoverImg from "@/assets/benefit-discover.jpg";
import benefitMatchImg from "@/assets/benefit-match.jpg";
import benefitCultureImg from "@/assets/benefit-culture.jpg";

const CandidateLanding = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user && userType) {
      navigate(userType === "employer" ? "/employer/dashboard" : "/candidate/dashboard");
    }
  }, [user, userType, loading, navigate]);

  const benefitCards = [
    { img: benefitDiscoverImg, titleKey: "candidateLanding.benefitCards.discover.title", descKey: "candidateLanding.benefitCards.discover.desc", icon: Eye },
    { img: benefitMatchImg, titleKey: "candidateLanding.benefitCards.match.title", descKey: "candidateLanding.benefitCards.match.desc", icon: Zap },
    { img: benefitCultureImg, titleKey: "candidateLanding.benefitCards.culture.title", descKey: "candidateLanding.benefitCards.culture.desc", icon: Heart },
  ];

  const problems = [
    { icon: "📄", solutionKey: "candidateLanding.problems.cv.solution" },
    { icon: "🧠", solutionKey: "candidateLanding.problems.soft.solution" },
    { icon: "⚖️", solutionKey: "candidateLanding.problems.bias.solution" },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              <Button size="sm" className="text-base font-bold px-6 py-2">{t("common.register")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-24 pb-0 overflow-hidden">
          <div className="hero-section">
            <div className="container mx-auto px-4 relative z-10">
              <div className="grid md:grid-cols-2 gap-8 items-center py-12 md:py-20">
                <div className="max-w-lg">
                  <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-5 leading-tight">
                    {t("candidateLanding.hero.title")}
                    <span className="block text-gradient-gold mt-1">{t("candidateLanding.hero.highlight")}</span>
                  </h1>
                  <p className="text-base md:text-lg text-primary-foreground/80 mb-8 leading-relaxed">
                    {t("candidateLanding.hero.description")}
                  </p>
                  <Link to="/register?type=candidate">
                    <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg">
                      <Users className="w-5 h-5" />
                      {t("candidateLanding.hero.cta")}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img src={heroCandidateImg} alt="Kandydat w pracy" className="rounded-2xl shadow-2xl object-cover w-full h-[400px]" width={640} height={400} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-background">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full -mt-1">
              <path d="M0 0L60 8C120 16 240 32 360 40C480 48 600 48 720 44C840 40 960 32 1080 28C1200 24 1320 24 1380 24L1440 24V80H0Z" fill="hsl(var(--background))" />
            </svg>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("candidateLanding.benefitsTitle")}</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefitCards.map((card, i) => (
                <div key={i} className="group bg-card rounded-2xl overflow-hidden shadow-md border border-border/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-44 overflow-hidden">
                    <img src={card.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={176} />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <div className="w-10 h-10 rounded-xl bg-cta flex items-center justify-center shadow-md">
                        <card.icon className="w-5 h-5 text-cta-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-base mb-1.5">{t(card.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(card.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problems - compact */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("candidateLanding.problemsTitle")}</h2>
            <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {problems.map((item, i) => (
                <div key={i} className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 flex items-start gap-3">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80 leading-relaxed">{t(item.solutionKey)}</p>
                  </div>
                </div>
              ))}
            </div>
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

        {/* Early Adopter */}
        <section className="py-16 bg-cta/10 border-y border-cta/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <Gift className="w-8 h-8 text-cta-foreground mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">{t("earlyAdopter.title")}</h2>
              <p className="text-muted-foreground mb-6">{t("earlyAdopter.description")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-sm border border-cta/20">
                  <Sparkles className="w-4 h-4 text-cta-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("earlyAdopter.perk1")}</span>
                </div>
                <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-sm border border-cta/20">
                  <TrendingUp className="w-4 h-4 text-cta-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("earlyAdopter.perk2")}</span>
                </div>
              </div>
              <Link to="/register?type=candidate">
                <Button size="lg" className="gap-2 text-lg font-bold px-10 py-5 rounded-xl shadow-lg">
                  {t("earlyAdopter.cta")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Employer redirect */}
        <section className="py-16 hero-section">
          <div className="container mx-auto px-4 text-center">
            <Building2 className="w-7 h-7 text-primary-foreground mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">{t("candidateLanding.employerCTA.title")}</h2>
            <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto">{t("candidateLanding.employerCTA.desc")}</p>
            <Link to="/dla-pracodawcow">
              <Button size="lg" variant="secondary" className="gap-2 text-lg font-bold px-10 py-5 rounded-xl">
                <Building2 className="w-5 h-5" />
                {t("candidateLanding.employerCTA.cta")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("candidateLanding.finalCTA.title")}</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">{t("candidateLanding.finalCTA.desc")}</p>
            <Link to="/register?type=candidate">
              <Button size="lg" className="gap-2 text-lg font-bold px-10 py-5 rounded-xl shadow-lg">
                {t("common.startNow")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
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

export default CandidateLanding;
