import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, Target, Heart, Briefcase } from "lucide-react";
import { MatchStatusBadge, MatchStatus } from "@/components/match/MatchStatusBadge";

interface EmployerCardProps {
  match: {
    id: string;
    employer_user_id: string;
    overall_percent: number;
    competence_percent: number;
    culture_percent: number;
    extra_percent: number | null;
    status: string;
    created_at: string;
  };
  employer?: {
    company_name?: string;
    industry?: string;
    role_description?: string;
  };
}

export const EmployerCard = ({ match, employer }: EmployerCardProps) => {
  const { t } = useTranslation();
  const isRejected = match.status === 'rejected';
  
  // Generate a pseudo-random avatar color based on employer ID
  const getAvatarColor = (id: string) => {
    const colors = ['bg-accent/20', 'bg-cta/20', 'bg-primary/20', 'bg-success/20'];
    const index = parseInt(id.slice(0, 2), 16) % colors.length;
    return colors[index];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return t("match.timeAgo.justNow");
    if (diffHours < 24) return t("match.timeAgo.hoursAgo", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    return t("match.timeAgo.daysAgo", { count: diffDays });
  };

  // Truncate description
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <Card className={`hover:shadow-lg transition-all group ${isRejected ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full ${getAvatarColor(match.employer_user_id)} flex items-center justify-center shrink-0`}>
            <Building2 className="w-6 h-6 text-accent" />
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">
                    {employer?.company_name || t("candidate.matches.company")}
                  </h3>
                  {match.status && match.status !== 'pending' && (
                    <MatchStatusBadge status={match.status as MatchStatus} perspective="candidate" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatTimeAgo(match.created_at)}
                  {employer?.industry && ` • ${employer.industry}`}
                </p>
              </div>
              
              {/* Match percentage */}
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold text-accent">{match.overall_percent}%</div>
                <div className="text-xs text-muted-foreground">{t("common.match")}</div>
              </div>
            </div>

            {/* Description preview */}
            {employer?.role_description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {truncateText(employer.role_description, 120)}
              </p>
            )}

            {/* Tags/Badges row */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Target className="w-3 h-3" />
                {t("common.competencies")}: {match.competence_percent}%
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Heart className="w-3 h-3" />
                {t("common.culture")}: {match.culture_percent}%
              </Badge>
              {match.extra_percent !== null && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Briefcase className="w-3 h-3" />
                  {t("common.additional")}: {match.extra_percent}%
                </Badge>
              )}
            </div>

            {/* Action button */}
            <div className="flex justify-end">
              <Link to={`/candidate/employer/${match.employer_user_id}`}>
                <Button size="sm" className="gap-2">
                  {t("common.viewDetails")}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
