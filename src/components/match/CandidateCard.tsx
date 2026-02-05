import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, Target, Heart, Briefcase } from "lucide-react";
import { MatchStatusBadge, MatchStatus } from "@/components/match/MatchStatusBadge";

interface CandidateCardProps {
  match: {
    id: string;
    candidate_user_id: string;
    overall_percent: number;
    competence_percent: number;
    culture_percent: number;
    extra_percent: number | null;
    status: string;
    created_at: string;
  };
  candidateData?: {
    industry?: string;
    position_level?: string;
  };
}

export const CandidateCard = ({ match, candidateData }: CandidateCardProps) => {
  const { t } = useTranslation();
  const isRejected = match.status === 'rejected';
  
  // Generate a pseudo-random avatar color based on candidate ID
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

  return (
    <Card className={`hover:shadow-lg transition-all group ${isRejected ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full ${getAvatarColor(match.candidate_user_id)} flex items-center justify-center shrink-0`}>
            <Users className="w-6 h-6 text-accent" />
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">
                    {t("employer.candidates.candidateNumber")} #{match.candidate_user_id.slice(0, 8)}
                  </h3>
                  {match.status && match.status !== 'pending' && (
                    <MatchStatusBadge status={match.status as MatchStatus} perspective="employer" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatTimeAgo(match.created_at)}
                </p>
              </div>
              
              {/* Match percentage */}
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold text-accent">{match.overall_percent}%</div>
                <div className="text-xs text-muted-foreground">{t("common.match")}</div>
              </div>
            </div>

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
              {candidateData?.industry && (
                <Badge variant="outline" className="text-xs">{candidateData.industry}</Badge>
              )}
              {candidateData?.position_level && (
                <Badge variant="outline" className="text-xs">{candidateData.position_level}</Badge>
              )}
            </div>

            {/* Action button */}
            <div className="flex justify-end">
              <Link to={`/employer/candidate/${match.candidate_user_id}`}>
                <Button size="sm" className="gap-2">
                  {t("common.viewProfile")}
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
