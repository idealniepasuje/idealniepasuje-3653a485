import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { CandidateSidebar } from "@/components/layouts/CandidateSidebar";
import { EmployerCard } from "@/components/match/EmployerCard";

const CandidateMatches = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<any[]>([]);
  const [employers, setEmployers] = useState<Record<string, any>>({});
  const [offerTitles, setOfferTitles] = useState<Record<string, string>>({});
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
        .eq("candidate_user_id", user.id);
      
      if (matchError) {
        logError("CandidateMatches.fetchMatches", matchError);
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
        
        // Fetch employer profiles and job offer titles
        if (matchData && matchData.length > 0) {
          const employerIds = matchData.map(m => m.employer_user_id);
          const offerIds = matchData.map(m => m.job_offer_id).filter(Boolean);
          
          const [employerResult, offerResult] = await Promise.all([
            supabase
              .from("employer_profiles")
              .select("user_id, company_name, industry, role_description")
              .in("user_id", employerIds),
            offerIds.length > 0
              ? supabase.from("job_offers").select("id, title").in("id", offerIds)
              : Promise.resolve({ data: [], error: null })
          ]);
          
          if (!employerResult.error && employerResult.data) {
            const employerMap: Record<string, any> = {};
            employerResult.data.forEach(emp => {
              employerMap[emp.user_id] = emp;
            });
            setEmployers(employerMap);
          }
          
          if (!offerResult.error && offerResult.data) {
            const titleMap: Record<string, string> = {};
            (offerResult.data as any[]).forEach((o: any) => {
              titleMap[o.id] = o.title;
            });
            setOfferTitles(titleMap);
          }
        }
      }
    } catch (error) {
      logError("CandidateMatches.fetchMatches", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout sidebar={<CandidateSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<CandidateSidebar />}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("candidate.matches.title")}</h1>
        <p className="text-muted-foreground">{t("candidate.matches.subtitle")}</p>
      </div>

      <Card className="mb-8 border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center"><Building2 className="w-8 h-8 text-accent" /></div>
            <div>
              <h2 className="text-2xl font-bold">{matches.length}</h2>
              <p className="text-muted-foreground">
                {matches.length === 0 && t("candidate.matches.noMatches")}
                {matches.length === 1 && t("candidate.matches.oneMatch")}
                {matches.length > 1 && t("candidate.matches.multipleMatches")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {matches.length === 0 ? (
        <Card className="border-muted">
          <CardContent className="pt-6 text-center py-16">
            <div className="w-16 h-16 rounded-full bg-accent/20 mx-auto mb-6 flex items-center justify-center opacity-50"><Building2 className="w-8 h-8 text-accent" /></div>
            <h3 className="text-xl font-semibold mb-3">{t("candidate.matches.searchingTitle")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">{t("candidate.matches.searchingDescription")}</p>
            <Link to="/candidate/dashboard"><Button variant="outline">{t("common.backToPanel")}</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <EmployerCard 
              key={match.id} 
              match={match} 
              employer={employers[match.employer_user_id]}
              offerTitle={match.job_offer_id ? offerTitles[match.job_offer_id] : undefined}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CandidateMatches;
