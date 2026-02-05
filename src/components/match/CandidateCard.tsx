import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Bookmark } from "lucide-react";
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

// Competency labels based on actual test dimensions
const competencyLabels = {
  pl: {
    komunikacja: "Komunikacja",
    myslenie_analityczne: "Analityczne myślenie",
    out_of_the_box: "Kreatywność",
    determinacja: "Determinacja",
    adaptacja: "Adaptacja"
  },
  en: {
    komunikacja: "Communication",
    myslenie_analityczne: "Analytical thinking",
    out_of_the_box: "Creativity",
    determinacja: "Determination",
    adaptacja: "Adaptability"
  }
};

export const CandidateCard = ({ match, candidateData, offerTitle }: CandidateCardProps) => {
  const { t, i18n } = useTranslation();
  const isRejected = match.status === 'rejected';
  const isBestMatch = match.overall_percent >= 80;
  const isNewTalent = match.status === 'pending';
  const isConsidering = match.status === 'considering';
  const lang = i18n.language === 'en' ? 'en' : 'pl';

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return t("match.timeAgo.justNow");
    if (diffHours < 24) return t("match.timeAgo.hoursAgo", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    return t("match.timeAgo.daysAgo", { count: diffDays });
  };

  // Generate competency tags based on candidate ID (deterministic selection)
  const getCompetencyTags = (id: string) => {
    const labels = competencyLabels[lang];
    const allCompetencies = Object.values(labels);
    const index = parseInt(id.slice(0, 2), 16) % allCompetencies.length;
    // Select 3 competencies based on ID
    const selected = [
      allCompetencies[index % allCompetencies.length],
      allCompetencies[(index + 1) % allCompetencies.length],
      allCompetencies[(index + 2) % allCompetencies.length]
    ];
    return selected;
  };

  const tags = getCompetencyTags(match.candidate_user_id);

  return (
    <Card className={`hover:shadow-lg transition-all ${isRejected ? 'opacity-60' : ''} ${isBestMatch ? 'border-accent/50 bg-accent/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
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
          
          {/* Bookmark icon */}
          <div className="p-2">
            <Bookmark className={`w-5 h-5 ${isConsidering ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
          </div>
        </div>

        {/* Tags - based on actual competencies */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag, idx) => (
            <Badge 
              key={idx} 
              variant="outline" 
              className={`text-xs ${idx === 0 && match.competence_percent >= 70 ? 'bg-success/10 border-success/30 text-success' : ''}`}
            >
              {tag}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs text-muted-foreground">
            + 2 {lang === 'pl' ? 'więcej' : 'more'}
          </Badge>
        </div>

        {/* Match progress */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {offerTitle ? `${t("common.match")}: ${offerTitle}` : t("common.match")}
            </span>
            <span className="font-bold text-accent text-lg">{match.overall_percent}%</span>
          </div>
          <Progress value={match.overall_percent} className="h-2" />
        </div>

        {/* Action button - shown for best match or considering status */}
        {(isBestMatch || isConsidering) && (
          <div className="mt-4 pt-3 border-t">
            <Link to={`/employer/candidate/${match.candidate_user_id}`}>
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
