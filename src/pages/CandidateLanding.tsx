import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, CheckCircle2, ShieldCheck, Sparkles, TrendingUp, Gift, Building2, FileSearch, Brain, BarChart3, RefreshCw, ClipboardList, Handshake } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import heroCandidateImg from "@/assets/hero-candidate.jpg";
import benefitDiscoverImg from "@/assets/benefit-discover.jpg";
import benefitMatchImg from "@/assets/benefit-match.jpg";
import benefitCultureImg from "@/assets/benefit-culture.jpg";
import problemsImg from "@/assets/problems-recruitment.jpg";
import stepTestImg from "@/assets/step-test.jpg";
import stepAlgorithmImg from "@/assets/step-algorithm.jpg";
import stepMatchImg from "@/assets/step-match.jpg";
import valuesImg from "@/assets/values-team.jpg";

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
    { icon: FileSearch, problemKey: "candidateLanding.problems.cv.problem", solutionKey: "candidateLanding.problems.cv.solution" },
    { icon: Brain, problemKey: "candidateLanding.problems.soft.problem", solutionKey: "candidateLanding.problems.soft.solution" },
    { icon: RefreshCw, problemKey: "candidateLanding.problems.career.problem", solutionKey: "candidateLanding.problems.career.solution" },
    { icon: BarChart3, problemKey: "candidateLanding.problems.bias.problem", solutionKey: "candidateLanding.problems.bias.solution" },
  ];

  const benefitCards = [
    { img: benefitDiscoverImg, titleKey: "candidateLanding.benefitCards.discover.title", descKey: "candidateLanding.benefitCards.discover.desc" },
    { img: benefitMatchImg, titleKey: "candidateLanding.benefitCards.match.title", descKey: "candidateLanding.benefitCards.match.desc" },
    { img: benefitCultureImg, titleKey: "candidateLanding.benefitCards.culture.title", descKey: "candidateLanding.benefitCards.culture.desc" },
  ];

  const steps = [
    { img: stepTestImg, icon: ClipboardList, titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Description" },
    { img: stepAlgorithmImg, icon: BarChart3, titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Description" },
    { img: stepMatchImg, icon: Handshake, titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Description" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNav variant="candidate" />

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
        </section>

        {/* Benefit Cards */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">{t("candidateLanding.benefitsTitle")}</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {benefitCards.map((card, i) => (
                <div key={i} className="group bg-card rounded-2xl overflow-hidden shadow-md border border-border/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-52 overflow-hidden">
                    <img src={card.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={208} />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-2">{t(card.titleKey)}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t(card.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problems - image + compact list */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">{t("candidateLanding.problemsTitle")}</h2>
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
              <img src={problemsImg} alt="" className="rounded-2xl shadow-lg object-cover w-full h-80" loading="lazy" width={800} height={320} />
              <div className="space-y-5">
                {problems.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">{t(item.problemKey)}</p>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{t(item.solutionKey)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works - alternating image/text */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">{t("howItWorks.title")}</h2>
            <div className="max-w-5xl mx-auto space-y-16">
              {steps.map((item, i) => (
                <div key={i} className={`grid md:grid-cols-2 gap-10 items-center`}>
                  <div className={i % 2 === 1 ? "md:order-2" : ""}>
                    <img src={item.img} alt="" className="rounded-2xl shadow-lg object-cover w-full h-64" loading="lazy" width={640} height={256} />
                  </div>
                  <div className={i % 2 === 1 ? "md:order-1" : ""}>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="w-10 h-10 rounded-full bg-cta text-cta-foreground font-bold flex items-center justify-center text-lg shadow-md shrink-0">{i + 1}</span>
                      <h3 className="text-2xl md:text-3xl font-bold">{t(item.titleKey)}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values - image + cards */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
              <img src={valuesImg} alt="" className="rounded-2xl shadow-lg object-cover w-full h-80" loading="lazy" width={800} height={320} />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-8">{t("candidateLanding.valuesTitle")}</h2>
                <div className="space-y-6">
                  {[
                    { icon: ShieldCheck, titleKey: "candidateLanding.values.v1Title", descKey: "candidateLanding.values.v1Desc" },
                    { icon: CheckCircle2, titleKey: "candidateLanding.values.v2Title", descKey: "candidateLanding.values.v2Desc" },
                    { icon: ArrowRight, titleKey: "candidateLanding.values.v3Title", descKey: "candidateLanding.values.v3Desc" },
                  ].map((v, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <v.icon className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{t(v.titleKey)}</h3>
                        <p className="text-sm text-muted-foreground">{t(v.descKey)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Early Adopter */}
        <section className="py-24 bg-cta/10 border-y border-cta/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-cta/20 flex items-center justify-center mx-auto mb-6">
                <Gift className="w-8 h-8 text-cta-foreground" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">{t("earlyAdopter.title")}</h2>
              <p className="text-lg text-muted-foreground mb-8">{t("earlyAdopter.description")}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10">
                <div className="flex items-center gap-2 bg-card rounded-xl px-5 py-3 shadow-sm border border-cta/20">
                  <Sparkles className="w-5 h-5 text-cta-foreground" />
                  <span className="font-medium text-foreground">{t("earlyAdopter.perk1")}</span>
                </div>
                <div className="flex items-center gap-2 bg-card rounded-xl px-5 py-3 shadow-sm border border-cta/20">
                  <TrendingUp className="w-5 h-5 text-cta-foreground" />
                  <span className="font-medium text-foreground">{t("earlyAdopter.perk2")}</span>
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
        <section className="py-24 hero-section">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">{t("candidateLanding.employerCTA.title")}</h2>
            <p className="text-primary-foreground/70 mb-8 text-lg max-w-2xl mx-auto">{t("candidateLanding.employerCTA.desc")}</p>
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
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{t("candidateLanding.finalCTA.title")}</h2>
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

export default CandidateLanding;
