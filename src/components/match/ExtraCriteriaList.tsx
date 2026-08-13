import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

export interface ExtraDetailItem {
  field?: string;
  key?: string;
  matched?: boolean;
  status?: 'matched' | 'unmatched' | 'no_data';
  candidateValue?: string | null;
  employerValue?: string | null;
  acceptedValues?: string[];
}

interface Props {
  details?: ExtraDetailItem[] | null;
  extraStatus?: 'ok' | 'insufficient_data';
  /** Etykieta kolumny z wymaganiem pracodawcy */
  requirementLabelKey?: string;
}

// Mapowanie technicznych kluczy z algorytmu na klucze tłumaczeń UI
const FIELD_LABEL_KEYS: Record<string, string> = {
  industry: "employer.candidateDetail.criteriaIndustry",
  experience: "employer.candidateDetail.criteriaExperience",
  position_level: "employer.candidateDetail.criteriaPositionLevel",
  work_mode: "common.workMode",
  city: "common.city",
};

// Historyczne rekordy zapisywały tylko polską nazwę pola
const LEGACY_FIELD_KEYS: Record<string, string> = {
  "Branża": "industry",
  "Doświadczenie": "experience",
  "Poziom stanowiska": "position_level",
  "Tryb pracy": "work_mode",
  "Lokalizacja": "city",
};

export const ExtraCriteriaList = ({ details, extraStatus, requirementLabelKey = "employer.candidateDetail.yourRequirement" }: Props) => {
  const { t } = useTranslation();

  const list = Array.isArray(details) ? details : [];

  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {extraStatus === 'insufficient_data'
          ? t("match.insufficientData")
          : t("employer.candidateDetail.noData")}
      </p>
    );
  }

  const resolveKey = (d: ExtraDetailItem) =>
    d.key || LEGACY_FIELD_KEYS[d.field || ''] || d.field || 'unknown';

  const label = (d: ExtraDetailItem) => {
    const k = resolveKey(d);
    const tk = FIELD_LABEL_KEYS[k];
    return tk ? t(tk) : (d.field || k);
  };

  const displayValue = (value: string | null | undefined, fieldKey: string) => {
    if (value === null || value === undefined || value === '') return null;
    const v = String(value);
    switch (fieldKey) {
      case 'industry':
        return t(`candidate.additional.industries.${v}`, v);
      case 'position_level':
        return t(`candidate.additional.positionLevels.${v}`, v);
      case 'work_mode':
        return t(`common.${v}`, v);
      case 'experience':
        if (v === '0') return t("employer.requirements.noExperienceRequired");
        if (v === 'Nie wymagane') return t("employer.requirements.noExperienceRequired");
        return `${v} ${t("common.years")}`;
      default:
        return v;
    }
  };

  return (
    <div className="space-y-4">
      {extraStatus === 'insufficient_data' && (
        <p className="text-sm text-muted-foreground">{t("match.insufficientData")}</p>
      )}
      {list.map((d, idx) => {
        const fieldKey = resolveKey(d);
        // Jedyne źródło prawdy: status z algorytmu, fallback na `matched` dla starych rekordów
        const status: 'matched' | 'unmatched' | 'no_data' =
          d.status ?? (d.matched ? 'matched' : 'unmatched');
        const isNoData = status === 'no_data';
        const isMatched = status === 'matched';

        return (
          <div
            key={`${fieldKey}-${idx}`}
            className={`p-4 rounded-lg border ${
              isNoData
                ? 'border-border bg-muted/30'
                : isMatched
                  ? 'border-success/30 bg-success/5'
                  : 'border-destructive/30 bg-destructive/5'
            }`}
          >
            <div className="flex items-start gap-3">
              {isNoData ? (
                <HelpCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              ) : isMatched ? (
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className={`font-medium ${isMatched ? '' : 'text-muted-foreground'}`}>
                    {label(d)}
                  </span>
                  <Badge
                    variant={isNoData ? "secondary" : isMatched ? "default" : "destructive"}
                    className={isMatched ? "bg-success" : ""}
                  >
                    {isNoData
                      ? t("employer.candidateDetail.noData")
                      : isMatched
                        ? t("common.match")
                        : t("employer.candidateDetail.noMatch")}
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t("employer.candidateDetail.candidateScore")}:</span>
                    <span className="font-medium">{displayValue(d.candidateValue, fieldKey) || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t(requirementLabelKey)}:</span>
                    <span className="font-medium">
                      {displayValue(d.employerValue, fieldKey) || t("employer.candidateDetail.noExpectations")}
                    </span>
                  </div>
                </div>

                {fieldKey === 'industry' && Array.isArray(d.acceptedValues) && d.acceptedValues.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {t("employer.candidateDetail.acceptedIndustries")}:{' '}
                    {d.acceptedValues.map((v) => t(`candidate.additional.industries.${v}`, v)).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExtraCriteriaList;
