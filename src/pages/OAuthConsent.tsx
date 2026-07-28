import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Beta namespace on @supabase/supabase-js — declare the shape locally.
type AuthOAuthClient = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function authOAuth(): AuthOAuthClient {
  return (supabase.auth as any).oauth as AuthOAuthClient;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Brak parametru authorization_id.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await authOAuth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message || String(error));
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const oauth = authOAuth();
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        setError(error.message || String(error));
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("Serwer autoryzacji nie zwrócił adresu przekierowania.");
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? String(e));
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Nie udało się załadować prośby o autoryzację</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Ładowanie…</p>
      </div>
    );
  }

  const clientName = details?.client?.name ?? "aplikacja zewnętrzna";
  const scopes: string[] = Array.isArray(details?.scopes)
    ? details.scopes
    : typeof details?.scope === "string"
      ? details.scope.split(/\s+/).filter(Boolean)
      : [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Połącz {clientName} z idealnie pasuje</CardTitle>
          <CardDescription>
            {clientName} będzie mogła korzystać z narzędzi idealnie pasuje w Twoim imieniu, w granicach Twoich uprawnień.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scopes.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-1">Zakres dostępu:</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {scopes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            To nie omija zasad dostępu ani polityk bazy danych aplikacji.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
              Odrzuć
            </Button>
            <Button disabled={busy} onClick={() => decide(true)} className="bg-cta text-cta-foreground hover:bg-cta/90">
              Zatwierdź
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
