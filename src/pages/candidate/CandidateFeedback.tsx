import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Send, MessageSquare, Star, ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogOut } from "lucide-react";

const CandidateFeedback = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [answers, setAnswers] = useState({
    overall_experience: "",
    would_recommend: "",
    ease_of_use: "",
    test_clarity: "",
    time_spent: "",
    most_useful: "",
    improvements: "",
    additional_comments: ""
  });

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // For now, we'll store feedback in a simple way
      // In production, you'd want a dedicated feedback table
      console.log("Feedback submitted:", { user_id: user.id, ...answers });
      
      setSubmitted(true);
      toast.success(t("candidate.feedback.thankYou"));
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
              <h2 className="text-2xl font-bold mb-4">{t("candidate.feedback.thankYouTitle")}</h2>
              <p className="mb-6 opacity-95">{t("candidate.feedback.thankYouDescription")}</p>
              <Link to="/candidate/dashboard">
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
          <Link to="/candidate/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />{t("common.backToPanel")}
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{t("candidate.feedback.title")}</h1>
            <p className="text-muted-foreground">{t("candidate.feedback.subtitle")}</p>
          </div>

          <Card className="mb-8 border-accent/20 bg-gradient-to-r from-cta/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-cta/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("candidate.feedback.whyImportant")}
                </p>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-cta" />
                  {t("candidate.feedback.overallExperience")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers.overall_experience}
                  onValueChange={(value) => setAnswers(prev => ({ ...prev, overall_experience: value }))}
                  className="grid grid-cols-5 gap-2"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex flex-col items-center">
                      <RadioGroupItem value={String(rating)} id={`rating-${rating}`} className="sr-only" />
                      <Label
                        htmlFor={`rating-${rating}`}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                          answers.overall_experience === String(rating)
                            ? "bg-cta border-cta text-primary"
                            : "border-muted-foreground/30 hover:border-accent"
                        }`}
                      >
                        {rating}
                      </Label>
                      <span className="text-xs text-muted-foreground mt-1">
                        {rating === 1 ? t("candidate.feedback.poor") : rating === 5 ? t("candidate.feedback.excellent") : ""}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-success" />
                  {t("candidate.feedback.wouldRecommend")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers.would_recommend}
                  onValueChange={(value) => setAnswers(prev => ({ ...prev, would_recommend: value }))}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="yes" id="recommend-yes" />
                    <Label htmlFor="recommend-yes" className="flex-1 cursor-pointer">{t("candidate.feedback.yesDefinitely")}</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="maybe" id="recommend-maybe" />
                    <Label htmlFor="recommend-maybe" className="flex-1 cursor-pointer">{t("candidate.feedback.maybe")}</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="no" id="recommend-no" />
                    <Label htmlFor="recommend-no" className="flex-1 cursor-pointer">{t("candidate.feedback.noNotReally")}</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">{t("candidate.feedback.easeOfUse")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers.ease_of_use}
                  onValueChange={(value) => setAnswers(prev => ({ ...prev, ease_of_use: value }))}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="very_easy" id="ease-very-easy" />
                    <Label htmlFor="ease-very-easy" className="flex-1 cursor-pointer">{t("candidate.feedback.veryEasy")}</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="easy" id="ease-easy" />
                    <Label htmlFor="ease-easy" className="flex-1 cursor-pointer">{t("candidate.feedback.easy")}</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="neutral" id="ease-neutral" />
                    <Label htmlFor="ease-neutral" className="flex-1 cursor-pointer">{t("candidate.feedback.neutral")}</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="difficult" id="ease-difficult" />
                    <Label htmlFor="ease-difficult" className="flex-1 cursor-pointer">{t("candidate.feedback.difficult")}</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">{t("candidate.feedback.mostUseful")}</CardTitle>
                <CardDescription>{t("candidate.feedback.optional")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={answers.most_useful}
                  onChange={(e) => setAnswers(prev => ({ ...prev, most_useful: e.target.value }))}
                  placeholder={t("candidate.feedback.mostUsefulPlaceholder")}
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsDown className="w-5 h-5 text-warning" />
                  {t("candidate.feedback.improvements")}
                </CardTitle>
                <CardDescription>{t("candidate.feedback.optional")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={answers.improvements}
                  onChange={(e) => setAnswers(prev => ({ ...prev, improvements: e.target.value }))}
                  placeholder={t("candidate.feedback.improvementsPlaceholder")}
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">{t("candidate.feedback.additionalComments")}</CardTitle>
                <CardDescription>{t("candidate.feedback.optional")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={answers.additional_comments}
                  onChange={(e) => setAnswers(prev => ({ ...prev, additional_comments: e.target.value }))}
                  placeholder={t("candidate.feedback.additionalCommentsPlaceholder")}
                  rows={4}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full gap-2"
              disabled={loading || !answers.overall_experience}
            >
              {loading ? t("common.saving") : (
                <>
                  <Send className="w-4 h-4" />
                  {t("candidate.feedback.submit")}
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CandidateFeedback;
