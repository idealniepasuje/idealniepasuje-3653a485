import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { competencyTests, getQuestionsByCompetency } from "@/data/competencyQuestions";
import { agreementScale } from "@/data/additionalQuestions";
import { getLevel, getFeedback } from "@/data/feedbackData";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { QuestionTimer } from "@/components/QuestionTimer";
import { logError } from "@/lib/errorLogger";

const CompetencyTest = () => {
  const { competencyCode } = useParams<{ competencyCode: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [averageScore, setAverageScore] = useState(0);

  const questions = competencyCode ? getQuestionsByCompetency(competencyCode) : [];
  const testInfo = competencyCode ? competencyTests[competencyCode as keyof typeof competencyTests] : null;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user && competencyCode) {
      fetchExistingAnswers();
    }
  }, [user, authLoading, competencyCode, navigate]);

  const fetchExistingAnswers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("candidate_test_results")
        .select("competency_answers")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        logError("CompetencyTest.fetchExistingAnswers", error);
      }
      
      if (data?.competency_answers && competencyCode) {
        const existingAnswers = data.competency_answers[competencyCode] || {};
        setAnswers(existingAnswers);
        
        // Check if test was already completed
        if (Object.keys(existingAnswers).length >= questions.length) {
          calculateAndShowResults(existingAnswers);
        }
      }
      
      setTestResults(data);
    } catch (error) {
      logError("CompetencyTest.fetchExistingAnswers", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAndShowResults = (answerData: Record<string, number>) => {
    let sum = 0;
    let count = 0;
    
    questions.forEach(q => {
      if (answerData[q.id] !== undefined) {
        const value = q.reversed ? (6 - answerData[q.id]) : answerData[q.id];
        sum += value;
        count++;
      }
    });
    
    const avg = count > 0 ? sum / count : 0;
    setAverageScore(avg);
    setShowResults(true);
  };

  const handleAnswer = (value: number) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const saveProgress = async () => {
    if (!user || !competencyCode) return;
    
    setSaving(true);
    try {
      // Get current answers from database
      const { data: currentData } = await supabase
        .from("candidate_test_results")
        .select("competency_answers")
        .eq("user_id", user.id)
        .single();
      
      const existingAnswers = (currentData?.competency_answers as Record<string, Record<string, number>> | null) || {};
      
      const updatedAnswers = {
        ...existingAnswers,
        [competencyCode]: answers
      };

      const { error } = await supabase
        .from("candidate_test_results")
        .update({ competency_answers: updatedAnswers })
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      logError("CompetencyTest.saveProgress", error);
      toast.error("Nie udało się zapisać postępu");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = useCallback(async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      await saveProgress();
    } else {
      // Test completed
      await saveProgress();
      calculateAndShowResults(answers);
      toast.success("Test ukończony!");
    }
  }, [currentQuestionIndex, questions.length, answers]);

  const handleTimeUp = useCallback(() => {
    // Auto-select middle option (3) if no answer given
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
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-accent animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!testInfo || !competencyCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p>Test nie został znaleziony</p>
            <Link to="/candidate/dashboard">
              <Button className="mt-4">Wróć do panelu</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const level = getLevel(averageScore);
  const feedback = getFeedback('competency', competencyCode, level, 'candidate');

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-4">
            <Link to="/candidate/dashboard" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
              <ArrowLeft className="w-4 h-4" />
              Wróć do panelu
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-success/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Test ukończony!</CardTitle>
              <CardDescription>{testInfo.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">
                  {averageScore.toFixed(1)} / 5.0
                </div>
                <div className="text-lg font-medium capitalize">
                  Poziom: <span className={`${level === 'high' ? 'text-success' : level === 'medium' ? 'text-cta' : 'text-destructive'}`}>
                    {level === 'high' ? 'Wysoki' : level === 'medium' ? 'Średni' : 'Niski'}
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Twój wynik</h3>
                <p className="text-muted-foreground">{feedback}</p>
              </div>

              <div className="bg-accent/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Pamiętaj: nie ma dobrych ani złych wyników. Ten test pomaga nam dopasować Cię do odpowiedniego miejsca pracy.
                </p>
              </div>

              <Link to="/candidate/dashboard">
                <Button className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
                  Kontynuuj do następnego testu
                  <ArrowRight className="w-4 h-4 ml-2" />
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
              <ArrowLeft className="w-4 h-4" />
              Zapisz i wróć
            </Link>
            <span className="text-sm text-primary-foreground/80">
              Pytanie {currentQuestionIndex + 1} z {questions.length}
            </span>
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
            <div className="mb-4">
              <QuestionTimer timeLeft={timeLeft} progress={timerProgress} />
            </div>
            <CardDescription className="text-xs text-muted-foreground mb-2">
              Oceń, na ile zgadzasz się z poniższym stwierdzeniem
            </CardDescription>
            <CardTitle className="text-lg leading-relaxed">
              {currentQuestion.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id]?.toString()}
              onValueChange={(value) => handleAnswer(parseInt(value))}
              className="space-y-3"
            >
              {agreementScale.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                  <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Poprzednie
              </Button>
              <Button
                onClick={handleNext}
                disabled={answers[currentQuestion.id] === undefined || saving}
                className="bg-cta text-cta-foreground hover:bg-cta/90"
              >
                {currentQuestionIndex === questions.length - 1 ? "Zakończ test" : "Następne"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Pamiętaj: nie ma dobrych ani złych odpowiedzi. Odpowiadaj szczerze!
        </p>
      </main>
    </div>
  );
};

export default CompetencyTest;
