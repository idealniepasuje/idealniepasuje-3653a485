# Audyt migracyjny: Lovable → Cursor + GitHub + Vercel (backend zostaje w obecnym Supabase)

Audyt wyłącznie analityczny. Nie wprowadzono żadnych zmian w kodzie.

## 1. Zależności specyficzne dla Lovable

| Element | Gdzie | Status |
|---|---|---|
| `lovable-tagger` (devDependency, plugin Vite tylko w trybie development) | `package.json`, `vite.config.ts` | wymaga zmiany (usunąć albo zostawić — build produkcyjny go nie używa, ale paczka musi być instalowalna z npm) |
| `@lovable.dev/cloud-auth-js` — logowanie Google i Apple | `src/integrations/lovable/index.ts`, `src/pages/Login.tsx`, `src/pages/Register.tsx` | wymaga zmiany (kluczowe — patrz sekcja 5) |
| `@lovable.dev/mcp-js` + `mcpPlugin()` generujący `supabase/functions/mcp/index.ts` | `vite.config.ts`, `src/lib/mcp/*`, `supabase/functions/mcp` | opcjonalne (patrz sekcja 7) |
| `previewAuthStorage.ts` — brokerowanie sesji do edytora Lovable przez postMessage | `src/integrations/supabase/client.ts` | działa bez zmian (poza domenami Lovable zwraca `localStorage`), zalecane uproszczenie |
| Auto-generowane pliki „nie edytować” (`client.ts`, `types.ts`, `supabase/config.toml`) | `src/integrations/supabase/` | działa bez zmian, po migracji stają się zwykłymi plikami (typy generuje `supabase gen types`) |
| `.lovable/`, `.workspace/` | katalog główny | opcjonalne (można usunąć) |
| README z linkami do Lovable | `README.md` | opcjonalne |

## 2. Zmienne środowiskowe

Frontend (Vite, prefiks `VITE_`, trafiają do przeglądarki):
- `VITE_SUPABASE_URL` — `src/integrations/supabase/client.ts`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (klucz anon — publiczny, OK) — tamże
- `VITE_SUPABASE_PROJECT_ID` — `src/lib/mcp/index.ts`, `src/pages/AgentConnect.tsx`

Edge Functions (wstrzykiwane automatycznie przez Supabase):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — działa bez zmian

Uwaga: plik `.env` **nie jest** w `.gitignore`. Zawiera tylko wartości publiczne, ale przed pushem do GitHuba należy go dodać do `.gitignore` i zostawić `.env.example`.

## 3. Sekrety wymagane przez Edge Functions

- `GMAIL_APP_PASSWORD` — używany w 12 funkcjach mailowych (SMTP Gmail przez `denomailer`). **Musi być ustawiony w Supabase** (Edge Function secrets). Adres nadawcy jest zaszyty w kodzie funkcji.
- `SUPABASE_SERVICE_ROLE_KEY` — dostarczany przez Supabase automatycznie; funkcje mailowe autoryzują wywołania porównując nagłówek `Authorization` z tym kluczem (tylko server-to-server).
- Brak zależności od `LOVABLE_API_KEY`, Lovable AI Gateway i connectorów — nic z tego nie jest używane.

## 4. Miejsca zależne od domen lovable.app / preview

- **15 Edge Functions** ma zaszyty na sztywno `https://idealniepasuje.lovable.app/...` w linkach w e-mailach (`send-*`, `generate-matches`, `generate-candidate-matches`, `invite-employee`). Wymaga zmiany: przenieść do sekretu np. `PUBLIC_APP_URL` (albo podmienić na `https://idealniepasuje.pl`).
- `src/pages/employer/EmployerCulture.tsx` — `feedback_url: 'https://idealniepasuje.lovable.app/employer/feedback'`. Wymaga zmiany (lepiej `window.location.origin`).
- `src/integrations/supabase/previewAuthStorage.ts` — lista stref preview Lovable; poza nimi nieaktywne. Działa bez zmian.
- `index.html` — CSP `connect-src` zawiera `https://*.lovable.dev` i `https://*.lovable.app`. Działa bez zmian; do przeglądu przy usuwaniu logowania Lovable.

## 5. Auth

- **Email + hasło** (`supabase.auth.signInWithPassword`, `signUp` z `emailRedirectTo: window.location.origin`) — działa bez zmian; wymaga tylko dodania nowych domen do Redirect URLs w Supabase.
- **Google i Apple** — idą przez `@lovable.dev/cloud-auth-js`, czyli przez hostowany OAuth Lovable (`https://oauth.lovable.app`). To jest największe ryzyko migracji: **po odłączeniu Lovable logowanie społecznościowe przestanie działać**. Wymaga zmiany na natywne `supabase.auth.signInWithOAuth({ provider: 'google' | 'apple', options: { redirectTo } })` z własnym Client ID/Secret Google i Apple skonfigurowanym w Supabase Auth.
- Redirecty: `Login.tsx` i `Register.tsx` używają `window.location.origin` + sanitizowanego `next` — poprawne i przenośne. Wymaga zmiany tylko konfiguracja Site URL / Redirect URLs w Supabase.
- Uwaga: `redirect_uri` do OAuth może wskazywać chronioną trasę przez `?next=` — po przejściu na natywny OAuth kierować na origin lub `/auth/callback`, a docelową ścieżkę trzymać osobno.

## 6. Edge Functions (20)

Wszystkie są zwykłym kodem Deno na Supabase — **działają bez zmian po migracji**, pod warunkiem że:
- zostaje ten sam projekt Supabase (zostaje),
- `GMAIL_APP_PASSWORD` pozostaje ustawiony,
- adresy w e-mailach zostaną zaktualizowane (sekcja 4).

Zmiana dotyczy tylko sposobu deployu: zamiast Lovable — `supabase functions deploy <nazwa>` z CLI lub GitHub Actions. Wyjątek: `supabase/functions/mcp/index.ts` jest generowany automatycznie (sekcja 7). CORS jest ustawiony na `*`, więc zmiana domeny frontendu niczego nie psuje.

## 7. MCP i funkcje opcjonalne

- Serwer MCP (`src/lib/mcp/*` → `supabase/functions/mcp`) jest budowany przez `mcpPlugin()` z `@lovable.dev/mcp-js` w `vite.config.ts`. Paczka jest publiczna na npm, więc może działać dalej, ale to zależność vendorowa. Opcjonalne: zostawić, zamrozić wygenerowany plik funkcji i usunąć plugin, albo usunąć całość razem ze stroną `/agent`.
- OAuth server dla MCP (`OAuthConsent.tsx`) opiera się na issuerze Supabase, nie na Lovable — działa bez zmian.
- `AgentConnect.tsx` buduje URL MCP z `VITE_SUPABASE_PROJECT_ID` — działa bez zmian, o ile zmienna jest ustawiona w Vercel.

## 8. Do skonfigurowania po migracji

Vercel:
- Framework Vite, `npm run build`, output `dist`
- Zmienne: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (Production + Preview)
- SPA rewrite — na Vercel dla Vite deep-linki działają domyślnie; jeśli pojawi się 404 przy odświeżeniu, dodać `vercel.json` z rewrite `/(.*) → /index.html`
- Domeny `idealniepasuje.pl` i `www` przepiąć DNS z Lovable na Vercel (to jest moment nieodwracalny — robić na końcu)

Supabase:
- Auth → Site URL i Redirect URLs: domena produkcyjna, `localhost:8080`, wildcard preview Vercel
- Auth → Providers: własne Google i Apple (nowe Client ID/Secret)
- Edge Functions secrets: `GMAIL_APP_PASSWORD`, nowy `PUBLIC_APP_URL`
- Deploy funkcji z CLI/CI zamiast z Lovable

GitHub/Cursor:
- `.env` do `.gitignore` + `.env.example`
- `supabase/migrations` (79 plików) już w repo — historia migracji zachowana
- `supabase link --project-ref ...` do lokalnej pracy; `supabase gen types typescript` zamiast auto-generacji Lovable

## 9. Ryzyka bezpieczeństwa i hardcoded URL

- **Krytyczne funkcjonalnie:** logowanie Google/Apple zależy od infrastruktury Lovable — bez wcześniejszej wymiany na natywny OAuth użytkownicy społecznościowi stracą dostęp do kont.
- `.env` śledzony przez git (tylko klucze publiczne, ale zły nawyk — przy okazji łatwo wpuścić do repo prawdziwy sekret).
- 16 miejsc z zaszytym `idealniepasuje.lovable.app` — po wyłączeniu projektu Lovable linki w e-mailach przestaną działać.
- CORS `Access-Control-Allow-Origin: *` we wszystkich funkcjach — funkcje mailowe są chronione porównaniem z service role key, ale te wywoływane przez użytkownika warto zawęzić do własnej domeny.
- CSP w `index.html` zawiera domeny Lovable — do usunięcia po odcięciu.
- Service role key jest używany wyłącznie po stronie Edge Functions — poprawnie, nigdzie nie wycieka do frontendu.

## 10. Checklista migracji (od najbezpieczniejszych kroków)

**Faza 1 — zero ryzyka (Lovable dalej działa)**
1. Podłączyć GitHub do projektu Lovable, sklonować repo lokalnie, otworzyć w Cursorze.
2. `npm install`, `npm run dev` — potwierdzić, że aplikacja lokalnie działa na obecnym Supabase.
3. Dodać `.env` do `.gitignore`, utworzyć `.env.example`.
4. `supabase login` + `supabase link` — potwierdzić dostęp CLI do bazy i funkcji.

**Faza 2 — przygotowanie, bez odłączania**
5. Wprowadzić `PUBLIC_APP_URL` jako sekret Supabase i zamienić zaszyte adresy w 15 funkcjach + `EmployerCulture.tsx` (na razie z wartością `https://idealniepasuje.lovable.app`).
6. Wdrożyć te funkcje z CLI — potwierdzić, że deploy spoza Lovable działa.
7. Założyć własne aplikacje OAuth: Google Cloud Console i Apple Developer; skonfigurować providerów w Supabase Auth.
8. Przepisać `Login.tsx`/`Register.tsx` na natywne `supabase.auth.signInWithOAuth`; przetestować lokalnie oba logowania.

**Faza 3 — Vercel równolegle do Lovable**
9. Zaimportować repo do Vercel, ustawić trzy zmienne `VITE_*`, wdrożyć na tymczasową domenę `*.vercel.app`.
10. Dodać domenę Vercel do Redirect URLs w Supabase; przetestować pełny flow: rejestracja, logowanie e-mail, Google, Apple, e-maile, dopasowania, zaproszenia, MCP.

**Faza 4 — przełączenie domeny**
11. Przepiąć `idealniepasuje.pl` i `www` z Lovable na Vercel (DNS).
12. Zmienić `PUBLIC_APP_URL` na `https://idealniepasuje.pl` i przewdrożyć funkcje.
13. Zaktualizować Site URL w Supabase, sprawdzić linki w świeżo wysłanych e-mailach.

**Faza 5 — sprzątanie (dopiero po kilku dniach stabilnej pracy)**
14. Usunąć `lovable-tagger`, `@lovable.dev/cloud-auth-js`, `src/integrations/lovable/`, uprościć `previewAuthStorage.ts`.
15. Zdecydować o MCP: zamrozić wygenerowaną funkcję i usunąć `mcpPlugin()`, albo usunąć moduł.
16. Wyczyścić CSP z domen Lovable, zaktualizować README, usunąć `.lovable/`.
17. Odłączyć/zarchiwizować projekt w Lovable.

**Punkt bez odwrotu:** krok 11. Do tego momentu każdy krok można wycofać.
