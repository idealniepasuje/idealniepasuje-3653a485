import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { employerCultureQuestions, getLocalizedCultureDimensions } from "@/data/cultureQuestions";
import { agreementScale, getLocalizedData } from "@/data/additionalQuestions";
import { getLevel, getFeedback } from "@/data/feedbackData";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { QuestionTimer } from "@/components/QuestionTimer";

const EmployerCulture = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dimensionScores, setDimensionScores] = useState<Record<string, number>>({});
  const questions = employerCultureQuestions;
  const localizedDimensions = getLocalizedCultureDimensions(i18n.language);
  const localizedScale = getLocalizedData(agreementScale, i18n.language);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("employer_profiles").select("culture_answers, culture_completed").eq("user_id", user.id).single();
    if (data?.culture_answers) { setAnswers(data.culture_answers as Record<string, number>); if (data.culture_completed) calculateResults(data.culture_answers as Record<string, number>); }
    setLoading(false);
  };

  const calculateResults = (answerData: Record<string, number>) => {
    const scores: Record<string, number> = {};
    Object.keys(localizedDimensions).forEach(dim => {
      const dimQuestions = questions.filter(q => q.dimensionCode === dim);
      let sum = 0, count = 0;
      dimQuestions.forEach(q => { if (answerData[q.id]) { sum += answerData[q.id]; count++; } });
      scores[dim] = count > 0 ? sum / count : 0;
    });
    setDimensionScores(scores); setShowResults(true);
  };

  const generateMatches = async () => {
    if (!user) return;
    try {
      const response = await supabase.functions.invoke('generate-matches', {
        body: { employer_user_id: user.id }
      });
      if (response.data?.matches_count > 0) {
        toast.success(t("employer.culture.matchesGenerated", { count: response.data.matches_count }));
      }
    } catch (error) {
      console.error('Error generating matches:', error);
    }
  };

  const sendEmployerResultsEmail = async () => {
    if (!user?.email) return;
    try {
      await supabase.functions.invoke('send-employer-results', {
        body: {
          employer_user_id: user.id,
          employer_email: user.email,
          feedback_url: 'https://idealniepasuje.lovable.app/employer/feedback'
        }
      });
      console.log('Employer results email sent');
    } catch (error) {
      console.error('Error sending employer results email:', error);
    }
  };

  const handleNext = useCallback(async () => {
    if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(i => i + 1); }
    else {
      setSaving(true);
      const scores: Record<string, number> = {};
      Object.keys(localizedDimensions).forEach(dim => {
        const dimQuestions = questions.filter(q => q.dimensionCode === dim);
        let sum = 0, count = 0;
        dimQuestions.forEach(q => { if (answers[q.id]) { sum += answers[q.id]; count++; } });
        scores[dim] = count > 0 ? sum / count : 0;
      });
      await supabase.from("employer_profiles").update({ culture_answers: answers, culture_completed: true, profile_completed: true, culture_relacja_wspolpraca: scores.relacja_wspolpraca, culture_elastycznosc_innowacyjnosc: scores.elastycznosc_innowacyjnosc, culture_wyniki_cele: scores.wyniki_cele, culture_stabilnosc_struktura: scores.stabilnosc_struktura, culture_autonomia_styl_pracy: scores.autonomia_styl_pracy, culture_wlb_dobrostan: scores.wlb_dobrostan }).eq("user_id", user!.id);
      
      // Generate matches automatically after profile completion
      await generateMatches();
      
      // Send results email to employer
      await sendEmployerResultsEmail();
      
      setSaving(false); calculateResults(answers); toast.success(t("employer.culture.completedMessage"));
    }
  }, [currentQuestionIndex, questions, answers, user, t, localizedDimensions]);

  const handleTimeUp = useCallback(() => {
    const currentQ = questions[currentQuestionIndex];
    if (!answers[currentQ.id]) {
      setAnswers(prev => ({ ...prev, [currentQ.id]: 3 }));
    }
    handleNext();
  }, [currentQuestionIndex, questions, answers, handleNext]);

  const { timeLeft, progress: timerProgress } = useQuestionTimer({
    duration: 25,
    onTimeUp: handleTimeUp,
    questionId: questions[currentQuestionIndex]?.id || "",
    enabled: !showResults && !loading && !authLoading,
  });

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse" /></div>;
  const currentQuestion = questions[currentQuestionIndex];

  if (showResults) return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground"><div className="container mx-auto px-4 py-4"><Link to="/employer/dashboard" className="flex items-center gap-2 text-primary-foreground/80"><ArrowLeft className="w-4 h-4" />{t("common.back")}</Link></div></header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-success/20"><CardContent className="pt-6 space-y-6 text-center">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
          <h2 className="text-2xl font-bold">{t("employer.culture.profileCompleted")}</h2>
          <p className="text-muted-foreground">{t("employer.culture.profileCompletedDescription")}</p>
          <div className="space-y-3 text-left">{Object.entries(localizedDimensions).map(([code, dim]) => (<div key={code} className="bg-muted/50 rounded-lg p-3"><div className="flex justify-between"><span className="font-medium">{dim.name}</span><span>{dimensionScores[code]?.toFixed(1)}/5</span></div><p className="text-xs text-muted-foreground mt-1">{getFeedback('culture', code, getLevel(dimensionScores[code] || 0), 'employer', i18n.language)}</p></div>))}</div>
          <Link to="/employer/dashboard"><Button className="w-full bg-cta text-cta-foreground">{t("common.backToPanel")}</Button></Link>
        </CardContent></Card>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground"><div className="container mx-auto px-4 py-4 flex justify-between"><Link to="/employer/dashboard" className="flex items-center gap-2 text-primary-foreground/80"><ArrowLeft className="w-4 h-4" />{t("common.saveAndBack")}</Link><span className="text-sm">{currentQuestionIndex + 1}/{questions.length}</span></div></header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">{t("employer.culture.title")}</h1><Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2 mb-6" />
        <Card><CardContent className="pt-6">
          <div className="mb-4"><QuestionTimer timeLeft={timeLeft} progress={timerProgress} /></div>
          <p className="text-xs text-muted-foreground mb-2">{t("employer.culture.rateStatement")}</p>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.text[i18n.language as 'pl' | 'en']}</h3>
          <RadioGroup value={answers[currentQuestion.id]?.toString()} onValueChange={(v) => setAnswers(p => ({...p, [currentQuestion.id]: parseInt(v)}))} className="space-y-2">
            {localizedScale.map(o => (<div key={o.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"><RadioGroupItem value={o.value.toString()} id={`o-${o.value}`} /><Label htmlFor={`o-${o.value}`} className="flex-1 cursor-pointer">{o.label}</Label></div>))}
          </RadioGroup>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0}><ArrowLeft className="w-4 h-4 mr-2" />{t("common.previous")}</Button>
            <Button onClick={handleNext} disabled={!answers[currentQuestion.id] || saving} className="bg-cta text-cta-foreground">{currentQuestionIndex === questions.length - 1 ? t("common.finishTest") : t("common.next")}<ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
        </CardContent></Card>
      </main>
    </div>
  );
};

export default EmployerCulture;
