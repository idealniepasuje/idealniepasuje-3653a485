import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Wrench } from "lucide-react";
import {
  TOOL_CATEGORIES,
  TOOL_LEVELS,
  ToolEntry,
  ToolLevel,
  toolLevelLabels,
} from "@/data/tools";

interface Props {
  value: ToolEntry[];
  onChange: (next: ToolEntry[]) => void;
  /** Label text above the section. */
  title?: string;
  /** Helper sentence under the title. */
  description?: string;
  /** When true, the level picker shows "required level" wording (employer side). */
  variant?: "candidate" | "employer";
}

export const ToolsSelector = ({ value, onChange, title, description, variant = "candidate" }: Props) => {
  const { i18n } = useTranslation();
  const lang: "pl" | "en" = i18n.language === "en" ? "en" : "pl";
  const [query, setQuery] = useState("");

  const selectedMap = useMemo(() => {
    const m = new Map<string, ToolLevel>();
    value.forEach((t) => m.set(t.tool_id, t.level));
    return m;
  }, [value]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOL_CATEGORIES;
    return TOOL_CATEGORIES
      .map((cat) => ({ ...cat, tools: cat.tools.filter((t) => t.name.toLowerCase().includes(q)) }))
      .filter((cat) => cat.tools.length > 0);
  }, [query]);

  const toggleTool = (toolId: string, checked: boolean) => {
    if (checked) {
      if (selectedMap.has(toolId)) return;
      onChange([...value, { tool_id: toolId, level: "intermediate" }]);
    } else {
      onChange(value.filter((t) => t.tool_id !== toolId));
    }
  };

  const setLevel = (toolId: string, level: ToolLevel) => {
    onChange(value.map((t) => (t.tool_id === toolId ? { ...t, level } : t)));
  };

  const fallbackTitle = lang === "pl"
    ? (variant === "employer" ? "Wymagane narzędzia" : "Znajomość narzędzi")
    : (variant === "employer" ? "Required tools" : "Tool proficiency");
  const fallbackDesc = lang === "pl"
    ? (variant === "employer"
        ? "Wybierz narzędzia, których oczekujesz od kandydata, i określ wymagany poziom."
        : "Wybierz narzędzia, z których korzystasz, i określ poziom znajomości.")
    : (variant === "employer"
        ? "Pick the tools you expect from candidates and the required proficiency."
        : "Pick the tools you use and your proficiency level.");

  const selectedCount = value.length;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Wrench className="w-5 h-5 text-accent mt-0.5 shrink-0" />
        <div className="flex-1">
          <Label className="text-base font-semibold">{title || fallbackTitle}</Label>
          <p className="text-xs text-muted-foreground mt-1">{description || fallbackDesc}</p>
        </div>
        {selectedCount > 0 && (
          <Badge variant="secondary">{selectedCount}</Badge>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "pl" ? "Szukaj narzędzia..." : "Search tools..."}
          className="pl-9"
        />
      </div>

      {filteredCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {lang === "pl" ? "Brak narzędzi pasujących do wyszukiwania." : "No tools match your search."}
        </p>
      ) : (
        <Accordion type="multiple" className="w-full">
          {filteredCategories.map((cat) => {
            const categoryLabel = lang === "pl" ? cat.labelPl : cat.labelEn;
            const selectedInCat = cat.tools.filter((t) => selectedMap.has(t.id)).length;
            return (
              <AccordionItem key={cat.id} value={cat.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-left">{categoryLabel}</span>
                    {selectedInCat > 0 && (
                      <Badge variant="outline" className="text-xs">{selectedInCat}</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {cat.tools.map((tool) => {
                      const isSelected = selectedMap.has(tool.id);
                      const currentLevel = selectedMap.get(tool.id) || "intermediate";
                      return (
                        <div
                          key={tool.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border ${isSelected ? "bg-accent/5 border-accent/30" : "border-transparent"}`}
                        >
                          <Checkbox
                            id={`tool-${tool.id}`}
                            checked={isSelected}
                            onCheckedChange={(c) => toggleTool(tool.id, !!c)}
                          />
                          <Label htmlFor={`tool-${tool.id}`} className="cursor-pointer flex-1 text-sm">
                            {tool.name}
                          </Label>
                          {isSelected && (
                            <Select value={currentLevel} onValueChange={(v) => setLevel(tool.id, v as ToolLevel)}>
                              <SelectTrigger className="w-44 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TOOL_LEVELS.map((lv) => (
                                  <SelectItem key={lv} value={lv}>
                                    {toolLevelLabels[lang][lv]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};
