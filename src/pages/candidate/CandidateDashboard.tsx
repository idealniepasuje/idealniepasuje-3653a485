import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, LogOut, MessageSquare, Brain, Lightbulb, Target, RefreshCw, Users, ChevronRight, CheckCircle2, Clock, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { competencyTests } from "@/data/competencyQuestions";

const CandidateDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchTestResults();
    }
  }, [user, authLoading, navigate]);

  const fetchTestResults = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("candidate_test_results")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching results:", error);
      }
      
      setTestResults(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getTestStatus = (competencyCode: string) => {
    if (!testResults?.competency_answers) return "not_started";
    const answers = testResults.competency_answers[competencyCode];
    if (!answers) return "not_started";
    
    const questionCount = competencyTests[competencyCode as keyof typeof competencyTests]?.questionCount || 0;
    const answeredCount = Object.keys(answers).length;
    
    if (answeredCount === 0) return "not_started";
    if (answeredCount >= questionCount) return "completed";
    return "in_progress";
  };

  const getTestProgress = (competencyCode: string) => {
    if (!testResults?.competency_answers) return 0;
    const answers = testResults.competency_answers[competencyCode];
    if (!answers) return 0;
    
    const questionCount = competencyTests[competencyCode as keyof typeof competencyTests]?.questionCount || 1;
    const answeredCount = Object.keys(answers).length;
    
    return Math.round((answeredCount / questionCount) * 100);
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      MessageSquare, Brain, Lightbulb, Target, RefreshCw
    };
    return icons[iconName] || MessageSquare;
  };

  const allCompetencyTestsCompleted = Object.keys(competencyTests).every(
    code => getTestStatus(code) === "completed"
  );

  const cultureTestCompleted = testResults?.culture_test_completed || false;
  const additionalCompleted = testResults?.additional_completed || false;

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold">idealnie<span className="text-accent">pasuje</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-foreground/80">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Witaj w panelu kandydata!</h1>
          <p className="text-muted-foreground">
            Pamiętaj: nie ma dobrych ani złych odpowiedzi. Szczerość zwiększa jakość dopasowania.
          </p>
        </div>

        {/* Progress overview */}
        <Card className="mb-8 border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Twój profil kandydata</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {!allCompetencyTestsCompleted && "Wykonaj testy kompetencji, aby poznać swoje mocne strony"}
                  {allCompetencyTestsCompleted && !cultureTestCompleted && "Świetnie! Teraz czas na test kultury organizacji"}
                  {allCompetencyTestsCompleted && cultureTestCompleted && !additionalCompleted && "Jeszcze tylko kilka pytań dodatkowych"}
                  {testResults?.all_tests_completed && "Gratulacje! Wszystkie testy ukończone. Szukamy dla Ciebie dopasowań."}
                </p>
                <Progress 
                  value={
                    testResults?.all_tests_completed ? 100 :
                    additionalCompleted ? 90 :
                    cultureTestCompleted ? 70 :
                    allCompetencyTestsCompleted ? 50 :
                    Object.keys(competencyTests).filter(c => getTestStatus(c) === "completed").length * 10
                  } 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competency Tests */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">1</span>
            Testy kompetencji
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(competencyTests).map(([code, test]) => {
              const status = getTestStatus(code);
              const progress = getTestProgress(code);
              const IconComponent = getIconComponent(test.icon);
              
              return (
                <Card key={code} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                        <IconComponent className="w-6 h-6 text-accent" />
                      </div>
                      <Badge 
                        variant={status === "completed" ? "default" : status === "in_progress" ? "secondary" : "outline"}
                        className={status === "completed" ? "bg-success" : ""}
                      >
                        {status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {status === "in_progress" && <Clock className="w-3 h-3 mr-1" />}
                        {status === "completed" ? "Ukończono" : status === "in_progress" ? "W trakcie" : "Nie rozpoczęto"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {test.estimatedTime}
                      </span>
                      <span>{test.questionCount} pytań</span>
                    </div>
                    {status !== "not_started" && (
                      <Progress value={progress} className="h-2 mb-3" />
                    )}
                    <Link to={`/candidate/test/competency/${code}`}>
                      <Button className="w-full gap-2" variant={status === "completed" ? "outline" : "default"}>
                        {status === "completed" ? (
                          <>Zobacz wyniki<ChevronRight className="w-4 h-4" /></>
                        ) : status === "in_progress" ? (
                          <>Kontynuuj<ChevronRight className="w-4 h-4" /></>
                        ) : (
                          <>Rozpocznij<Play className="w-4 h-4" /></>
                        )}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Culture Test */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${allCompetencyTestsCompleted ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
            Test kultury organizacji pracy
          </h2>
          <Card className={!allCompetencyTestsCompleted ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-cta/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-cta" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Kultura organizacji</h3>
                    <p className="text-sm text-muted-foreground">Dowiedz się, jakie środowisko pracy Ci odpowiada</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={cultureTestCompleted ? "default" : "outline"} className={cultureTestCompleted ? "bg-success" : ""}>
                    {cultureTestCompleted ? "Ukończono" : "Do wykonania"}
                  </Badge>
                  <Link to="/candidate/test/culture">
                    <Button disabled={!allCompetencyTestsCompleted} className="gap-2">
                      {cultureTestCompleted ? "Zobacz wyniki" : "Rozpocznij"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Additional Questions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${cultureTestCompleted ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>3</span>
            Pytania dodatkowe
          </h2>
          <Card className={!cultureTestCompleted ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Dane kontekstowe</h3>
                    <p className="text-sm text-muted-foreground">Branża, doświadczenie i preferencje</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={additionalCompleted ? "default" : "outline"} className={additionalCompleted ? "bg-success" : ""}>
                    {additionalCompleted ? "Ukończono" : "Do wykonania"}
                  </Badge>
                  <Link to="/candidate/additional">
                    <Button disabled={!cultureTestCompleted} className="gap-2">
                      {additionalCompleted ? "Edytuj" : "Wypełnij"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Matches section */}
        {testResults?.all_tests_completed && (
          <section>
            <h2 className="text-xl font-bold mb-4">Twoje dopasowania</h2>
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6 text-center py-12">
                <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Szukamy idealnych dopasowań</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Teraz cała robota jest po naszej stronie. Będziemy szukać dla Ciebie idealnego pracodawcy. 
                  Gdy pojawi się dopasowana oferta, otrzymasz powiadomienie.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
};

export default CandidateDashboard;
