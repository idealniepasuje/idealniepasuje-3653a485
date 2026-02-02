import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { getLocalizedCultureQuestions, getLocalizedCultureDimensions } from "@/data/cultureQuestions";
import { getLocalizedData, agreementScale } from "@/data/additionalQuestions";
import { getLevel, getFeedback } from "@/data/feedbackData";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { QuestionTimer } from "@/components/QuestionTimer";
import { logError } from "@/lib/errorLogger";

const CultureTest = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dimensionScores, setDimensionScores] = useState<Record<string, number>>({});

  const cultureDimensions = getLocalizedCultureDimensions(i18n.language);
  const localizedAgreementScale = getLocalizedData(agreementScale, i18n.language);
  const questions = getLocalizedCultureQuestions(i18n.language);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchExistingAnswers();
  }, [user, authLoading, navigate]);

  const fetchExistingAnswers = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("candidate_test_results").select("culture_answers, culture_test_completed").eq("user_id", user.id).single();
      if (error && error.code !== "PGRST116") logError("CultureTest.fetchExistingAnswers", error);
      if (data?.culture_answers) {
        setAnswers(data.culture_answers as Record<string, number>);
        if (data.culture_test_completed) calculateAndShowResults(data.culture_answers as Record<string, number>);
      }
    } catch (error) {
      logError("CultureTest.fetchExistingAnswers", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAndShowResults = (answerData: Record<string, number>) => {
    const scores: Record<string, number> = {};
    Object.keys(cultureDimensions).forEach(dimCode => {
      const dimQuestions = questions.filter(q => q.dimensionCode === dimCode);
      let sum = 0, count = 0;
      dimQuestions.forEach(q => { if (answerData[q.id] !== undefined) { sum += answerData[q.id]; count++; } });
      scores[dimCode] = count > 0 ? sum / count : 0;
    });
    setDimensionScores(scores);
    setShowResults(true);
  };

  const handleAnswer = (value: number) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const saveProgress = async (completed: boolean = false) => {
    if (!user) return;
    setSaving(true);
    try {
      const scores: Record<string, number> = {};
      Object.keys(cultureDimensions).forEach(dimCode => {
        const dimQuestions = questions.filter(q => q.dimensionCode === dimCode);
        let sum = 0, count = 0;
        dimQuestions.forEach(q => { if (answers[q.id] !== undefined) { sum += answers[q.id]; count++; } });
        scores[dimCode] = count > 0 ? sum / count : 0;
      });
      const updateData: any = { culture_answers: answers, culture_test_completed: completed };
      if (completed) {
        updateData.culture_relacja_wspolpraca = scores.relacja_wspolpraca || null;
        updateData.culture_elastycznosc_innowacyjnosc = scores.elastycznosc_innowacyjnosc || null;
        updateData.culture_wyniki_cele = scores.wyniki_cele || null;
        updateData.culture_stabilnosc_struktura = scores.stabilnosc_struktura || null;
        updateData.culture_autonomia_styl_pracy = scores.autonomia_styl_pracy || null;
        updateData.culture_wlb_dobrostan = scores.wlb_dobrostan || null;
      }
      const { error } = await supabase.from("candidate_test_results").update(updateData).eq("user_id", user.id);
      if (error) throw error;
    } catch (error) {
      logError("CultureTest.saveProgress", error);
      toast.error(t("errors.saveProgressError"));
    } finally {
      setSaving(false);
    }
  };

  const handleNext = useCallback(async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      await saveProgress();
    } else {
      await saveProgress(true);
      calculateAndShowResults(answers);
      toast.success(t("candidate.test.testCompletedMessage"));
    }
  }, [currentQuestionIndex, questions.length, answers, t]);

  const handleTimeUp = useCallback(() => {
    const currentQ = questions[currentQuestionIndex];
    if (answers[currentQ.id] === undefined) {
      setAnswers(prev => ({ ...prev, [currentQ.id]: 3 }));
    }
    handleNext();
  }, [currentQuestionIndex, questions, answers, handleNext]);

  const { timeLeft, progress: timerProgress } = useQuestionTimer({
    duration: 13,
    onTimeUp: handleTimeUp,
    questionId: questions[currentQuestionIndex]?.id || "",
    enabled: !showResults && !loading && !authLoading,
  });

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

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
              <CardTitle className="text-2xl">{t("candidate.test.cultureTestCompleted")}</CardTitle>
              <CardDescription>{t("candidate.test.cultureTestCompletedDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {Object.entries(cultureDimensions).map(([code, dim]) => {
                  const score = dimensionScores[code] || 0;
                  const level = getLevel(score);
                  const feedback = getFeedback('culture', code, level, 'candidate');
                  return (
                    <div key={code} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{dim.name}</h3>
                        <span className={`text-sm font-medium ${level === 'high' ? 'text-success' : level === 'medium' ? 'text-cta' : 'text-muted-foreground'}`}>{score.toFixed(1)} / 5.0</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{feedback}</p>
                    </div>
                  );
                })}
              </div>
              <div className="bg-accent/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">{t("candidate.test.cultureResultsHelp")}</p>
              </div>
              <Link to="/candidate/dashboard">
                <Button className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
                  {t("candidate.test.continueToAdditional")}<ArrowRight className="w-4 h-4 ml-2" />
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
            <Link to="/candidate/dashboard" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
              <ArrowLeft className="w-4 h-4" />{t("common.saveAndBack")}
            </Link>
            <span className="text-sm text-primary-foreground/80">{t("common.question")} {currentQuestionIndex + 1} {t("common.of")} {questions.length}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t("candidate.dashboard.cultureTest")}</h1>
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
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                  <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">{option.label}</Label>
                </div>
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

export default CultureTest;
