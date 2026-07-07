import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X, ClipboardList, BarChart3, Handshake, Sparkles, Home, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Palette (explicit per brand direction):
// bg #F8FAFC · navy #0F172A · violet #6366F1 · teal #2DD4BF · gray #E2E8F0 · cta #4F46E5

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.15 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
};

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        transition: "opacity .7s ease, transform .7s ease",
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
      }}
    >
      {children}
    </div>
  );
};

const DashboardMockup = () => (
  <div className="relative rounded-[24px] bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] border border-[#E2E8F0] overflow-hidden">
    <div className="flex">
      {/* Sidebar */}
      <div className="w-14 md:w-16 bg-[#0F172A] py-6 flex flex-col items-center gap-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#2DD4BF]" />
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <BarChart3 className="w-4 h-4 text-white/50" />
        <Star className="w-4 h-4 text-white/50" />
        <Sparkles className="w-4 h-4 text-white/50" />
      </div>
      {/* Content */}
      <div className="flex-1 p-4 md:p-6 space-y-4">
        <div>
          <h3 className="text-[#0F172A] font-bold text-lg md:text-xl">Witaj! 👋</h3>
          <p className="text-slate-500 text-xs md:text-sm">Świetnie, że jesteś bliżej swojej idealnej pracy.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#F8FAFC] p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-slate-500 mb-1">Twój postęp</p>
            <p className="text-xl md:text-2xl font-bold text-[#0F172A]">82%</p>
            <div className="mt-2 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#6366F1] to-[#2DD4BF]" />
            </div>
          </div>
          <div className="rounded-2xl bg-[#F8FAFC] p-3 md:p-4 flex items-center gap-3">
            <div className="relative w-12 h-12 md:w-14 md:h-14">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="url(#g1)" strokeWidth="3" strokeDasharray="77 100" strokeLinecap="round" />
                <defs>
                  <linearGradient id="g1"><stop offset="0" stopColor="#6366F1" /><stop offset="1" stopColor="#2DD4BF" /></linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs md:text-sm font-bold text-[#0F172A]">82%</div>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-slate-500">Dopasowanie</p>
              <p className="text-sm md:text-base font-semibold text-[#0F172A]">Bardzo dobre</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-[#F8FAFC] p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-slate-500 mb-3">Najlepiej dopasowane ścieżki</p>
          <div className="space-y-2">
            {[
              { name: "UX Designer", val: 92 },
              { name: "Product Manager", val: 89 },
              { name: "Customer Success", val: 87 },
            ].map((r) => (
              <div key={r.name} className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-[#0F172A] font-medium">{r.name}</span>
                <span className="font-bold text-[#6366F1]">{r.val}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Index = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && userType) {
      navigate(userType === "employer" ? "/employer/dashboard" : "/candidate/dashboard");
    }
  }, [user, userType, loading, navigate]);

  const steps = [
    { icon: ClipboardList, titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Description" },
    { icon: BarChart3, titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Description" },
    { icon: Handshake, titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Description" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8FAFC]/85 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#2DD4BF]" />
            <span className="text-lg font-bold">idealnie<span className="text-[#6366F1]">pasuje</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-[#0F172A] hover:bg-[#E2E8F0]/60">{t("common.login")}</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl px-5 font-semibold">
                {t("common.register")}
              </Button>
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white animate-fade-in">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">{t("common.login")}</Button>
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold">{t("common.register")}</Button>
              </Link>
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
          {/* soft gradient orbs */}
          <div aria-hidden className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl bg-gradient-to-br from-[#6366F1] to-[#2DD4BF]" />
          <div aria-hidden className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl bg-[#2DD4BF]" />

          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <Reveal>
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-xs font-semibold uppercase tracking-wide mb-6">
                  Dopasuj pracę do siebie
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  Znajdź pracę,<br />która naprawdę<br />
                  do Ciebie <span className="bg-gradient-to-r from-[#6366F1] to-[#2DD4BF] bg-clip-text text-transparent">pasuje</span>.
                </h1>
                <p className="mt-6 text-lg text-slate-600 max-w-lg">
                  U nas nie znajdziesz przypadkowych ofert. Dopasowujemy ścieżki kariery do Twoich kompetencji, osobowości i wartości.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/register">
                    <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl px-7 py-6 text-base font-semibold shadow-[0_10px_30px_-10px_rgba(79,70,229,0.6)]">
                      Rozpocznij test dopasowania
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </Button>
                  </Link>
                  <a href="#jak-to-dziala">
                    <Button size="lg" variant="ghost" className="rounded-2xl px-7 py-6 text-base font-semibold text-[#0F172A] hover:bg-[#E2E8F0]/60">
                      Zobacz jak to działa →
                    </Button>
                  </a>
                </div>
                <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" /> Oparte na psychologii</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" /> Spersonalizowane wyniki</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" /> Setki ścieżek kariery</div>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <DashboardMockup />
              </Reveal>
            </div>
          </div>
        </section>

        {/* DASHBOARD SHOWCASE */}
        <section className="py-16 md:py-24 bg-white border-y border-[#E2E8F0]">
          <div className="container mx-auto px-4">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#2DD4BF]/15 text-[#0F172A] text-xs font-semibold uppercase tracking-wide mb-4">
                  Twój panel
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Wszystko w jednym miejscu</h2>
                <p className="text-slate-600">
                  Postęp testów, dopasowania, ścieżki kariery i wiadomości od pracodawców — w intuicyjnym pulpicie.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="max-w-5xl mx-auto">
                <div className="rounded-[24px] p-1 bg-gradient-to-br from-[#6366F1] to-[#2DD4BF] shadow-[0_30px_80px_-20px_rgba(99,102,241,0.35)]">
                  <div className="rounded-[20px] bg-white p-4 md:p-6">
                    <DashboardMockup />
                  </div>
                </div>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5 mt-12 max-w-5xl mx-auto">
              {[
                { icon: TrendingUp, title: "Śledź postęp", desc: "Widzisz, jak rośnie Twoje dopasowanie z każdą odpowiedzią." },
                { icon: Sparkles, title: "AI matching", desc: "Algorytm dopasowuje Cię do ról zgodnych z Twoją osobowością." },
                { icon: Star, title: "Ulubione oferty", desc: "Zapisuj pracodawców, którzy najbardziej Ci pasują." },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 100}>
                  <div className="rounded-[20px] bg-[#F8FAFC] border border-[#E2E8F0] p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#2DD4BF] flex items-center justify-center mb-4">
                      <f.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* JAK TO DZIAŁA */}
        <section id="jak-to-dziala" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-xs font-semibold uppercase tracking-wide mb-4">
                  Proces
                </span>
                <h2 className="text-3xl md:text-4xl font-bold">{t("howItWorks.title")}</h2>
              </div>
            </Reveal>

            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <Reveal key={i} delay={i * 120}>
                  <div className="relative rounded-[24px] bg-white border border-[#E2E8F0] p-8 h-full shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.25)] hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -top-4 left-8 w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#2DD4BF] flex items-center justify-center text-white font-bold shadow-lg">
                      {i + 1}
                    </div>
                    <step.icon className="w-8 h-8 text-[#6366F1] mt-4 mb-4" />
                    <h3 className="font-bold text-xl mb-3">{t(step.titleKey)}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">{t(step.descKey)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Reveal>
              <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] p-10 md:p-16 text-center">
                <div aria-hidden className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30 blur-3xl bg-gradient-to-br from-[#6366F1] to-[#2DD4BF]" />
                <div className="relative">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Gotów znaleźć swoje miejsce?</h2>
                  <p className="text-slate-300 mb-8 max-w-xl mx-auto">Rozpocznij bezpłatny test i odkryj ścieżki kariery, które naprawdę do Ciebie pasują.</p>
                  <Link to="/register">
                    <Button size="lg" className="bg-white hover:bg-slate-100 text-[#0F172A] rounded-2xl px-8 py-6 text-base font-semibold">
                      Rozpocznij teraz
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-[#0F172A]">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6366F1] to-[#2DD4BF]" />
            <span className="text-white font-semibold">idealniepasuje</span>
          </div>
          <p className="text-white/60 text-sm">© 2026 idealniepasuje. {t("common.allRightsReserved")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
