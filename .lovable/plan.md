# Funkcjonalność: Znajomość narzędzi

## 1. Lista narzędzi (stała, w kodzie)
Plik: `src/data/tools.ts` — zamknięty katalog kategorii i narzędzi z tłumaczeniami PL/EN. Kandydat i pracodawca wybierają WYŁĄCZNIE z tej listy (brak dodawania/edycji/usuwania).

Poziomy (wspólne): `basic | intermediate | advanced | expert`.

## 2. Schemat bazy

Nowe kolumny:
- `candidate_test_results.tools` — `jsonb`, domyślnie `[]`. Format: `[{ "tool_id": "jira", "level": "advanced" }, ...]`
- `job_offers.required_tools` — `jsonb`, domyślnie `[]`. Format: `[{ "tool_id": "jira", "level": "intermediate" }, ...]`

Nowy status na istniejącej tabeli `match_results` (lub powiązanej akcji): rozszerzenie tabeli `candidate_messages` o typ `tools_completion_request` i kolumnę `tools_request_status`:
- na `match_results` dokładamy `tools_request_status text` z wartościami: `not_sent | sent_auto | awaiting | completed | no_response` (default `not_sent`).
- trigger: gdy kandydat zapisze niepustą tablicę `tools`, wszystkie `match_results` tego kandydata o statusie `awaiting`/`sent_auto` → `completed`.

Walidacja: CHECK na poziomach (`basic|intermediate|advanced|expert`).

## 3. UI Kandydata — `CandidateAdditional.tsx`
Nowa sekcja „Znajomość narzędzi":
- Accordion po kategoriach.
- Wyszukiwarka (filtr po nazwie narzędzia).
- Dla każdego narzędzia checkbox + dropdown poziomu (pokazuje się po zaznaczeniu).
- Wiele narzędzi.
- Zapis do `candidate_test_results.tools`.
- Pełna responsywność, design tokens (`bg-cta`, gold/teal).

## 4. UI Pracodawcy — `EmployerOfferForm.tsx`
Identyczna sekcja w kroku „Rola" oferty:
- Te same kategorie/wyszukiwarka/accordion.
- Dla każdego wybranego narzędzia: dropdown wymaganego poziomu.
- Zapis do `job_offers.required_tools`.

## 5. Widok pracodawcy: brak danych kandydata
W `EmployerCandidateDetail.tsx` (i karcie kandydata):
- Jeśli `tools.length === 0` → alert: „Profil kandydata jest niekompletny – brak informacji o znajomości narzędzi."
- Przycisk „Poproś o uzupełnienie" (widoczny zawsze gdy brak danych).
- Gdy pracodawca kliknie „Zainteresowany" (`match_results.status = 'interested'`) a `tools` puste → **automatycznie** wywołanie edge function `send-tools-completion-request` (bez dodatkowej akcji). Status `match_results.tools_request_status` → `sent_auto` → `awaiting`.
- Wyświetlenie statusu prośby (badge): Nie wysłano / Wysłano automatycznie / Oczekuje / Uzupełniono / Brak odpowiedzi.

Po 7 dniach bez odpowiedzi (opcjonalny cron — w tej iteracji tylko logika klienta: status `awaiting` pokazujemy zawsze; `no_response` ustawiamy ręcznie później; nie wprowadzamy crona teraz, żeby nie rozszerzać zakresu).

## 6. Edge Function: `send-tools-completion-request`
Analogiczna do `send-profile-completion-request`:
- Weryfikacja: caller = employer, istnieje `match_results` employer↔candidate.
- Wysyła e-mail (Gmail SMTP, jak istniejące funkcje) z treścią:
  > „Pracodawca jest zainteresowany Twoim profilem. Prosimy o uzupełnienie informacji dotyczących znajomości narzędzi, aby umożliwić dalszą ocenę dopasowania do stanowiska."
- Link CTA → `/candidate/additional#tools`.
- Wstawia rekord do `candidate_messages` (typ `tools_completion_request`) → powiadomienie w aplikacji (inbox już istnieje: `CandidateMessagesInbox.tsx`).
- Aktualizuje `match_results.tools_request_status = 'awaiting'`.

## 7. Powiadomienie w aplikacji + deep link
- `CandidateMessagesInbox` rozpoznaje nowy typ i renderuje link „Uzupełnij narzędzia" → `/candidate/additional` z auto-scroll do sekcji `#tools`.
- W `CandidateAdditional.tsx` dodajemy `id="tools"` na sekcji + `useEffect` scrollujący gdy hash.

## 8. Matching (przygotowanie, bez zmiany wag w tej iteracji)
- W `match_details` zapisujemy `tools_match`: liczba pokrytych narzędzi / wymagane, średnia delta poziomów.
- Nie zmieniamy aktualnych wag — pole gotowe dla przyszłego scoringu/rekomendacji.

## 9. i18n
PL/EN dla:
- nazw kategorii,
- etykiet poziomów,
- nowych komunikatów (alert, statusy, treść maila).
Nazwy narzędzi pozostają w oryginale (marki własne).

## Pliki do zmiany/utworzenia
- `src/data/tools.ts` (nowy)
- `supabase/migrations/...` (kolumny + CHECK + ewentualny default)
- `src/pages/candidate/CandidateAdditional.tsx`
- `src/pages/employer/EmployerOfferForm.tsx`
- `src/pages/employer/EmployerCandidateDetail.tsx`
- `src/components/match/CandidateCard.tsx` (badge braku narzędzi)
- `src/components/CandidateMessagesInbox.tsx` (nowy typ + deep link)
- `supabase/functions/send-tools-completion-request/index.ts` (nowy)
- `src/i18n/locales/pl.json`, `en.json`

## Poza zakresem (do potwierdzenia)
- Cron oznaczający `no_response` po N dniach.
- Przeliczenie istniejących `match_results.match_details` o `tools_match`.
- Zmiana wag algorytmu dopasowania.
