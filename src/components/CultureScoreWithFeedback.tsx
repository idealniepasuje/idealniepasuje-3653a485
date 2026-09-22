import {
  getCultureLevel,
  getCultureLevelLabel,
  getCandidateCultureFeedback,
  getEmployerCultureFeedback,
  type CultureDimension,
} from "@/data/feedbackData";
import { useTranslation } from "react-i18next";

interface CultureScoreWithFeedbackProps {
  dimensionCode: string;
  dimensionName: string;
  score: number;
  audience?: "employer" | "candidate";
}

export const CultureScoreWithFeedback = ({
  dimensionCode,
  dimensionName,
  score,
  audience = "candidate",
}: CultureScoreWithFeedbackProps) => {
  const { i18n } = useTranslation();

  const level = getCultureLevel(score);

  const label = getCultureLevelLabel(
    level,
    audience,
    i18n.language,
  );

  const feedback =
    audience === "employer"
      ? getEmployerCultureFeedback(
          dimensionCode as CultureDimension,
          score,
        )
      : getCandidateCultureFeedback(
          dimensionCode as CultureDimension,
          score,
        );

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h3 className="font-semibold">{dimensionName}</h3>

        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
            level === "high"
              ? "bg-success/20 text-success"
              : level === "medium"
                ? "bg-cta/20 text-cta"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {feedback}
      </p>
    </div>
  );
};