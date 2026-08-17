import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  Briefcase,
  Languages as LanguagesIcon,
  Wrench,
  Sparkles,
  Heart,
  Pencil,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { CandidateSidebar } from "@/components/layouts/CandidateSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { competencyTests } from "@/data/competencyQuestions";
import { getLocalizedCultureDimensions } from "@/data/cultureQuestions";
import { languageNames, languageLevelLabels } from "@/data/additionalQuestions";
import { getToolName, toolLevelLabels, TOOL_CATEGORIES, type ToolEntry } from "@/data/tools";
import { getLevel, getLocalizedLevelLabels } from "@/data/feedbackData";

const COMPETENCY_FIELDS = [
  { code: "komunikacja", field: "komunikacja_score" },
  { code: "myslenie_analityczne", field: "myslenie_analityczne_score" },
  { code: "out_of_the_box", field: "out_of_the_box_score" },
  { code: "determinacja", field: "determinacja_score" },
  { code: "adaptacja", field: "adaptacja_score" },
] as const;

const CULTURE_FIELDS = [
  { code: "relacja_wspolpraca", field: "culture_relacja_wspolpraca" },
  { code: "elastycznosc_innowacyjnosc", field: "culture_elastycznosc_innowacyjnosc" },
  { code: "wyniki_cele", field: "culture_wyniki_cele" },
  { code: "stabilnosc_struktura", field: "culture_stabilnosc_struktura" },
  { code: "autonomia_styl_pracy", field: "culture_autonomia_styl_pracy" },
  { code: "wlb_dobrostan", field: "culture_wlb_dobrostan" },
] as const;

const GTK_KEYS = [
  { key: "tasks", pl: "Jakie zadania wykonujesz najchętniej?", en: "Which tasks do you enjoy the most?" },
  { key: "problems", pl: "Jakie problemy lubisz rozwiązywać?", en: "What problems do you like solving?" },
  { key: "motivation", pl: "Co Cię motywuje do działania?", en: "What motivates you?" },
  { key: "proud_of", pl: "Z czego jesteś dumny/dumna?", en: "What are you proud of?" },
] as const;

const CandidateProfile = () => {
  const { i18n } = useTranslation();
  const lang: "pl" | "en" = i18n.language === "en" ? "en" : "pl";
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const [{ data: results, error: resultsError }, { data: profile }] = await Promise.all([
          supabase.from("candidate_test_results").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
        ]);
        if (resultsError) logError("CandidateProfile.load", resultsError);
        setData(results ?? null);
        setFullName(profile?.full_name ?? null);
      } catch (e) {
        logError("CandidateProfile.load", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const tr = (pl: string, en: string) => (lang === "pl" ? pl : en);
  const empty = tr("Nie uzupełniono", "Not provided");
  const levelLabels = getLocalizedLevelLabels(lang);
  const cultureDims = getLocalizedCultureDimensions(lang) as Record<string, { name: string; description: string }>;
  const compTests = (lang === "en" ? competencyTests.en : competencyTests.pl) as Record<
    string,
    { name: string; description: string }
  >;

  const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value?.trim() ? value : empty}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout sidebar={<CandidateSidebar />}>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const gtk = (data?.getting_to_know ?? {}) as Record<string, string>;
  const tools = (Array.isArray(data?.tools) ? data.tools : []) as ToolEntry[];
  const industryExperiences = (Array.isArray(data?.industry_experiences) ? data.industry_experiences : []) as any[];
  const targetIndustries = (data?.target_industries ?? []) as string[];
  const languages = [
    { key: "english", value: data?.lang_english },
    { key: "spanish", value: data?.lang_spanish },
    { key: "german", value: data?.lang_german },
    { key: "polish", value: data?.lang_polish },
  ].filter((l) => l.value && l.value !== "none");

  const toolsByCategory = TOOL_CATEGORIES.map((cat) => ({
    cat,
    entries: tools.filter((t) => cat.tools.some((ct) => ct.id === t.tool_id)),
  })).filter((g) => g.entries.length > 0);

  const workModeLabel: Record<string, string> = {
    remote: tr("Zdalnie", "Remote"),
    hybrid: tr("Hybrydowo", "Hybrid"),
    onsite: tr("Stacjonarnie", "On-site"),
  };

  return (
    <DashboardLayout sidebar={<CandidateSidebar />}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">{tr("Mój profil", "My profile")}</h1>
          <p className="text-muted-foreground">
            {tr(
              "Podsumowanie wszystkich Twoich danych widocznych w procesie dopasowania.",
              "A summary of all your data used in the matching process.",
            )}
          </p>
        </div>
        <Link to="/candidate/additional">
          <Button variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            {tr("Edytuj dane", "Edit data")}
          </Button>
        </Link>
      </div>

      {/* Status */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-wrap items-center gap-3">
          {data?.all_tests_completed ? (
            <Badge className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tr("Profil kompletny", "Profile complete")}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 border-destructive/40 text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              {tr("Profil niepełny", "Profile incomplete")}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {data?.all_tests_completed
              ? tr("Bierzesz udział w dopasowaniach.", "You are included in matching.")
              : tr("Uzupełnij testy i dane, aby brać udział w dopasowaniach.", "Complete tests and data to join matching.")}
          </span>
        </CardContent>
      </Card>

      {/* Dane kontaktowe */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            {tr("Dane podstawowe", "Basic data")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-x-6">
          <Row icon={User} label={tr("Imię i nazwisko", "Full name")} value={fullName} />
          <Row icon={Mail} label={tr("E-mail", "Email")} value={user?.email ?? null} />
          <Row icon={Phone} label={tr("Telefon", "Phone")} value={data?.phone} />
          <Row icon={Linkedin} label="LinkedIn" value={data?.linkedin_url} />
          <Row icon={MapPin} label={tr("Tryb pracy", "Work mode")} value={data?.work_mode ? workModeLabel[data.work_mode] ?? data.work_mode : null} />
          <Row icon={MapPin} label={tr("Miasto", "City")} value={data?.city} />
        </CardContent>
      </Card>

      {/* Doświadczenie */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5" />
            {tr("Doświadczenie i preferencje", "Experience and preferences")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">{tr("Doświadczenie w branżach", "Industry experience")}</p>
            {data?.has_no_experience ? (
              <p className="text-sm font-medium">{tr("Brak doświadczenia zawodowego", "No professional experience")}</p>
            ) : industryExperiences.length > 0 ? (
              <div className="space-y-1.5">
                {industryExperiences.map((exp, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 text-sm p-2 rounded-lg border bg-background">
                    <span className="font-medium">{exp.industry}</span>
                    {exp.experience && <Badge variant="outline">{exp.experience}</Badge>}
                    {exp.position_level && <Badge variant="outline">{exp.position_level}</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium">{empty}</p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">{tr("Branże docelowe", "Target industries")}</p>
            {targetIndustries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {targetIndustries.map((ind) => (
                  <Badge key={ind} variant="secondary">{ind}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium">{empty}</p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">{tr("Opis pracy marzeń", "Dream job description")}</p>
            <p className="text-sm whitespace-pre-wrap">{data?.work_description?.trim() || empty}</p>
          </div>
        </CardContent>
      </Card>

      {/* Języki */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LanguagesIcon className="w-5 h-5" />
            {tr("Języki obce", "Languages")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <Badge key={l.key} variant="outline">
                  {(languageNames as any)[lang][l.key]}: {(languageLevelLabels as any)[lang][l.value] ?? l.value}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{empty}</p>
          )}
        </CardContent>
      </Card>

      {/* Narzędzia */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="w-5 h-5" />
            {tr("Znajomość narzędzi", "Tools")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {toolsByCategory.length > 0 ? (
            toolsByCategory.map(({ cat, entries }) => (
              <div key={cat.id} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {lang === "pl" ? cat.labelPl : cat.labelEn}
                </p>
                <div className="flex flex-wrap gap-2">
                  {entries.map((e) => (
                    <Badge key={e.tool_id} variant="secondary">
                      {getToolName(e.tool_id)} — {toolLevelLabels[lang][e.level]}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{empty}</p>
          )}
        </CardContent>
      </Card>

      {/* Kompetencje */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5" />
            {tr("Wyniki kompetencji", "Competency results")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {COMPETENCY_FIELDS.map(({ code, field }) => {
            const score = data?.[field];
            return (
              <div key={code} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border bg-background">
                <span className="text-sm font-medium">{compTests[code]?.name ?? code}</span>
                {score != null ? (
                  <Badge variant="outline">{levelLabels[getLevel(Number(score))]}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{tr("Test nieukończony", "Test not completed")}</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Kultura */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5" />
            {tr("Preferencje kulturowe", "Culture preferences")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CULTURE_FIELDS.map(({ code, field }) => {
            const score = data?.[field];
            return (
              <div key={code} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border bg-background">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{cultureDims[code]?.name ?? code}</p>
                  <p className="text-xs text-muted-foreground">{cultureDims[code]?.description}</p>
                </div>
                {score != null ? (
                  <Badge variant="outline">{levelLabels[getLevel(Number(score))]}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{tr("Test nieukończony", "Test not completed")}</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Daj się poznać */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            {tr("Daj się poznać", "Get to know me")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {GTK_KEYS.map((q) => (
            <div key={q.key}>
              <p className="text-xs text-muted-foreground mb-1">{lang === "pl" ? q.pl : q.en}</p>
              <p className="text-sm whitespace-pre-wrap">{gtk?.[q.key]?.trim() || empty}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default CandidateProfile;
