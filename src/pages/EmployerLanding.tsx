import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, CheckCircle2, ShieldCheck, BarChart3, UserCheck, Users2, Sparkles, TrendingUp, Gift, Clock, Target, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import heroEmployerImg from "@/assets/hero-employer.jpg";
import benefitDiscoverImg from "@/assets/benefit-discover.jpg";
import benefitMatchImg from "@/assets/benefit-match.jpg";
import benefitCultureImg from "@/assets/benefit-culture.jpg";

const EmployerLanding = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user && userType) {
      navigate(userType === "employer" ? "/employer/dashboard" : "/candidate/dashboard");
    }
  }, [user, userType, loading, navigate]);

  const problems = [
    { icon: BarChart3, problemKey: "employerLanding.problems.titles.problem", solutionKey: "employerLanding.problems.titles.solution" },
    { icon: UserCheck, problemKey: "employerLanding.problems.apps.problem", solutionKey: "employerLanding.problems.apps.solution" },
    { icon: ShieldCheck, problemKey: "employerLanding.problems.bias.problem", solutionKey: "employerLanding.problems.bias.solution" },
    { icon: Users2, problemKey: "employerLanding.problems.team.problem", solutionKey: "employerLanding.problems.team.solution" },
  ];

  const benefitCards = [
    {
      img: benefitMatchImg,
      titleKey: "employerLanding.benefitCards.cost.title",
      descKey: "employerLanding.benefitCards.cost.desc",
      icon: Clock,
    },
    {
      img: benefitDiscoverImg,
      titleKey: "employerLanding.benefitCards.data.title",
      descKey: "employerLanding.benefitCards.data.desc",
      icon: Target,
    },
    {
      img: benefitCultureImg,
      titleKey: "employerLanding.benefitCards.team.title",
      descKey: "employerLanding.benefitCards.team.desc",
      icon: Zap,
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
            <Link to="/dla-kandydatow">
              <Button variant="ghost" size="sm">{t("employerLanding.navCandidate")}</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">{t("common.login")}</Button>
            </Link>
            <Link to="/register?type=employer">
              <Button variant="secondary" size="sm" className="text-base font-bold px-6 py-2">{t("common.register")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero with image */}
        <section className="relative pt-24 pb-0 overflow-hidden">
          <div className="hero-section">
            <div className="container mx-auto px-4 relative z-10">
              <div className="grid md:grid-cols-2 gap-8 items-center py-12 md:py-20">
                <div className="max-w-lg">
                  <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-5 leading-tight">
                    {t("employerLanding.hero.title")}
                    <span className="block text-gradient-gold mt-1">{t("employerLanding.hero.highlight")}</span>
                  </h1>
                  <p className="text-base md:text-lg text-primary-foreground/80 mb-8 leading-relaxed">
                    {t("employerLanding.hero.description")}
                  </p>
                  <Link to="/register?type=employer">
                    <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg bg-accent text-accent-foreground hover:bg-accent/90">
                      <Building2 className="w-5 h-5" />
                      {t("employerLanding.hero.cta")}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img
                    src={heroEmployerImg}
                    alt="Zespół w biurze"
                    className="rounded-2xl shadow-2xl object-cover w-full h-[400px]"
                    width={640}
                    height={400}
                  />
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

        {/* Value prop */}
        <section className="py-12 bg-primary">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold text-primary-foreground leading-relaxed">
                {t("employerLanding.valueProp.line1")}
              </h2>
              <p className="text-base text-primary-foreground/70 mt-3">
                {t("employerLanding.valueProp.line2")}
              </p>
            </div>
          </div>
        </section>

        {/* Benefit Cards with images */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("employerLanding.benefitsTitle")}</h2>
            <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">{t("employerLanding.benefitsSubtitle")}</p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {benefitCards.map((card, i) => (
                <div key={i} className="group bg-card rounded-2xl overflow-hidden shadow-md border border-border/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={card.img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={400}
                      height={192}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-md">
                        <card.icon className="w-5 h-5 text-accent-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2">{t(card.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(card.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problems & Solutions */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("employerLanding.problemsTitle")}</h2>
            <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">{t("employerLanding.problemsSubtitle")}</p>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {problems.map((item, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 shadow-md border border-border/40">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm mb-3">{t(item.problemKey)}</p>
                      <div className="flex items-start gap-2.5 p-3 bg-success/8 rounded-xl border border-success/20">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/80">{t(item.solutionKey)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("employerLanding.howTitle")}</h2>
            <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">{t("employerLanding.howSubtitle")}</p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { step: 1, emoji: "📝", titleKey: "employerLanding.how.s1Title", descKey: "employerLanding.how.s1Desc" },
                { step: 2, emoji: "⚙️", titleKey: "employerLanding.how.s2Title", descKey: "employerLanding.how.s2Desc" },
                { step: 3, emoji: "🎯", titleKey: "employerLanding.how.s3Title", descKey: "employerLanding.how.s3Desc" },
              ].map((item) => (
                <div key={item.step} className="relative bg-card rounded-2xl p-8 text-center shadow-md border border-border/40">
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cta text-cta-foreground font-bold flex items-center justify-center text-sm shadow-md">
                    {item.step}
                  </span>
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 text-2xl">
                    {item.emoji}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t(item.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Early Adopter */}
        <section className="py-20 bg-cta/10 border-y border-cta/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-cta/20 flex items-center justify-center mx-auto mb-6">
                <Gift className="w-8 h-8 text-cta-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("employerLanding.early.title")}</h2>
              <p className="text-lg text-muted-foreground mb-6">{t("employerLanding.early.desc")}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                <div className="flex items-center gap-2 bg-card rounded-xl px-5 py-3 shadow-sm border border-cta/20">
                  <Sparkles className="w-5 h-5 text-cta-foreground" />
                  <span className="font-medium text-foreground">{t("employerLanding.early.perk1")}</span>
                </div>
                <div className="flex items-center gap-2 bg-card rounded-xl px-5 py-3 shadow-sm border border-cta/20">
                  <TrendingUp className="w-5 h-5 text-cta-foreground" />
                  <span className="font-medium text-foreground">{t("employerLanding.early.perk2")}</span>
                </div>
              </div>
              <Link to="/register?type=employer">
                <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg bg-accent text-accent-foreground hover:bg-accent/90">
                  {t("employerLanding.early.cta")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Candidate redirect */}
        <section className="py-20 hero-section">
          <div className="container mx-auto px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">{t("employerLanding.candidateCTA.title")}</h2>
            <p className="text-primary-foreground/70 mb-8 text-lg max-w-2xl mx-auto">{t("employerLanding.candidateCTA.desc")}</p>
            <Link to="/dla-kandydatow">
              <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl">
                <Users className="w-5 h-5" />
                {t("employerLanding.candidateCTA.cta")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("employerLanding.finalCTA.title")}</h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">{t("employerLanding.finalCTA.desc")}</p>
            <Link to="/register?type=employer">
              <Button size="lg" className="gap-2 text-lg font-bold px-10 py-6 rounded-xl shadow-lg bg-accent text-accent-foreground hover:bg-accent/90">
                {t("common.startNow")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-primary">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-primary-foreground font-semibold">idealniepasuje</span>
            <p className="text-primary-foreground/60 text-sm">© 2026 idealniepasuje. {t("common.allRightsReserved")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmployerLanding;
