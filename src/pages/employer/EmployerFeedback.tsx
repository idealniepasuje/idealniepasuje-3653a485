import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Send, MessageSquare, Heart, ThumbsUp, Lightbulb, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";

const EmployerFeedback = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [answers, setAnswers] = useState({
    likes_solution: "",
    likes_reason: "",
    would_change: "",
    change_reason: ""
  });

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!answers.likes_solution || !answers.would_change) {
      toast.error("Proszę odpowiedzieć na oba pytania");
      return;
    }
    
    setLoading(true);
    try {
      // Store in a generic feedback mechanism - we can use the same table or create employer-specific one
      const { error } = await supabase
        .from('candidate_feedback')
        .insert({
          user_id: user.id,
          likes_solution: answers.likes_solution,
          likes_reason: answers.likes_reason || null,
          would_change: answers.would_change,
          change_reason: answers.change_reason || null
        });

      if (error) throw error;
      
      setSubmitted(true);
      toast.success(t("employer.feedback.thankYou"));
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(t("errors.genericError"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold">idealnie<span className="text-accent">pasuje</span></span>
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <span className="text-sm text-primary-foreground/80">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="w-4 h-4 mr-2" />{t("common.logout")}
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto overflow-hidden border-0 shadow-xl bg-gradient-to-br from-success/90 via-accent to-primary">
            <CardContent className="p-8 text-center text-primary-foreground">
              <div className="w-20 h-20 rounded-full bg-background/20 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-4">{t("employer.feedback.thankYouTitle")}</h2>
              <p className="mb-6 opacity-95">{t("employer.feedback.thankYouDescription")}</p>
              <Link to="/employer/dashboard">
                <Button variant="secondary" size="lg">
                  {t("common.backToPanel")}
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">idealnie<span className="text-accent">pasuje</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-primary-foreground/80">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-2" />{t("common.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/employer/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />{t("common.backToPanel")}
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{t("employer.feedback.title")}</h1>
            <p className="text-muted-foreground">{t("employer.feedback.subtitle")}</p>
          </div>

          <Card className="mb-8 border-accent/20 bg-gradient-to-r from-cta/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-cta/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("employer.feedback.whyImportant")}
                </p>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            {/* Question 1: Do you like the solution? */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-success" />
                  Czy podoba Ci się nasze rozwiązanie?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={answers.likes_solution}
                  onValueChange={(value) => setAnswers(prev => ({ ...prev, likes_solution: value }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tak" id="likes-yes" />
                    <Label htmlFor="likes-yes" className="cursor-pointer font-medium">Tak</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nie" id="likes-no" />
                    <Label htmlFor="likes-no" className="cursor-pointer font-medium">Nie</Label>
                  </div>
                </RadioGroup>
                
                {answers.likes_solution && (
                  <div className="pt-2">
                    <Label className="text-sm text-muted-foreground mb-2 block">Uzasadnij:</Label>
                    <Textarea
                      value={answers.likes_reason}
                      onChange={(e) => setAnswers(prev => ({ ...prev, likes_reason: e.target.value }))}
                      placeholder="Napisz dlaczego..."
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Question 2: Would you change something? */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-cta" />
                  Czy coś byś zmienił w naszym rozwiązaniu?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={answers.would_change}
                  onValueChange={(value) => setAnswers(prev => ({ ...prev, would_change: value }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tak" id="change-yes" />
                    <Label htmlFor="change-yes" className="cursor-pointer font-medium">Tak</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nie" id="change-no" />
                    <Label htmlFor="change-no" className="cursor-pointer font-medium">Nie</Label>
                  </div>
                </RadioGroup>
                
                {answers.would_change && (
                  <div className="pt-2">
                    <Label className="text-sm text-muted-foreground mb-2 block">Uzasadnij:</Label>
                    <Textarea
                      value={answers.change_reason}
                      onChange={(e) => setAnswers(prev => ({ ...prev, change_reason: e.target.value }))}
                      placeholder={answers.would_change === "tak" ? "Co byś zmienił i dlaczego?" : "Dlaczego uważasz, że nic nie trzeba zmieniać?"}
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full gap-2"
              disabled={loading || !answers.likes_solution || !answers.would_change}
            >
              {loading ? t("common.saving") : (
                <>
                  <Send className="w-4 h-4" />
                  {t("employer.feedback.submit")}
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EmployerFeedback;
