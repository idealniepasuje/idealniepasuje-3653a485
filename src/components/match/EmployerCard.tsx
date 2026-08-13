import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, Brain, Heart, Building } from "lucide-react";
import { MatchStatusBadge, MatchStatus } from "@/components/match/MatchStatusBadge";
import { WorkModeBadge } from "@/components/WorkModeSelector";

interface EmployerCardProps {
  match: {
    id: string;
    employer_user_id: string;
    job_offer_id?: string | null;
    overall_percent: number;
    competence_percent: number;
    culture_percent: number;
    extra_percent: number | null;
    status: string;
    created_at: string;
    insufficientData?: string;
    match_details?: {
      extraStatus?: string;
      matchStatus?: string;
      reliable?: boolean;
    };
  };
  /** General employer profile data (keyed by employer_user_id) */
  employer?: {
    company_name?: string | null;
    industry?: string | null;
    role_description?: string | null;
  };
  /** Offer-specific data for THIS match (keyed by job_offer_id) */
  jobOffer?: {
    id?: string;
    title?: string | null;
    company_name?: string | null;
    industry?: string | null;
    work_mode?: string | null;
    city?: string | null;
    position_level?: string | null;
    required_experience?: string | null;
  } | null;
}

export const EmployerCard = ({ match, employer, jobOffer }: EmployerCardProps) => {
  const { t } = useTranslation();
  const companyName = jobOffer?.company_name || employer?.company_name;
  const offerTitle = jobOffer?.title || undefined;
  // Industry/work mode/city must come from the offer bound to this match only.
  const industry = jobOffer?.industry || (match.job_offer_id ? null : employer?.industry);
  const workMode = jobOffer?.work_mode || null;
  const city = jobOffer?.city || null;

  const isRejected = match.status === 'rejected';
  const isBestMatch =
    match.overall_percent >= 80 &&
    !(
      match.match_details?.matchStatus === 'low_confidence' ||
      match.match_details?.reliable === false
    );
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left side - all info */}
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
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
              <h3 className="font-semibold text-lg sm:text-xl text-foreground">
                {companyName || t("candidate.matches.company")}
              </h3>
              
              {/* Offer title */}
              {offerTitle && (
                <p className="text-sm font-medium text-accent mb-1">{offerTitle}</p>
              )}
              
              {/* Industry */}
              {industry && (
                <p className="text-muted-foreground text-sm mb-2">
                  {industry}
                </p>
              )}
              
              {/* Work mode badge */}
              {workMode && (
                <div className="mb-2">
                  <WorkModeBadge workMode={workMode} city={city || undefined} />
                </div>
              )}


              {/* Competence, culture & additional badges */}
              <div className="flex flex-wrap gap-1.5">
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
                  {t("common.additional")}: {
                    match.match_details?.extraStatus === 'insufficient_data'
                      ? (match.insufficientData ?? t("common.noData"))
                      : match.extra_percent === null || match.extra_percent === undefined
                        ? '-'
                        : `${match.extra_percent}%`
                  }
                </Badge>
              </div>
            </div>
          </div>

          {/* Right side - match score and button */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 ml-16 sm:ml-0">
            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl font-bold text-accent">{match.overall_percent}%</span>
              <p className="text-xs text-muted-foreground">{t("common.match")}</p>
            </div>
            <Link to={`/candidate/match/${match.id}`}>
              <Button className="gap-2" size="sm">
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