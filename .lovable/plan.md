# Audyt READ-ONLY — IdealniePasuje (24.08.2026)

Nie wprowadzono żadnych zmian. Poniżej wyniki weryfikacji kodu, bazy i testów.

## A. Organizacje / pracownicy

| # | Obszar | Status | Uwagi |
|---|---|---|---|
| 1 | Tworzenie organizacji | DZIAŁA | `useOrganization` sprawdza membership → owned org → insert z obsługą 23505. DB: 11 organizacji, 0 duplikatów `owner_user_id`. |
| 2 | Zaproszenie e-mailem | CZĘŚCIOWO | `invite-employee` istnieje, w bazie 1 zaproszenie. Doręczenie SMTP niezweryfikowane runtime. |
| 3 | Powrót z loginu do zaproszenia | DZIAŁA (kod) | `ProtectedRoute` → `/login?next=`, `Login.tsx` sanitizuje i nawiguje, `/register?next=` przekazywany. Runtime niezweryfikowany. |
| 4 | Akceptacja → `active` | CZĘŚCIOWO | 1 aktywny pracownik w bazie; flow potwierdzony kodem `accept-employee-invitation`, brak testu runtime. |
| 5 | Zgoda z członkostwa, nie per oferta | DZIAŁA | Triggery `sync_assessments_on_membership_change` + `sync_internal_assessment_consent_membership`. DB: 0 aktywnych pracowników bez `granted`. |
| 6 | Odłączenie → revoke + czyszczenie | DZIAŁA | Trigger `enforce_internal_assessment_consent` zeruje `overall/competence/culture/extra/match_details/computed_at`. DB: 0 wyników przy statusie ≠ granted. |
| 7 | RLS między organizacjami | DZIAŁA | RLS włączone na wszystkich 4 tabelach org + `internal_assessments`, polityki oparte o `is_org_member/is_org_manager/is_active_org_employee`. |

## B. Oferty / tryby

| # | Status | Uwagi |
|---|---|---|
| 8 | DZIAŁA | Kombinacje obsłużone w `EmployerOfferForm`, `EmployerOrderDetail`, `EmployerDashboard`. |
| 9 | DZIAŁA | `AnalyzeEmployeeDialog.enableInternal` robi UPDATE wyłącznie `analyze_internal_team=true`. |
| 10 | CZĘŚCIOWO | Blokada w UI (`EmployerOfferForm` linia 302) i w `offerCompleteness.ts`. Brak CHECK constraint w bazie — zapis przez API/Edge mógłby ominąć regułę. DB: 0 takich rekordów. |
| 11 | DZIAŁA | Generatory matchy filtrują po `recruit_external_candidates`. |
| 12 | DZIAŁA | `generate-internal-assessments` odrzuca ofertę bez `analyze_internal_team` (400). |

## C. Analiza pracownika

| # | Status | Uwagi |
|---|---|---|
| 13 | DZIAŁA | `AnalyzeEmployeeDialog` renderuje `InternalAssessmentDetails` inline + „Wróć do ról”, bez nawigacji. |
| 14 | DZIAŁA | `EmployerOrderDetail`: pracownicy (147) → kandydaci (153) → szczegóły. |
| 15 | DZIAŁA | Zapytanie pobiera wszystkie pola wynikowe i `match_details`; NULL renderowane jako brak danych. |
| 16 | DZIAŁA | `CandidateOrganizations` bez per-offer consent. |

## D. Kandydat / rynek zewnętrzny

| # | Status | Uwagi |
|---|---|---|
| 17 | DZIAŁA | Switch tylko w `CandidateProfile.tsx`; brak w `CandidateOrganizations`. |
| 18 | CZĘŚCIOWO | Backend (3 Edge Functions) i `CandidateDashboard`/`CandidateMatches` respektują OFF. Analizy wewnętrzne niezależne. |
| 19 | DZIAŁA | Odwrócenie flagi przywraca matching. |
| 20 | **REGRESJA** | `CandidateEmployerDetail.tsx` nie sprawdza `open_to_external_offers` — wejście bezpośrednim linkiem `/candidate/employer/:id` przy OFF nadal pokazuje zewnętrzną ofertę. |

## E. Formularz kandydata

| # | Status | Uwagi |
|---|---|---|
| 21 | DZIAŁA | Brak gwiazdek i walidacji dla gtk (komentarz linia 280); trigger `compute_candidate_profile_ready` nie bramkuje gtk. |
| 22 | DZIAŁA | 4 języki, tryb pracy, branże i doświadczenie nadal obowiązkowe (trigger + UI). |

## F. Powiadomienia / wiadomości

| # | Status | Uwagi |
|---|---|---|
| 23 | DZIAŁA | Banner feedbacku zapisuje `profiles.feedback_modal_dismissed_at`; `EmployerMessagesInbox` filtruje `!employer_read_at` + Dialog „Historia”. |
| 24 | DZIAŁA | `CandidateMessagesInbox`: `active = !read_at`, `handled` w Dialogu historii. |
| 25 | **REGRESJA** | Dwa problemy: (a) ręczne `X` tylko dla `employer_reply` (linia 204) — `linkedin_request`, `profile_completion`, `tools_completion_request`, `interview_*` nie da się zamknąć ręcznie; (b) `CandidateAdditional` czyści `profile_completion` tylko gdy `gtkComplete`, a gtk jest już opcjonalne → prośba zawiśnie na stałe. DB potwierdza zaległości: 5 nieprzeczytanych `profile_completion`, 3 `linkedin_request`. |

## G. Dashboard / UI

| # | Status | Uwagi |
|---|---|---|
| 26 | DZIAŁA | Warunkowe „Twoi pracownicy” (`/employer/order/:id#team`) i „Kandydaci”. Usunięcie „Oferta” nie odcięło edycji — dostęp z `EmployerOffers` i `EmployerOrderDetail`. |
| 27 | DZIAŁA | Chipsy `inline-flex items-center h-9`, count jako inline badge. |
| 28 | CZĘŚCIOWO | Wszystkie CTA wskazują istniejące trasy; kotwica `#team` obsłużona. Runtime niezweryfikowany. |

## H. Bezpieczeństwo / dane

| # | Status | Wynik |
|---|---|---|
| 29 | DZIAŁA | `anon` SELECT/INSERT = false dla `organizations`, `organization_members`, `organization_employees`, `organization_invitations`, `internal_assessments`. |
| 30 | DZIAŁA | 0 aktywnych pracowników bez `granted`. |
| 31 | DZIAŁA | 0 `granted` bez aktywnego członkostwa. |
| 32 | DZIAŁA | 0 wyników przy `revoked/declined/pending`. |
| 33 | DZIAŁA | 0 duplikatów `owner_user_id`. |
| 34 | DZIAŁA | `enforce_org_owner_role` blokuje nadanie/zmianę/usunięcie ownera przez admina. |
| 35 | **PROBLEM (niski)** | 1 osierocona organizacja `IdealniePasuje` (`b72ba214…`, 2026-08-24 03:48) — owner usunięty z `auth.users`, ale ma 1 ofertę i 1 membership. `handle_user_deletion` nie sprząta `organizations`/`organization_members`/`job_offers.organization_id`. Ryzyko: martwe dane i oferta bez właściciela; nie jest to wyciek (RLS wymaga membership). |

## Uwaga dodatkowa (poza listą)
`anon` ma nadal SELECT/INSERT na `candidate_test_results`, `employer_profiles`, `job_offers`, `profiles`, `candidate_feedback`, `employer_feedback`. Dostęp jest zamknięty politykami RLS, ale to szersze uprawnienia niż potrzebne.

## I. Testy i deploy

| # | Status | Wynik |
|---|---|---|
| 36 | DZIAŁA | Typecheck bez błędów. Vitest **48/48** przeszło. |
| 37 | CZĘŚCIOWO | Scenariusze zalogowane ocenione z kodu — **niezweryfikowane runtime** (brak sesji testowej; audyt read-only bez modyfikacji danych). |
| 38 | CZĘŚCIOWO | Migracje bazy i triggery są **live** (potwierdzone zapytaniami do produkcyjnej bazy). Edge Functions obecne w repo — status ostatniego deployu **niezweryfikowany**. Zmiany frontendu z dzisiejszych commitów (do `780374e`) są **tylko w preview** — brak publikacji. |

## TOP 5 do naprawy przed publikacją

1. **P0 — Zawieszone prośby u kandydata (poz. 25).** `profile_completion` nie jest już czyszczone (gtk opcjonalne), a większości typów nie da się zamknąć ręcznie. 8 nieprzeczytanych rekordów w bazie. Fix: warunek czyszczenia oparty o realnie brakujące dane + dismiss dla wszystkich typów.
2. **P0 — Wyciek widoku zewnętrznej oferty przy OFF (poz. 20).** Dodać guard `open_to_external_offers` w `CandidateEmployerDetail.tsx`.
3. **P1 — Brak twardej reguły „oba tryby false” w bazie (poz. 10).** Dodać CHECK constraint na `job_offers`.
4. **P1 — Osierocona organizacja z ofertą (poz. 35).** Rozszerzyć `handle_user_deletion` o sprzątanie org/members/offers i wyczyścić istniejący rekord.
5. **P2 — Nadmiarowe granty `anon`** na `candidate_test_results`, `employer_profiles`, `job_offers`, `profiles` — zawęzić do faktycznie publicznych ścieżek.
