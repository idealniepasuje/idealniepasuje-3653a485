import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { industries, experienceLevels, positionLevels, industryChangeOptions } from "@/data/additionalQuestions";

const CandidateAdditional = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    industry: "",
    experience: "",
    positionLevel: "",
    wantsToChangeIndustry: "",
    workDescription: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchExistingData();
    }
  }, [user, authLoading, navigate]);

  const fetchExistingData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("candidate_test_results")
        .select("industry, experience, position_level, wants_to_change_industry, work_description, additional_completed")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching data:", error);
      }
      
      if (data) {
        setFormData({
          industry: data.industry || "",
          experience: data.experience || "",
          positionLevel: data.position_level || "",
          wantsToChangeIndustry: data.wants_to_change_industry || "",
          workDescription: data.work_description || "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!formData.industry || !formData.experience || !formData.positionLevel || !formData.wantsToChangeIndustry) {
      toast.error("Wypełnij wszystkie wymagane pola");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("candidate_test_results")
        .update({
          industry: formData.industry,
          experience: formData.experience,
          position_level: formData.positionLevel,
          wants_to_change_industry: formData.wantsToChangeIndustry,
          work_description: formData.workDescription,
          additional_completed: true,
          all_tests_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      setShowSuccess(true);
      toast.success("Dziękujemy za wypełnienie wszystkich testów!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Nie udało się zapisać danych");
    } finally {
      setSaving(false);
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

  if (showSuccess) {
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
              <CardTitle className="text-2xl">Dziękujemy!</CardTitle>
              <CardDescription>Wszystkie testy i pytania zostały ukończone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-accent/10 rounded-lg p-6 text-center">
                <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Teraz cała robota jest po naszej stronie</h3>
                <p className="text-muted-foreground">
                  Będziemy szukać dla Ciebie idealnego pracodawcy. Gdy pojawi się dopasowana oferta, otrzymasz powiadomienie.
                </p>
              </div>

              <Link to="/candidate/dashboard">
                <Button className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
                  Wróć do panelu
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
          <Link to="/candidate/dashboard" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" />
            Wróć do panelu
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Pytania dodatkowe</h1>
          <p className="text-muted-foreground">
            Ostatni krok! Podaj kilka informacji o swoim doświadczeniu.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="industry">Branża, w której masz doświadczenie *</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz branżę" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Okres doświadczenia *</Label>
              <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz okres" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level} value={level}>{level} lat</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="positionLevel">Poziom stanowiska *</Label>
              <Select value={formData.positionLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, positionLevel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz poziom" />
                </SelectTrigger>
                <SelectContent>
                  {positionLevels.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wantsToChange">Czy chcesz zmienić branżę? *</Label>
              <Select value={formData.wantsToChangeIndustry} onValueChange={(value) => setFormData(prev => ({ ...prev, wantsToChangeIndustry: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz opcję" />
                </SelectTrigger>
                <SelectContent>
                  {industryChangeOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workDescription">Opis wykonywanej pracy (opcjonalnie)</Label>
              <Textarea
                id="workDescription"
                placeholder="Podaj przykładowe zadania w codziennej pracy (max 6 zdań)"
                value={formData.workDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={saving}
              className="w-full bg-cta text-cta-foreground hover:bg-cta/90"
            >
              {saving ? "Zapisywanie..." : "Zakończ i zapisz"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CandidateAdditional;
