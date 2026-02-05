import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmployerSidebar } from "@/components/layouts/EmployerSidebar";
import { CandidateCard } from "@/components/match/CandidateCard";

const EmployerCandidates = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchMatches();
  }, [user, authLoading, navigate]);

  const fetchMatches = async () => {
    if (!user) return;
    try {
      const { data: matchData, error: matchError } = await supabase
        .from("match_results")
        .select("*")
        .eq("employer_user_id", user.id);
      
      if (matchError) {
        logError("EmployerCandidates.fetchMatches", matchError);
      } else {
        // Sort: rejected at bottom, then interested first, then by overall_percent descending
        const sorted = (matchData || []).sort((a, b) => {
          // Rejected always at bottom
          if (a.status === 'rejected' && b.status !== 'rejected') return 1;
          if (b.status === 'rejected' && a.status !== 'rejected') return -1;
          // Interested (considering) at top
          if (a.status === 'considering' && b.status !== 'considering') return -1;
          if (b.status === 'considering' && a.status !== 'considering') return 1;
          return (b.overall_percent || 0) - (a.overall_percent || 0);
        });
        setMatches(sorted);
      }
    } catch (error) {
      logError("EmployerCandidates.fetchMatches", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout sidebar={<EmployerSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<EmployerSidebar />}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("employer.candidates.title")}</h1>
        <p className="text-muted-foreground">{t("employer.candidates.subtitle")}</p>
      </div>

      <Card className="mb-8 border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center"><Users className="w-8 h-8 text-accent" /></div>
            <div>
              <h2 className="text-2xl font-bold">{matches.length}</h2>
              <p className="text-muted-foreground">
                {matches.length === 0 && t("common.noMatchedCandidates")}
                {matches.length === 1 && t("common.matchedCandidate")}
                {matches.length > 1 && t("common.matchedCandidates")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {matches.length === 0 ? (
        <Card className="border-muted">
          <CardContent className="pt-6 text-center py-16">
            <div className="w-16 h-16 rounded-full bg-accent/20 mx-auto mb-6 flex items-center justify-center opacity-50"><Users className="w-8 h-8 text-accent" /></div>
            <h3 className="text-xl font-semibold mb-3">{t("employer.candidates.searchingTitle")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">{t("employer.candidates.searchingDescription")}</p>
            <Link to="/employer/dashboard"><Button variant="outline">{t("common.backToPanel")}</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <CandidateCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployerCandidates;
