import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, X } from "lucide-react";
import { polishCities } from "@/data/polishCities";
import { cn } from "@/lib/utils";

interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const CityCombobox = ({ value, onChange, disabled, placeholder }: CityComboboxProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return polishCities.slice(0, 20);
    const q = query.toLowerCase();
    return polishCities.filter(c => c.toLowerCase().includes(q)).slice(0, 20);
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || t("common.selectCity")}
          disabled={disabled}
          className="pl-9 pr-8 h-11"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setQuery(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md">
          <ScrollArea className="max-h-[200px]">
            {filtered.map((city) => (
              <button
                key={city}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2.5 text-sm hover:bg-accent/10 transition-colors",
                  city === value && "bg-accent/10 font-medium"
                )}
                onClick={() => {
                  onChange(city);
                  setQuery(city);
                  setOpen(false);
                }}
              >
                {city}
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
