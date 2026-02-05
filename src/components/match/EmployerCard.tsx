import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building2, Clock, Bookmark } from "lucide-react";
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
  const isBestMatch = match.overall_percent >= 80;
  const isEmployerInterested = match.status === 'considering';
  
  // Generate a pseudo-random avatar color based on employer ID
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

  // Truncate description
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <Card className={`hover:shadow-lg transition-all ${isRejected ? 'opacity-60' : ''} ${isBestMatch ? 'border-accent/50 bg-accent/5' : ''}`}>
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
                <h3 className="font-semibold text-lg">
                  {employer?.company_name || t("candidate.matches.company")}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(match.created_at)}
                </p>
              </div>
              
              {/* Bookmark icon */}
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Bookmark className={`w-5 h-5 ${isEmployerInterested ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
              </button>
            </div>

            {/* Industry tag */}
            {employer?.industry && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge variant="outline" className="text-xs">
                  {employer.industry}
                </Badge>
              </div>
            )}

            {/* Match progress */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("common.match")}</span>
                <span className="font-bold text-accent text-lg">{match.overall_percent}%</span>
              </div>
              <Progress value={match.overall_percent} className="h-2" />
            </div>
          </div>
        </div>

        {/* Action button - always show for best match or employer interested */}
        {(isBestMatch || isEmployerInterested) && (
          <div className="mt-4 pt-3 border-t">
            <Link to={`/candidate/employer/${match.employer_user_id}`}>
              <Button className="w-full">
                {t("common.viewProfile")}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
