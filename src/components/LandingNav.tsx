import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface LandingNavProps {
  variant: "candidate" | "employer";
}

export const LandingNav = ({ variant }: LandingNavProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const switchLink = variant === "candidate"
    ? { to: "/dla-pracodawcow", label: t("candidateLanding.navEmployer") }
    : { to: "/dla-kandydatow", label: t("employerLanding.navCandidate") };

  const registerLink = variant === "candidate"
    ? "/register?type=candidate"
    : "/register?type=employer";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-foreground">
            idealnie<span className="text-accent">pasuje</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <Link to={switchLink.to}>
            <Button variant="ghost" size="sm">{switchLink.label}</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">{t("common.login")}</Button>
          </Link>
          <Link to={registerLink}>
            <Button size="sm" className="text-base font-bold px-6 py-2">
              {t("common.register")}
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-sm animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link to={switchLink.to} onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                {switchLink.label}
              </Button>
            </Link>
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                {t("common.login")}
              </Button>
            </Link>
            <Link to={registerLink} onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full text-base font-bold py-2">
                {t("common.register")}
              </Button>
            </Link>
            <div className="pt-2 border-t border-border/50">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
