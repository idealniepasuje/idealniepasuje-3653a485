import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Bookmark, Brain, Heart, Building } from "lucide-react";
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
        <div className="flex items-center justify-between gap-4">
          {/* Left side - all info */}
          <div className="min-w-0 flex-1">
            {/* Status badges row */}
            {(isBestMatch || isNewTalent || match.status === 'viewed' || isConsidering) && (
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
                {isConsidering && (
                  <Bookmark className="w-4 h-4 fill-accent text-accent" />
                )}
              </div>
            )}
            
            {/* Candidate ID */}
            <h3 className="font-semibold text-xl text-foreground">
              {t("employer.candidates.candidateNumber")} #{match.candidate_user_id.slice(0, 8)}
            </h3>
            
            {/* Industry/Position info */}
            {candidateData?.industry && (
              <p className="text-muted-foreground mb-2">
                {candidateData.industry}
              </p>
            )}
            
            {/* Competence, culture & additional badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <Brain className="w-3 h-3" />
                {t("common.competencies")}: {match.competence_percent || 0}%
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Heart className="w-3 h-3" />
                {t("common.culture")}: {match.culture_percent || 0}%
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Building className="w-3 h-3" />
                {t("common.additional")}: {match.extra_percent || 0}%
              </Badge>
            </div>
          </div>

          {/* Right side - match score and button */}
          <div className="flex flex-col items-end gap-2 shrink-0">
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