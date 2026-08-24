import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Heart, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { ExtraCriteriaList, type ExtraDetailItem } from "@/components/match/ExtraCriteriaList";

export interface InternalAssessmentRecord {
  id: string;
  consent_status: string;
  overall_percent: number | null;
  competence_percent: number | null;
  culture_percent: number | null;
  extra_percent: number | null;
  computed_at: string | null;
  match_details: any;
}

interface CompetenceDetail {
  competency: string;
  candidateScore: number;
  employerRequirement: number;
  matchPercent: number;
  status: "excellent" | "good" | "needs_work";
}

interface CultureDetail {
  dimension: string;
  candidateScore: number;
  employerScore: number;
  matchPercent: number;
  status: "aligned" | "partial" | "divergent";
}

const competencyNames: Record<string, string> = {
  komunikacja: "Komunikacja",
  myslenie_analityczne: "Myślenie analityczne",
  out_of_the_box: "Kreatywność",
  determinacja: "Determinacja",
  adaptacja: "Adaptacja do zmian",
};

const cultureNames: Record<string, string> = {
  relacja_wspolpraca: "Relacje i współpraca",
  elastycznosc_innowacyjnosc: "Elastyczność i innowacyjność",
  wyniki_cele: "Wyniki i cele",
  stabilnosc_struktura: "Stabilność i struktura",
  autonomia_styl_pracy: "Autonomia i styl pracy",
  wlb_dobrostan: "Work-life balance i dobrostan",
};

export const consentLabels: Record<string, string> = {
  pending: "Analiza w przygotowaniu",
  granted: "Aktywne członkostwo",
  declined: "Brak aktywnego członkostwa",
  revoked: "Brak aktywnego członkostwa",
};

const ScoreTile = ({ label, value }: { label: string; value: number | null }) => (
  <div className="rounded-lg border p-3 text-center">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-xl font-bold">{value === null || value === undefined ? <span className="text-sm font-medium text-muted-foreground">Brak danych</span> : `${value}%`}</p>
  </div>
);

interface Props {
  assessment: InternalAssessmentRecord;
  /** Nagłówek: nazwa pracownika (widok firmy) lub nazwa firmy (widok pracownika) */
  subjectLabel: string;
  roleTitle: string;
  perspective: "employer" | "employee";
}

/**
 * Szczegóły analizy wewnętrznej — wspólny widok dla firmy i pracownika.
 * Nie przelicza niczego: prezentuje wyłącznie dane zapisane w `internal_assessments`.
 */
export const InternalAssessmentDetails = ({ assessment, subjectLabel, roleTitle, perspective }: Props) => {
  const isEmployer = perspective === "employer";

  if (assessment.consent_status !== "granted") {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        {isEmployer
          ? "Wyniki są niedostępne — wybrany kandydat nie jest już aktywnym członkiem organizacji."
          : "Wyniki są ukryte, ponieważ nie masz już aktywnego członkostwa w tej organizacji."}
      </div>
    );
  }

  if (assessment.computed_at === null && assessment.overall_percent === null) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Analiza nie została jeszcze przeliczona.
      </div>
    );
  }

  const md = assessment.match_details || {};
  const competenceDetails: CompetenceDetail[] = Array.isArray(md.competenceDetails) ? md.competenceDetails : [];
  const cultureDetails: CultureDetail[] = Array.isArray(md.cultureDetails) ? md.cultureDetails : [];
  const extraDetails: ExtraDetailItem[] = Array.isArray(md.extraDetails) ? md.extraDetails : [];
  const strengths: string[] = Array.isArray(md.strengths) ? md.strengths : [];
  const risks: string[] = Array.isArray(md.risks) ? md.risks : [];

  const subjectLabelKey = isEmployer ? "internal.employeeScore" : "internal.yourScore";

  return (
    <div className="space-y-6">
      {/* A. Nagłówek */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{subjectLabel}</p>
            <p className="text-sm text-muted-foreground">
              {isEmployer ? "Rola" : "Twoje dopasowanie do roli"}: {roleTitle}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-accent">
              {assessment.overall_percent === null ? "—" : `${assessment.overall_percent}%`}
            </p>
            <Badge variant="secondary" className="mt-1">
              {consentLabels[assessment.consent_status] || assessment.consent_status}
            </Badge>
          </div>
        </div>
        {assessment.computed_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Ostatnie przeliczenie: {new Date(assessment.computed_at).toLocaleString("pl-PL")}
          </p>
        )}
      </div>

      {/* B. Trzy główne obszary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScoreTile label="Kompetencje" value={assessment.competence_percent} />
        <ScoreTile label="Kultura" value={assessment.culture_percent} />
        <ScoreTile label="Dane dodatkowe" value={assessment.extra_percent} />
      </div>

      {(strengths.length > 0 || risks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strengths.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-4 h-4 text-success" /> Mocne dopasowania
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {strengths.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
          {risks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="w-4 h-4 text-warning" /> Obszary rozbieżności
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {risks.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* C. Szczegóły */}
      {competenceDetails.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4" /> Kompetencje — szczegóły
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {competenceDetails.map((c) => (
              <div key={c.competency} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{competencyNames[c.competency] || c.competency}</span>
                  <Badge variant={c.status === "excellent" ? "default" : c.status === "good" ? "secondary" : "outline"}>
                    {Math.round(c.matchPercent)}%
                  </Badge>
                </div>
                <Progress value={c.matchPercent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {cultureDetails.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="w-4 h-4" /> Kultura — szczegóły
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cultureDetails.map((c) => (
              <div key={c.dimension} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{cultureNames[c.dimension] || c.dimension}</span>
                  <Badge variant={c.status === "aligned" ? "default" : c.status === "partial" ? "secondary" : "outline"}>
                    {Math.round(c.matchPercent)}%
                  </Badge>
                </div>
                <Progress value={c.matchPercent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="w-4 h-4" /> Kryteria dodatkowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExtraCriteriaList
            details={extraDetails}
            extraStatus={md.extraStatus}
            requirementLabelKey="internal.roleRequirement"
            subjectLabelKey={subjectLabelKey}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InternalAssessmentDetails;
