import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityCombobox } from "@/components/CityCombobox";
import { Badge } from "@/components/ui/badge";
import { Laptop, Building2, ArrowLeftRight } from "lucide-react";

interface WorkModeSelectorProps {
  workMode: string;
  city: string;
  onWorkModeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  required?: boolean;
}

export const WorkModeSelector = ({ workMode, city, onWorkModeChange, onCityChange, required }: WorkModeSelectorProps) => {
  const { t } = useTranslation();

  const showCity = workMode === "hybrid" || workMode === "onsite";

  return (
    <div className="space-y-3">
      <Label>{t("common.workMode")} {required && <span className="text-destructive">*</span>}</Label>
      <Select value={workMode} onValueChange={onWorkModeChange}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder={t("common.selectWorkMode")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="remote">
            <span className="flex items-center gap-2"><Laptop className="w-4 h-4" />{t("common.remote")}</span>
          </SelectItem>
          <SelectItem value="hybrid">
            <span className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" />{t("common.hybrid")}</span>
          </SelectItem>
          <SelectItem value="onsite">
            <span className="flex items-center gap-2"><Building2 className="w-4 h-4" />{t("common.onsite")}</span>
          </SelectItem>
        </SelectContent>
      </Select>

      {showCity && (
        <div className="space-y-2">
          <Label>{t("common.city")} <span className="text-destructive">*</span></Label>
          <CityCombobox value={city} onChange={onCityChange} />
        </div>
      )}
    </div>
  );
};

export const WorkModeBadge = ({ workMode, city }: { workMode?: string; city?: string }) => {
  const { t } = useTranslation();
  if (!workMode) return null;

  const Icon = workMode === "remote" ? Laptop : workMode === "hybrid" ? ArrowLeftRight : Building2;
  const label = t(`common.${workMode}`);
  const cityText = (workMode === "hybrid" || workMode === "onsite") && city ? ` • ${city}` : "";

  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <Icon className="w-3 h-3" />
      {label}{cityText}
    </Badge>
  );
};
