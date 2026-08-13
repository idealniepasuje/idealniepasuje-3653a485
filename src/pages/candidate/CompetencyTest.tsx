import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLocalizedCompetencyTests, getLocalizedQuestionsByCompetency, getNonAprobataQuestions, getAprobataQuestions } from "@/data/competencyQuestions";
import { getLocalizedData, agreementScale } from "@/data/additionalQuestions";
import { getLevel, getLocalizedLevelLabels } from "@/data/feedbackData";
import { CompetencyScoreWithFeedback } from "@/components/CompetencyScoreWithFeedback";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { QuestionTimer } from "@/components/QuestionTimer";
import { logError } from "@/lib/errorLogger";

const CompetencyTest = () => {
  const { competencyCode } = useParams<{ competencyCode: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [averageScore, setAverageScore] = useState(0);

  const competencyTests = getLocalizedCompetencyTests(i18n.language);
  const localizedAgreementScale = getLocalizedData(agreementScale, i18n.language);
  const questions = competencyCode ? getLocalizedQuestionsByCompetency(competencyCode, i18n.language) : [];
  const testInfo = competencyCode ? competencyTests[competencyCode as keyof typeof competencyTests] : null;

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user && competencyCode) fetchExistingAnswers();
  }, [user, authLoading, competencyCode, navigate]);

  const fetchExistingAnswers = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("candidate_test_results").select("competency_answers").eq("user_id", user.id).single();
      if (error && error.code !== "PGRST116") logError("CompetencyTest.fetchExistingAnswers", error);
      if (data?.competency_answers && competencyCode) {
        const existingAnswers = data.competency_answers[competencyCode] || {};
        setAnswers(existingAnswers);
        if (Object.keys(existingAnswers).length >= questions.length) calculateAndShowResults(existingAnswers);
      }
      setTestResults(data);
    } catch (error) {
      logError("CompetencyTest.fetchExistingAnswers", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAndShowResults = (answerData: Record<string, number>) => {
    if (!competencyCode) return;
    // Calculate overall score EXCLUDING aprobata questions
    const nonAprobataQs = getNonAprobataQuestions(competencyCode);
    let sum = 0, count = 0;
    nonAprobataQs.forEach(q => {
      if (answerData[q.id] !== undefined) {
        const value = q.reversed ? (6 - answerData[q.id]) : answerData[q.id];
        sum += value;
        count++;
      }
    });
    const mainScore = count > 0 ? sum / count : 0;
    setAverageScore(mainScore);

    // Save the computed score to DB
    void saveCompetencyScore(mainScore);

    setShowResults(true);
  };

  const saveCompetencyScore = async (score: number): Promise<boolean> => {
    if (!user || !competencyCode) return false;
    const scoreColumn = `${competencyCode}_score`;
    try {
      const { error } = await supabase.from("candidate_test_results").update({
        [scoreColumn]: score,
      }).eq("user_id", user.id);
      if (error) throw error;
      return true;
    } catch (error) {
      logError("CompetencyTest.saveCompetencyScore", error);
      toast.error(t("errors.saveProgressError"));
      return false;
    }
  };

  const handleAnswer = (value: number) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Accepts an explicit answers snapshot so callers never rely on stale state.
  const saveProgress = async (answersToSave: Record<string, number>): Promise<boolean> => {
    if (!user || !competencyCode) return false;
    setSaving(true);
    try {
      const { data: currentData, error: fetchError } = await supabase.from("candidate_test_results").select("competency_answers").eq("user_id", user.id).single();
      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
      const existingAnswers = (currentData?.competency_answers as Record<string, Record<string, number>> | null) || {};
      const updatedAnswers = { ...existingAnswers, [competencyCode]: answersToSave };
      const { error } = await supabase.from("candidate_test_results").update({ competency_answers: updatedAnswers }).eq("user_id", user.id);
      if (error) throw error;
      return true;
    } catch (error) {
      logError("CompetencyTest.saveProgress", error);
      toast.error(t("errors.saveProgressError"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Guards against timeout + manual click firing at the same time.
  const advancingRef = useRef(false);

  const advance = useCallback(async (answersToUse: Record<string, number>) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      const isLast = currentQuestionIndex >= questions.length - 1;
      if (!isLast) {
        setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1));
        await saveProgress(answersToUse);
      } else {
        const ok = await saveProgress(answersToUse);
        if (!ok) return;
        calculateAndShowResults(answersToUse);
        toast.success(t("candidate.test.testCompletedMessage"));
      }
    } finally {
      advancingRef.current = false;
    }
  }, [currentQuestionIndex, questions.length, t]);

  const handleNext = useCallback(() => {
    void advance(answers);
  }, [advance, answers]);

  const handleTimeUp = useCallback(() => {
    if (advancingRef.current) return;
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    const nextAnswers = answers[currentQ.id] === undefined
      ? { ...answers, [currentQ.id]: 3 }
      : answers;
    if (nextAnswers !== answers) setAnswers(nextAnswers);
    void advance(nextAnswers);
  }, [currentQuestionIndex, questions, answers, advance]);

  const { timeLeft, progress: timerProgress } = useQuestionTimer({
    duration: 25,
    onTimeUp: handleTimeUp,
    questionId: questions[currentQuestionIndex]?.id || "",
    enabled: !showResults && !loading && !authLoading,
  });

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
  };

  const handleSaveAndBack = async () => {
    const ok = await saveProgress(answers);
    if (ok) navigate("/candidate/dashboard");
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!testInfo || !competencyCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p>{t("candidate.test.testNotFound")}</p>
            <Link to="/candidate/dashboard"><Button className="mt-4">{t("common.backToPanel")}</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const level = getLevel(averageScore);
  const levelLabels = getLocalizedLevelLabels(i18n.language);

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-4">
            <Link to="/candidate/dashboard" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
              <ArrowLeft className="w-4 h-4" />{t("common.backToPanel")}
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-success/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">{t("candidate.test.testCompleted")}</CardTitle>
              <CardDescription>{testInfo.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-lg font-medium capitalize">
                  {t("candidate.test.level")}: <span className={`${level === 'high' ? 'text-success' : level === 'medium' ? 'text-cta' : 'text-destructive'}`}>
                    {level === 'high' ? t("candidate.test.levelHigh") : level === 'medium' ? t("candidate.test.levelMedium") : t("candidate.test.levelLow")}
                  </span>
                </div>
              </div>
              <CompetencyScoreWithFeedback
                competencyCode={competencyCode}
                competencyName={testInfo.name}
                score={averageScore}
                audience="candidate"
              />
              <div className="bg-accent/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">{t("candidate.test.resultReminder")}</p>
              </div>
              <Link to="/candidate/dashboard">
                <Button className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
                  {t("candidate.test.continueToNextTest")}<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleSaveAndBack} disabled={saving} className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground disabled:opacity-60">
              <ArrowLeft className="w-4 h-4" />{t("common.saveAndBack")}
            </button>
            <span className="text-sm text-primary-foreground/80">{t("common.question")} {currentQuestionIndex + 1} {t("common.of")} {questions.length}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{testInfo.name}</h1>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <div className="mb-4"><QuestionTimer timeLeft={timeLeft} progress={timerProgress} /></div>
            <CardDescription className="text-xs text-muted-foreground mb-2">{t("candidate.test.rateStatement")}</CardDescription>
            <CardTitle className="text-lg leading-relaxed">{currentQuestion.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={answers[currentQuestion.id]?.toString() || ""} onValueChange={(value) => handleAnswer(parseInt(value))} className="space-y-3">
              {localizedAgreementScale.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`option-${option.value}`}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer min-h-[52px] ${
                    answers[currentQuestion.id] === option.value
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                  <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer text-base">{option.label}</Label>
                </label>
              ))}
            </RadioGroup>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />{t("common.previous")}
              </Button>
              <Button onClick={handleNext} disabled={answers[currentQuestion.id] === undefined || saving} className="bg-cta text-cta-foreground hover:bg-cta/90">
                {currentQuestionIndex === questions.length - 1 ? t("common.finishTest") : t("common.next")}<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6">{t("candidate.test.answerHonestly")}</p>
      </main>
    </div>
  );
};

export default CompetencyTest;
