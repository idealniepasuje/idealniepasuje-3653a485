import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Clock, Bookmark, Brain, Heart } from "lucide-react";
import { MatchStatusBadge } from "@/components/match/MatchStatusBadge";

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
    job_offer_id?: string;
  };
  candidateData?: {
    industry?: string;
    position_level?: string;
  };
  offerTitle?: string;
}

export const CandidateCard = ({ match, candidateData, offerTitle }: CandidateCardProps) => {
  const { t } = useTranslation();
  const isRejected = match.status === 'rejected';
  const isBestMatch = match.overall_percent >= 80;
  const isNewTalent = match.status === 'pending';
  const isConsidering = match.status === 'considering';

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
    <Card className={`hover:shadow-lg transition-all ${isRejected ? 'opacity-60' : ''} ${isBestMatch ? 'border-accent/50 bg-accent/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isBestMatch && (
                <Badge className="bg-accent text-accent-foreground text-xs">
                  Best match
                </Badge>
              )}
              {isNewTalent && !isBestMatch && (
                <Badge variant="secondary" className="bg-cta/20 text-cta text-xs">
                  {t("match.status.new")}
                </Badge>
              )}
              {match.status === 'viewed' && (
                <MatchStatusBadge status="viewed" perspective="employer" />
              )}
              {isConsidering && (
                <MatchStatusBadge status="considering" perspective="employer" />
              )}
            </div>
            <h3 className="font-semibold text-lg">
              {t("employer.candidates.candidateNumber")} #{match.candidate_user_id.slice(0, 8)}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(match.created_at)}
            </p>
          </div>
          
          {isConsidering && (
            <div className="p-2">
              <Bookmark className="w-5 h-5 fill-accent text-accent" />
            </div>
          )}
        </div>

        {/* Match breakdown and action */}
        <div className="flex items-end justify-between pt-3 border-t">
          {/* Left side - competence & culture badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <Brain className="w-3 h-3" />
              {t("common.competencies")}: {match.competence_percent || 0}%
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <Heart className="w-3 h-3" />
              {t("common.culture")}: {match.culture_percent || 0}%
            </Badge>
          </div>

          {/* Right side - match score and button */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <span className="text-3xl font-bold text-accent">{match.overall_percent}%</span>
              <p className="text-xs text-muted-foreground">{t("common.match")}</p>
            </div>
            <Link to={`/employer/candidate/${match.candidate_user_id}`}>
              <Button className="gap-2">
                {t("common.viewProfile")}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};