import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Eye, Clock } from "lucide-react";

export type MatchStatus = 'pending' | 'viewed' | 'considering' | 'rejected';

interface MatchStatusBadgeProps {
  status: MatchStatus;
  perspective: 'candidate' | 'employer';
  className?: string;
}

export const MatchStatusBadge = ({ status, perspective, className }: MatchStatusBadgeProps) => {
  const { t } = useTranslation();

  // For candidate perspective - show what employer did
  if (perspective === 'candidate') {
    switch (status) {
      case 'considering':
        return (
          <Badge className={`bg-success text-success-foreground gap-1 ${className}`}>
            <ThumbsUp className="w-3 h-3" />
            {t("match.status.employerInterested")}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className={`gap-1 ${className}`}>
            <ThumbsDown className="w-3 h-3" />
            {t("match.status.rejected")}
          </Badge>
        );
      case 'viewed':
        return (
          <Badge variant="secondary" className={`gap-1 ${className}`}>
            <Eye className="w-3 h-3" />
            {t("match.status.viewed")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className={`gap-1 ${className}`}>
            <Clock className="w-3 h-3" />
            {t("match.status.new")}
          </Badge>
        );
    }
  }

  // For employer perspective - show what they did
  switch (status) {
    case 'considering':
      return (
        <Badge className={`bg-success text-success-foreground gap-1 ${className}`}>
          <ThumbsUp className="w-3 h-3" />
          {t("match.status.interested")}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className={`gap-1 ${className}`}>
          <ThumbsDown className="w-3 h-3" />
          {t("match.status.rejected")}
        </Badge>
      );
    case 'viewed':
      return (
        <Badge variant="secondary" className={`gap-1 ${className}`}>
          <Eye className="w-3 h-3" />
          {t("match.status.viewed")}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`gap-1 ${className}`}>
          <Clock className="w-3 h-3" />
          {t("match.status.new")}
        </Badge>
      );
  }
};
