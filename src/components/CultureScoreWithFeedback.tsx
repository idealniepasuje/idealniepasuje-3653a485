import { getLevel, getFeedback, getLocalizedLevelLabels } from "@/data/feedbackData";
import { useTranslation } from "react-i18next";

interface CultureScoreWithFeedbackProps {
  dimensionCode: string;
  dimensionName: string;
  score: number;
  audience?: 'employer' | 'candidate';
}

export const CultureScoreWithFeedback = ({
  dimensionCode,
  dimensionName,
  score,
  audience = 'candidate'
}: CultureScoreWithFeedbackProps) => {
  const { i18n } = useTranslation();
  const level = getLevel(score);
  const feedback = getFeedback('culture', dimensionCode, level, audience, i18n.language);
  const levelLabels = getLocalizedLevelLabels(i18n.language);
  const levelInfo = levelLabels[level];

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{dimensionName}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            level === 'high' ? 'bg-success/20 text-success' : 
            level === 'medium' ? 'bg-cta/20 text-cta' : 
            'bg-destructive/20 text-destructive'
          }`}>
            {levelInfo.label}
          </span>
          <span className={`text-sm font-medium ${
            level === 'high' ? 'text-success' : 
            level === 'medium' ? 'text-cta' : 
            'text-muted-foreground'
          }`}>
            {score.toFixed(1)} / 5.0
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{feedback}</p>
    </div>
  );
};
