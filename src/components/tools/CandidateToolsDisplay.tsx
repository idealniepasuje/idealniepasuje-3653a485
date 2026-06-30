import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import {
  TOOL_CATEGORIES,
  ToolEntry,
  ToolLevel,
  getToolName,
  toolLevelLabels,
  toolLevelOrder,
} from "@/data/tools";

interface Props {
  candidateTools: ToolEntry[];
  requiredTools?: ToolEntry[];
}

/**
 * Read-only side-by-side view used in EmployerCandidateDetail. Highlights:
 * - tools both sides have (with level match indicator),
 * - tools required by employer but missing from the candidate,
 * - extra tools the candidate has on top.
 */
export const CandidateToolsDisplay = ({ candidateTools, requiredTools = [] }: Props) => {
  const { i18n } = useTranslation();
  const lang: "pl" | "en" = i18n.language === "en" ? "en" : "pl";

  const candidateMap = new Map(candidateTools.map((t) => [t.tool_id, t.level]));
  const requiredMap = new Map(requiredTools.map((t) => [t.tool_id, t.level]));

  const allIds = Array.from(new Set([...candidateMap.keys(), ...requiredMap.keys()]));
  // group by category for stable display order
  const grouped: Record<string, string[]> = {};
  for (const cat of TOOL_CATEGORIES) {
    const ids = cat.tools.map((t) => t.id).filter((id) => allIds.includes(id));
    if (ids.length > 0) grouped[cat.id] = ids;
  }

  const labelStatus = (cand: ToolLevel | undefined, req: ToolLevel | undefined) => {
    if (req && !cand) return { tone: "missing" as const, text: lang === "pl" ? "Brak u kandydata" : "Missing" };
    if (cand && !req) return { tone: "extra" as const, text: lang === "pl" ? "Dodatkowe" : "Extra" };
    if (cand && req) {
      if (toolLevelOrder[cand] >= toolLevelOrder[req]) {
        return { tone: "match" as const, text: lang === "pl" ? "Spełnia wymóg" : "Meets requirement" };
      }
      return { tone: "below" as const, text: lang === "pl" ? "Poniżej wymogu" : "Below requirement" };
    }
    return null;
  };

  if (allIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {lang === "pl" ? "Brak danych o narzędziach." : "No tool data."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([catId, ids]) => {
        const cat = TOOL_CATEGORIES.find((c) => c.id === catId);
        if (!cat) return null;
        return (
          <div key={catId} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Wrench className="w-3 h-3" />
              {lang === "pl" ? cat.labelPl : cat.labelEn}
            </div>
            <div className="space-y-1.5">
              {ids.map((id) => {
                const cand = candidateMap.get(id);
                const req = requiredMap.get(id);
                const status = labelStatus(cand, req);
                const Icon = status?.tone === "missing" || status?.tone === "below"
                  ? AlertCircle
                  : status?.tone === "extra"
                    ? MinusCircle
                    : CheckCircle2;
                const iconColor = status?.tone === "missing" || status?.tone === "below"
                  ? "text-destructive"
                  : status?.tone === "extra"
                    ? "text-muted-foreground"
                    : "text-success";
                return (
                  <div key={id} className="flex items-center gap-3 p-2 rounded-lg border bg-background">
                    <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                    <span className="text-sm font-medium flex-1">{getToolName(id)}</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {req && (
                        <span>
                          {lang === "pl" ? "Wymagany" : "Required"}: <strong className="text-foreground">{toolLevelLabels[lang][req]}</strong>
                        </span>
                      )}
                      {cand && (
                        <span>
                          {lang === "pl" ? "Kandydat" : "Candidate"}: <strong className="text-foreground">{toolLevelLabels[lang][cand]}</strong>
                        </span>
                      )}
                      {status && (
                        <Badge
                          variant="outline"
                          className={
                            status.tone === "match" ? "border-success/40 text-success" :
                            status.tone === "below" || status.tone === "missing" ? "border-destructive/40 text-destructive" :
                            ""
                          }
                        >
                          {status.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
