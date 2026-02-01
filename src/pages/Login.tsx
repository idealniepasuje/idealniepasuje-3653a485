import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Get user type to redirect appropriately
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("user_id", data.user.id)
          .single();

        toast.success("Zalogowano pomyślnie!");
        
        if (profile?.user_type === "employer") {
          navigate("/employer/dashboard");
        } else {
          navigate("/candidate/dashboard");
        }
      }
    } catch (error: any) {
      toast.error("Wystąpił błąd podczas logowania");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Wróć do strony głównej
        </Link>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">idealnie<span className="text-accent">pasuje</span></span>
            </div>
            <CardTitle className="text-2xl">Zaloguj się</CardTitle>
            <CardDescription>
              Wprowadź dane, aby kontynuować
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-cta text-cta-foreground hover:bg-cta/90" disabled={loading}>
                {loading ? "Logowanie..." : "Zaloguj się"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Nie masz konta?{" "}
              <Link to="/register" className="text-accent hover:underline font-medium">
                Zarejestruj się
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
