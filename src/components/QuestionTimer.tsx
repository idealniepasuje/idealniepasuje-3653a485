import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionTimerProps {
  timeLeft: number;
  progress: number;
}

export const QuestionTimer = ({ timeLeft, progress }: QuestionTimerProps) => {
  const isLow = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear rounded-full",
            isCritical
              ? "bg-destructive"
              : isLow
              ? "bg-cta"
              : "bg-accent"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-sm font-medium min-w-[60px] justify-end",
          isCritical
            ? "text-destructive animate-pulse"
            : isLow
            ? "text-cta"
            : "text-muted-foreground"
        )}
      >
        <Timer className="w-4 h-4" />
        <span>{timeLeft}s</span>
      </div>
    </div>
  );
};
