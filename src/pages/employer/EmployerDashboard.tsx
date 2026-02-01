import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, LogOut, Building2, FileText, Users, Settings, ChevronRight, CheckCircle2, Target, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const EmployerDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch employer profile
      const { data: profile, error: profileError } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
      }
      
      setEmployerProfile(profile);

      // Fetch matches
      const { data: matchData, error: matchError } = await supabase
        .from("match_results")
        .select("*")
        .eq("employer_user_id", user.id)
        .order("overall_percent", { ascending: false });

      if (matchError) {
        console.error("Error fetching matches:", matchError);
      } else {
        setMatches(matchData || []);
      }
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

  const getProfileProgress = () => {
    if (!employerProfile) return 0;
    let progress = 0;
    if (employerProfile.role_completed) progress += 25;
    if (employerProfile.requirements_completed) progress += 25;
    if (employerProfile.culture_completed) progress += 25;
    if (employerProfile.profile_completed) progress = 100;
    return progress;
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

  const progress = getProfileProgress();

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
          <h1 className="text-3xl font-bold mb-2">Panel pracodawcy</h1>
          <p className="text-muted-foreground">
            Zdefiniuj profil idealnego kandydata i znajdź osoby, które najlepiej pasują do Twojej organizacji.
          </p>
        </div>

        {/* Progress overview */}
        <Card className="mb-8 border-cta/20 bg-cta/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cta/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-cta" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Profil Twojej organizacji</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {progress < 25 && "Rozpocznij od opisania roli, którą chcesz obsadzić"}
                  {progress >= 25 && progress < 50 && "Świetnie! Teraz określ wymagane kompetencje"}
                  {progress >= 50 && progress < 75 && "Jeszcze tylko test kultury organizacji"}
                  {progress >= 75 && progress < 100 && "Prawie gotowe! Dokończ profil"}
                  {progress === 100 && "Profil kompletny! Szukamy dla Ciebie kandydatów."}
                </p>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Step 1: Role description */}
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <Badge variant={employerProfile?.role_completed ? "default" : "outline"} className={employerProfile?.role_completed ? "bg-success" : ""}>
                  {employerProfile?.role_completed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                  {employerProfile?.role_completed ? "Gotowe" : "Krok 1"}
                </Badge>
              </div>
              <CardTitle className="text-base">Opis roli</CardTitle>
              <CardDescription className="text-xs">Opisz stanowisko i obowiązki</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/employer/role">
                <Button className="w-full gap-2" size="sm" variant={employerProfile?.role_completed ? "outline" : "default"}>
                  {employerProfile?.role_completed ? "Edytuj" : "Wypełnij"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Step 2: Contextual data */}
          <Card className={`group hover:shadow-lg transition-shadow ${!employerProfile?.role_completed ? "opacity-60" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-cta/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-cta" />
                </div>
                <Badge variant={employerProfile?.requirements_completed ? "default" : "outline"} className={employerProfile?.requirements_completed ? "bg-success" : ""}>
                  {employerProfile?.requirements_completed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                  {employerProfile?.requirements_completed ? "Gotowe" : "Krok 2"}
                </Badge>
              </div>
              <CardTitle className="text-base">Wymagania</CardTitle>
              <CardDescription className="text-xs">Branża, doświadczenie i kompetencje</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/employer/requirements">
                <Button className="w-full gap-2" size="sm" variant={employerProfile?.requirements_completed ? "outline" : "default"} disabled={!employerProfile?.role_completed}>
                  {employerProfile?.requirements_completed ? "Edytuj" : "Wypełnij"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Step 3: Culture */}
          <Card className={`group hover:shadow-lg transition-shadow ${!employerProfile?.requirements_completed ? "opacity-60" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <Badge variant={employerProfile?.culture_completed ? "default" : "outline"} className={employerProfile?.culture_completed ? "bg-success" : ""}>
                  {employerProfile?.culture_completed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                  {employerProfile?.culture_completed ? "Gotowe" : "Krok 3"}
                </Badge>
              </div>
              <CardTitle className="text-base">Kultura pracy</CardTitle>
              <CardDescription className="text-xs">Wartości i styl pracy w firmie</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/employer/culture">
                <Button className="w-full gap-2" size="sm" variant={employerProfile?.culture_completed ? "outline" : "default"} disabled={!employerProfile?.requirements_completed}>
                  {employerProfile?.culture_completed ? "Edytuj" : "Wypełnij"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Step 4: View candidates */}
          <Card className={`group hover:shadow-lg transition-shadow ${!employerProfile?.culture_completed ? "opacity-60" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-success" />
                </div>
                <Badge variant={matches.length > 0 ? "default" : "outline"} className={matches.length > 0 ? "bg-accent" : ""}>
                  {matches.length > 0 ? `${matches.length} kandydatów` : "Oczekuje"}
                </Badge>
              </div>
              <CardTitle className="text-base">Kandydaci</CardTitle>
              <CardDescription className="text-xs">Zobacz dopasowanych kandydatów</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/employer/candidates">
                <Button className="w-full gap-2" size="sm" variant="default" disabled={!employerProfile?.culture_completed}>
                  Zobacz
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Matches section */}
        {employerProfile?.profile_completed && (
          <section>
            <h2 className="text-xl font-bold mb-4">Dopasowani kandydaci</h2>
            {matches.length === 0 ? (
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="pt-6 text-center py-12">
                  <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Szukamy idealnych kandydatów</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Teraz my zajmujemy się znalezieniem idealnego kandydata. 
                    Gdy tylko go znajdziemy, otrzymasz powiadomienie.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {matches.map((match) => (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Kandydat #{match.candidate_user_id.slice(0, 8)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Kompetencje: {match.competence_percent}% | Kultura: {match.culture_percent}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-accent">{match.overall_percent}%</div>
                            <div className="text-xs text-muted-foreground">dopasowanie</div>
                          </div>
                          <Link to={`/employer/candidate/${match.candidate_user_id}`}>
                            <Button>
                              Zobacz profil
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default EmployerDashboard;
