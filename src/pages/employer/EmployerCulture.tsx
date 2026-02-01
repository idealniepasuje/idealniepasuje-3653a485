import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { employerCultureQuestions, cultureDimensions } from "@/data/cultureQuestions";
import { agreementScale } from "@/data/additionalQuestions";
import { getLevel, getFeedback } from "@/data/feedbackData";

const EmployerCulture = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dimensionScores, setDimensionScores] = useState<Record<string, number>>({});
  const questions = employerCultureQuestions;

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
    Object.keys(cultureDimensions).forEach(dim => {
      const dimQuestions = questions.filter(q => q.dimensionCode === dim);
      let sum = 0, count = 0;
      dimQuestions.forEach(q => { if (answerData[q.id]) { sum += answerData[q.id]; count++; } });
      scores[dim] = count > 0 ? sum / count : 0;
    });
    setDimensionScores(scores); setShowResults(true);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(i => i + 1); }
    else {
      setSaving(true);
      const scores: Record<string, number> = {};
      Object.keys(cultureDimensions).forEach(dim => {
        const dimQuestions = questions.filter(q => q.dimensionCode === dim);
        let sum = 0, count = 0;
        dimQuestions.forEach(q => { if (answers[q.id]) { sum += answers[q.id]; count++; } });
        scores[dim] = count > 0 ? sum / count : 0;
      });
      await supabase.from("employer_profiles").update({ culture_answers: answers, culture_completed: true, profile_completed: true, culture_relacja_wspolpraca: scores.relacja_wspolpraca, culture_elastycznosc_innowacyjnosc: scores.elastycznosc_innowacyjnosc, culture_wyniki_cele: scores.wyniki_cele, culture_stabilnosc_struktura: scores.stabilnosc_struktura, culture_autonomia_styl_pracy: scores.autonomia_styl_pracy, culture_wlb_dobrostan: scores.wlb_dobrostan }).eq("user_id", user!.id);
      setSaving(false); calculateResults(answers); toast.success("Profil ukończony!");
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Sparkles className="w-12 h-12 text-accent animate-pulse" /></div>;
  const currentQuestion = questions[currentQuestionIndex];

  if (showResults) return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground"><div className="container mx-auto px-4 py-4"><Link to="/employer/dashboard" className="flex items-center gap-2 text-primary-foreground/80"><ArrowLeft className="w-4 h-4" />Wróć</Link></div></header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-success/20"><CardContent className="pt-6 space-y-6 text-center">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
          <h2 className="text-2xl font-bold">Profil ukończony!</h2>
          <p className="text-muted-foreground">Teraz my zajmujemy się znalezieniem idealnego kandydata. Gdy tylko go znajdziemy, otrzymasz powiadomienie.</p>
          <div className="space-y-3 text-left">{Object.entries(cultureDimensions).map(([code, dim]) => (<div key={code} className="bg-muted/50 rounded-lg p-3"><div className="flex justify-between"><span className="font-medium">{dim.name}</span><span>{dimensionScores[code]?.toFixed(1)}/5</span></div><p className="text-xs text-muted-foreground mt-1">{getFeedback('culture', code, getLevel(dimensionScores[code] || 0), 'employer')}</p></div>))}</div>
          <Link to="/employer/dashboard"><Button className="w-full bg-cta text-cta-foreground">Wróć do panelu</Button></Link>
        </CardContent></Card>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground"><div className="container mx-auto px-4 py-4 flex justify-between"><Link to="/employer/dashboard" className="flex items-center gap-2 text-primary-foreground/80"><ArrowLeft className="w-4 h-4" />Zapisz i wróć</Link><span className="text-sm">{currentQuestionIndex + 1}/{questions.length}</span></div></header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Kultura organizacji pracy</h1><Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2 mb-6" />
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-2">Oceń, na ile poniższe stwierdzenie opisuje Waszą organizację</p>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.text}</h3>
          <RadioGroup value={answers[currentQuestion.id]?.toString()} onValueChange={(v) => setAnswers(p => ({...p, [currentQuestion.id]: parseInt(v)}))} className="space-y-2">
            {agreementScale.map(o => (<div key={o.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"><RadioGroupItem value={o.value.toString()} id={`o-${o.value}`} /><Label htmlFor={`o-${o.value}`} className="flex-1 cursor-pointer">{o.label}</Label></div>))}
          </RadioGroup>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0}><ArrowLeft className="w-4 h-4 mr-2" />Poprzednie</Button>
            <Button onClick={handleNext} disabled={!answers[currentQuestion.id] || saving} className="bg-cta text-cta-foreground">{currentQuestionIndex === questions.length - 1 ? "Zakończ" : "Następne"}<ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
        </CardContent></Card>
      </main>
    </div>
  );
};

export default EmployerCulture;
