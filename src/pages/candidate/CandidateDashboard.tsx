import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Brain,
  Lightbulb,
  Target,
  RefreshCw,
  Users,
  ChevronRight,
  CheckCircle2,
  Clock,
  Play,
  Building2,
  ClipboardList,
  Heart,
  Briefcase,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedCompetencyTests } from "@/data/competencyQuestions";
import { logError } from "@/lib/errorLogger";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { CandidateSidebar } from "@/components/layouts/CandidateSidebar";
import { EmployerCard } from "@/components/match/EmployerCard";
import { FeedbackModal } from "@/components/FeedbackModal";
import { CandidateMessagesInbox } from "@/components/CandidateMessagesInbox";
import { isEligibleForExternalMatching } from "@/lib/candidate-marketplace-eligibility";

interface PendingInvitation {
  id: string;
  token: string;
  organization_id: string;
  organizations: { name: string } | null;
}

const CandidateDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [testResults, setTestResults] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [employers, setEmployers] = useState<Record<string, any>>({});
  const [offersById, setOffersById] = useState<Record<string, any>>({});
  const [hasFeedback, setHasFeedback] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [loading, setLoading] = useState(true);

  const competencyTests = getLocalizedCompetencyTests(i18n.language);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchTestResults();
      fetchMatches();
      fetchPendingInvitations();
    }
  }, [user, authLoading, navigate]);

  const fetchTestResults = async () => {
    if (!user) return;

    try {
      const { data: feedbackData } = await supabase
        .from("candidate_feedback")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      setHasFeedback(!!(feedbackData && feedbackData.length > 0));

      const { data, error } = await supabase
        .from("candidate_test_results")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logError("CandidateDashboard.fetchTestResults", error);
      }

      setTestResults(data);
    } catch (error) {
      logError("CandidateDashboard.fetchTestResults", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("id, token, organization_id, organizations(name)")
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString());

      if (error) throw error;

      setPendingInvitations((data || []) as PendingInvitation[]);
    } catch (error) {
      logError("CandidateDashboard.fetchPendingInvitations", error);
    }
  };

  const fetchMatches = async () => {
    if (!user) return;

    try {
      const { data: matchData, error: matchError } = await supabase
        .from("match_results")
        .select("*")
        .eq("candidate_user_id", user.id)
        .order("overall_percent", { ascending: false });

      if (matchError) {
        logError("CandidateDashboard.fetchMatches", matchError);
        return;
      }

      setMatches(matchData || []);

      if (matchData && matchData.length > 0) {
        const employerIds = Array.from(
          new Set(matchData.map((m) => m.employer_user_id).filter(Boolean)),
        );

        const offerIds = Array.from(
          new Set(matchData.map((m) => m.job_offer_id).filter(Boolean)),
        ) as string[];

        const [employerResult, offerResult] = await Promise.all([
          supabase
            .from("employer_profiles")
            .select("user_id, company_name, industry, role_description")
            .in("user_id", employerIds),

          offerIds.length > 0
            ? supabase
                .from("job_offers")
                .select(
                  "id, title, company_name, industry, work_mode, city, position_level, required_experience",
                )
                .in("id", offerIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (!employerResult.error && employerResult.data) {
          const employerMap: Record<string, any> = {};

          employerResult.data.forEach((emp) => {
            employerMap[emp.user_id] = emp;
          });

          setEmployers(employerMap);
        }

        if (!offerResult.error && offerResult.data) {
          const offerMap: Record<string, any> = {};

          (offerResult.data as any[]).forEach((offer: any) => {
            offerMap[offer.id] = offer;
          });

          setOffersById(offerMap);
        }
      }
    } catch (error) {
      logError("CandidateDashboard.fetchMatches", error);
    }
  };

  const getTestStatus = (competencyCode: string) => {
    if (!testResults?.competency_answers) return "not_started";

    const answers = testResults.competency_answers[competencyCode];

    if (!answers) return "not_started";

    const questionCount =
      competencyTests[
        competencyCode as keyof typeof competencyTests
      ]?.questionCount || 0;

    const answeredCount = Object.keys(answers).length;

    if (answeredCount === 0) return "not_started";
    if (answeredCount >= questionCount) return "completed";

    return "in_progress";
  };

  const getTestProgress = (competencyCode: string) => {
    if (!testResults?.competency_answers) return 0;

    const answers = testResults.competency_answers[competencyCode];

    if (!answers) return 0;

    const questionCount =
      competencyTests[
        competencyCode as keyof typeof competencyTests
      ]?.questionCount || 1;

    return Math.round((Object.keys(answers).length / questionCount) * 100);
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      MessageSquare,
      Brain,
      Lightbulb,
      Target,
      RefreshCw,
    };

    return icons[iconName] || MessageSquare;
  };

  const allCompetencyTestsCompleted = Object.keys(competencyTests).every(
    (code) => getTestStatus(code) === "completed",
  );

  const cultureTestCompleted =
    testResults?.culture_test_completed || false;

  const additionalCompleted =
    testResults?.additional_completed || false;

  const requirementsVersion =
    testResults?.profile_requirements_version ?? 1;

  const matchingRequirementsMet =
    requirementsVersion <= 1
      ? testResults?.all_tests_completed === true
      : testResults?.profile_ready === true;

  const marketplaceEligible = testResults
    ? isEligibleForExternalMatching(testResults)
    : false;

  if (authLoading || loading) {
    return (
      <DashboardLayout sidebar={<CandidateSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  const externalOffersDisabled =
    testResults?.open_to_external_offers === false;

  const visibleMatches = externalOffersDisabled ? [] : matches;

  return (
    <DashboardLayout sidebar={<CandidateSidebar />}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Cześć 👋</h1>
        <p className="text-muted-foreground">
          {t("candidate.dashboard.introSubtitle")}
        </p>
      </div>

      <CandidateMessagesInbox />

      {pendingInvitations.length > 0 && (
        <Card className="mb-8 border-accent/40 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-accent" />
              </div>

              <div className="flex-1 w-full">
                <h2 className="text-lg font-semibold mb-1">
                  {pendingInvitations.length === 1
                    ? "Masz zaproszenie do organizacji"
                    : `Masz ${pendingInvitations.length} oczekujących zaproszeń do organizacji`}
                </h2>

                {pendingInvitations.length === 1 &&
                  pendingInvitations[0].organizations?.name && (
                    <p className="text-sm text-muted-foreground">
                      {pendingInvitations[0].organizations.name}
                    </p>
                  )}
              </div>

              <Link
                to={
                  pendingInvitations.length === 1
                    ? `/candidate/organizations?invite=${pendingInvitations[0].token}`
                    : "/candidate/organizations"
                }
              >
                <Button size="sm" className="gap-2 shrink-0">
                  {pendingInvitations.length === 1
                    ? "Zobacz zaproszenie"
                    : "Zobacz zaproszenia"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!matchingRequirementsMet && (
        <Card className="mb-8 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-cta via-cta/90 to-accent/80">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-primary-foreground mb-2">
                  {t("candidate.dashboard.introTitle")}
                </h2>

                <p className="text-primary-foreground/90 text-sm mb-3 leading-relaxed">
                  {t("candidate.dashboard.introGreetingShort")}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-medium">
                    <ClipboardList className="w-3 h-3" />
                    {t("candidate.dashboard.introBadge1")}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-medium">
                    <Heart className="w-3 h-3" />
                    {t("candidate.dashboard.introBadge2")}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-medium">
                    <Briefcase className="w-3 h-3" />
                    {t("candidate.dashboard.introBadge3")}
                  </span>
                </div>

                <p className="text-xs text-primary-foreground/90 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {t("candidate.dashboard.introReminderShort")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {matchingRequirementsMet && (
        <Card className="mb-8 overflow-hidden border-0 shadow-xl bg-gradient-to-r from-accent via-accent/90 to-primary/80">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <PartyPopper className="w-6 h-6 text-primary-foreground" />
              </div>

              <div className="flex-1 min-w-0 text-primary-foreground">
                <h2 className="text-lg font-bold mb-2">
                  {t("candidate.dashboard.profileCompleteTitle")}
                </h2>

                <p className="text-sm mb-3 opacity-95">
                  {t("candidate.dashboard.profileCompleteDescription")}
                </p>

                <div className="space-y-1.5 text-sm opacity-90 mb-4">
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    {marketplaceEligible
                      ? t("candidate.dashboard.profileCompleteMatch")
                      : t(
                          "candidate.dashboard.externalDisabled",
                          "Propozycje z rynku pracy są wyłączone w Twoim profilu",
                        )}
                  </p>
                </div>

                {!hasFeedback && (
                  <Link to="/candidate/feedback">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 backdrop-blur-sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t("candidate.dashboard.shareFeedback")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8 border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
            </div>

            <div className="flex-1 w-full">
              <h2 className="text-lg font-semibold mb-1">
                {t("candidate.dashboard.profileTitle")}
              </h2>

              <p className="text-sm text-muted-foreground mb-2">
                {!allCompetencyTestsCompleted
                  ? t("candidate.dashboard.doCompetencyTests")
                  : !cultureTestCompleted
                    ? t("candidate.dashboard.doCultureTest")
                    : requirementsVersion >= 2 && !additionalCompleted
                      ? t("candidate.dashboard.doAdditionalQuestions")
                      : t("candidate.dashboard.allTestsCompleted")}
              </p>

              <Progress
                value={
                  matchingRequirementsMet
                    ? 100
                    : additionalCompleted
                      ? 90
                      : cultureTestCompleted
                        ? 70
                        : allCompetencyTestsCompleted
                          ? 50
                          : Object.keys(competencyTests).filter(
                              (code) =>
                                getTestStatus(code) === "completed",
                            ).length * 10
                }
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
            1
          </span>
          {t("candidate.dashboard.competencyTests")}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(competencyTests).map(([code, test]) => {
            const status = getTestStatus(code);
            const progress = getTestProgress(code);
            const IconComponent = getIconComponent(test.icon);

            return (
              <Card
                key={code}
                className="group hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-accent" />
                    </div>

                    <Badge
                      variant={
                        status === "completed"
                          ? "default"
                          : status === "in_progress"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        status === "completed" ? "bg-success" : ""
                      }
                    >
                      {status === "completed" && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}

                      {status === "in_progress" && (
                        <Clock className="w-3 h-3 mr-1" />
                      )}

                      {status === "completed"
                        ? t("common.completed")
                        : status === "in_progress"
                          ? t("common.inProgress")
                          : t("common.notStarted")}
                    </Badge>
                  </div>

                  <CardTitle className="text-lg">
                    {test.name}
                  </CardTitle>

                  <CardDescription>
                    {test.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.estimatedTime}
                    </span>

                    <span>
                      {test.questionCount} {t("common.questions")}
                    </span>
                  </div>

                  {status !== "not_started" && (
                    <Progress
                      value={progress}
                      className="h-2 mb-3"
                    />
                  )}

                  <Link to={`/candidate/test/competency/${code}`}>
                    <Button
                      className="w-full gap-2"
                      variant={
                        status === "completed" ? "outline" : "default"
                      }
                    >
                      {status === "completed" ? (
                        <>
                          {t("common.seeResults")}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      ) : status === "in_progress" ? (
                        <>
                          {t("common.continue")}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          {t("common.start")}
                          <Play className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              allCompetencyTestsCompleted
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </span>

          {t("candidate.dashboard.cultureTest")}
        </h2>

        <Card
          className={!allCompetencyTestsCompleted ? "opacity-60" : ""}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-cta/10 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-cta" />
                </div>

                <div>
                  <h3 className="font-semibold">
                    {t("candidate.dashboard.cultureTest")}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {t("candidate.dashboard.cultureTestDescription")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-16 sm:ml-0">
                <Badge
                  variant={
                    cultureTestCompleted ? "default" : "outline"
                  }
                  className={
                    cultureTestCompleted ? "bg-success" : ""
                  }
                >
                  {cultureTestCompleted
                    ? t("common.completed")
                    : t("common.toDo")}
                </Badge>

                <Link to="/candidate/test/culture">
                  <Button
                    disabled={!allCompetencyTestsCompleted}
                    className="gap-2"
                    size="sm"
                  >
                    {cultureTestCompleted
                      ? t("common.seeResults")
                      : t("common.start")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              cultureTestCompleted
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </span>

          {t("candidate.dashboard.additionalQuestions")}
        </h2>

        <Card className={!cultureTestCompleted ? "opacity-60" : ""}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-primary" />
                </div>

                <div>
                  <h3 className="font-semibold">
                    {t("candidate.dashboard.contextualData")}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {t(
                      "candidate.dashboard.contextualDataDescription",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-16 sm:ml-0">
                <Badge
                  variant={
                    additionalCompleted ? "default" : "outline"
                  }
                  className={
                    additionalCompleted ? "bg-success" : ""
                  }
                >
                  {additionalCompleted
                    ? t("common.completed")
                    : t("common.toDo")}
                </Badge>

                <Link to="/candidate/additional">
                  <Button
                    disabled={!cultureTestCompleted}
                    className="gap-2"
                    size="sm"
                  >
                    {additionalCompleted
                      ? t("common.edit")
                      : t("common.fill")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {matchingRequirementsMet && (
        <section>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                <CardTitle className="text-lg text-accent">
                  {t("candidate.dashboard.yourMatches")}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {externalOffersDisabled ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />

                  <p>
                    {t(
                      "candidate.dashboard.externalDisabled",
                      "Propozycje z rynku pracy są wyłączone w Twoim profilu",
                    )}
                  </p>

                  <Link
                    to="/candidate/profile"
                    className="inline-block mt-3"
                  >
                    <Button variant="outline" size="sm">
                      {t(
                        "candidate.dashboard.goToProfile",
                        "Przejdź do profilu",
                      )}
                    </Button>
                  </Link>
                </div>
              ) : visibleMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />

                  <p>
                    {t("candidate.dashboard.searchingMatches")}
                  </p>

                  <p className="text-sm mt-1">
                    {t(
                      "candidate.dashboard.searchingMatchesDescription",
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {visibleMatches.slice(0, 3).map((match) => {
                      const employer =
                        employers[match.employer_user_id];

                      return (
                        <EmployerCard
                          key={match.id}
                          match={match}
                          employer={employer}
                          jobOffer={
                            match.job_offer_id
                              ? offersById[match.job_offer_id]
                              : null
                          }
                        />
                      );
                    })}
                  </div>

                  <Link
                    to="/candidate/matches"
                    className="block text-center"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      {t("candidate.dashboard.viewMore")}
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      <FeedbackModal
        userType="candidate"
        isComplete={testResults?.all_tests_completed || false}
      />
    </DashboardLayout>
  );
};

export default CandidateDashboard;