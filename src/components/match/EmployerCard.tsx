import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, Brain, Heart, Building } from "lucide-react";
import { MatchStatusBadge, MatchStatus } from "@/components/match/MatchStatusBadge";

interface EmployerCardProps {
  match: {
    id: string;
    employer_user_id: string;
    job_offer_id?: string;
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
  offerTitle?: string;
}

export const EmployerCard = ({ match, employer, offerTitle }: EmployerCardProps) => {
  const { t } = useTranslation();
  const isRejected = match.status === 'rejected';
  const isBestMatch = match.overall_percent >= 80;
  const isEmployerInterested = match.status === 'considering';
  
  const getAvatarColor = (id: string) => {
    const colors = ['bg-purple-100', 'bg-orange-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100'];
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
    <Card className={`hover:shadow-lg transition-all ${isRejected ? 'opacity-60' : ''} ${isBestMatch ? 'border-accent/50 bg-accent/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - all info */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full ${getAvatarColor(match.employer_user_id)} flex items-center justify-center shrink-0`}>
              <Building2 className="w-6 h-6 text-accent" />
            </div>
            
            {/* Content - vertical layout */}
            <div className="min-w-0 flex-1">
              {/* Status badges row */}
              {(isBestMatch || isEmployerInterested || match.status === 'viewed') && (
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {isBestMatch && (
                    <Badge className="bg-accent text-accent-foreground text-xs">
                      Best match
                    </Badge>
                  )}
                  {isEmployerInterested && (
                    <MatchStatusBadge status="considering" perspective="candidate" />
                  )}
                  {match.status === 'viewed' && (
                    <MatchStatusBadge status="viewed" perspective="candidate" />
                  )}
                </div>
              )}
              
              {/* Company name */}
              <h3 className="font-semibold text-xl text-foreground">
                {employer?.company_name || t("candidate.matches.company")}
              </h3>
              
              {/* Offer title */}
              {offerTitle && (
                <p className="text-sm font-medium text-accent mb-1">{offerTitle}</p>
              )}
              
              {/* Industry */}
              {employer?.industry && (
                <p className="text-muted-foreground mb-2">
                  {employer.industry}
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
          </div>

          {/* Right side - match score and button */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <span className="text-3xl font-bold text-accent">{match.overall_percent}%</span>
              <p className="text-xs text-muted-foreground">{t("common.match")}</p>
            </div>
            <Link to={`/candidate/match/${match.id}`}>
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