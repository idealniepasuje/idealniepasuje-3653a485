import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, LogOut, ArrowLeft, Users, ChevronRight, Target, Heart, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const EmployerCandidates = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchMatches();
    }
  }, [user, authLoading, navigate]);

  const fetchMatches = async () => {
    if (!user) return;
    
    try {
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
        {/* Back button */}
        <div className="mb-6">
          <Link to="/employer/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Powrót do panelu
            </Button>
          </Link>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dopasowani kandydaci</h1>
          <p className="text-muted-foreground">
            Lista kandydatów, którzy najlepiej pasują do Twojego profilu organizacji.
          </p>
        </div>

        {/* Stats card */}
        <Card className="mb-8 border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{matches.length}</h2>
                <p className="text-muted-foreground">
                  {matches.length === 0 && "Brak dopasowanych kandydatów"}
                  {matches.length === 1 && "dopasowany kandydat"}
                  {matches.length > 1 && matches.length < 5 && "dopasowanych kandydatów"}
                  {matches.length >= 5 && "dopasowanych kandydatów"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates list */}
        {matches.length === 0 ? (
          <Card className="border-muted">
            <CardContent className="pt-6 text-center py-16">
              <Sparkles className="w-16 h-16 text-accent mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-semibold mb-3">Szukamy idealnych kandydatów</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Na razie nie mamy kandydatów pasujących do Twojego profilu. 
                Gdy tylko znajdziemy odpowiednie osoby, pojawią się tutaj.
              </p>
              <Link to="/employer/dashboard">
                <Button variant="outline">
                  Wróć do panelu
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                        <Users className="w-7 h-7 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Kandydat #{match.candidate_user_id.slice(0, 8)}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="gap-1">
                            <Target className="w-3 h-3" />
                            Kompetencje: {match.competence_percent}%
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Heart className="w-3 h-3" />
                            Kultura: {match.culture_percent}%
                          </Badge>
                          {match.extra_percent !== null && (
                            <Badge variant="outline" className="gap-1">
                              <Briefcase className="w-3 h-3" />
                              Dodatkowe: {match.extra_percent}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-accent">{match.overall_percent}%</div>
                        <div className="text-xs text-muted-foreground">całkowite dopasowanie</div>
                      </div>
                      <Link to={`/employer/candidate/${match.candidate_user_id}`}>
                        <Button className="gap-2">
                          Zobacz profil
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployerCandidates;
