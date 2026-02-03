import { Slider } from "@/components/ui/slider";
import { getLevel, getFeedback, getLocalizedLevelLabels } from "@/data/feedbackData";
import { useTranslation } from "react-i18next";

interface CompetencySliderWithFeedbackProps {
  competencyCode: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
  audience?: 'employer' | 'candidate';
}

export const CompetencySliderWithFeedback = ({
  competencyCode,
  value,
  onChange,
  label,
  audience = 'employer'
}: CompetencySliderWithFeedbackProps) => {
  const { i18n } = useTranslation();
  const level = getLevel(value);
  const feedback = getFeedback('competency', competencyCode, level, audience, i18n.language);
  const levelLabels = getLocalizedLevelLabels(i18n.language);
  const levelInfo = levelLabels[level];

  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{value.toFixed(1)}</span>
      </div>
      <Slider 
        value={[value]} 
        onValueChange={([v]) => onChange(v)} 
        min={1} 
        max={5} 
        step={0.1} 
      />
      <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            level === 'high' ? 'bg-success/20 text-success' : 
            level === 'medium' ? 'bg-cta/20 text-cta' : 
            'bg-destructive/20 text-destructive'
          }`}>
            {levelInfo.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{feedback}</p>
      </div>
    </div>
  );
};
