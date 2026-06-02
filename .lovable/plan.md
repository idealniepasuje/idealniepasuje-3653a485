# Plan: Flow kontaktu pracodawca → kandydat

## 1. Baza danych (migracja)

**Tabela `candidate_test_results` — dodać kolumny:**
- `getting_to_know` jsonb default `'{}'` — odpowiedzi na 4 pytania „Daj się poznać"
- `profile_ready` boolean default false — czy profil gotowy do odblokowania (komplet pól)

**Tabela `match_results` — dodać kolumny:**
- `unlocked_at` timestamptz — kiedy pracodawca odblokował pełny profil
- `linkedin_requested_at` timestamptz
- `profile_completion_requested_at` timestamptz
- `interview_invited_at` timestamptz
- `interview_type` text — 'online'|'phone'|'onsite'
- `interview_calendar_link` text
- `interview_message` text

**Tabela `candidate_messages` (nowa)** — wiadomości od pracodawcy do kandydata:
- id, match_result_id, candidate_user_id, employer_user_id, type ('linkedin_request'|'profile_completion'|'interview_invite'), content text, metadata jsonb, read_at, created_at
- RLS: kandydat widzi swoje, pracodawca widzi swoje wysłane; insert tylko pracodawca.

**RLS na `candidate_test_results`:**
- Zaktualizować politykę „Employers can view matched candidates" tak by `getting_to_know`, `linkedin_url`, `work_description` itp. były dostępne dopiero gdy `match_results.unlocked_at IS NOT NULL` LUB `status='interested'`. Najprościej: dodać widok / funkcję `get_candidate_unlocked(...)` SECURITY DEFINER zwracającą pełne dane tylko po odblokowaniu, a politykę SELECT zawęzić do podstawowych kolumn (już mamy basic match data). Alternatywnie utrzymać obecną politykę i filtrować w UI — ale to nie jest bezpieczne. Wybieram: RPC SECURITY DEFINER `get_candidate_full_profile(match_id)` która sprawdza odblokowanie i zwraca pełne dane.

## 2. Frontend — kandydat

**`CandidateAdditional.tsx`** — dodać sekcję „Daj się poznać" z 4 textareami:
- Jakie zadania lubisz robić w pracy?
- Jakie problemy lubisz rozwiązywać?
- Co motywuje Cię poza wynagrodzeniem?
- Z czego jesteś najbardziej dumny/dumna?

Zapisywać do `getting_to_know`. Po zapisie ustawiać `profile_ready=true` jeśli wszystkie pola wypełnione + `work_description` + `experience`.

**Inbox kandydata** — strona/sekcja wyświetlająca `candidate_messages` (prośba o LinkedIn, prośba o uzupełnienie profilu, zaproszenie na rozmowę).

## 3. Frontend — pracodawca

**`EmployerCandidateDetail.tsx`:**
- Gdy `status='interested'` → pokaż ikonę koperty „Kontakt"
- Modal kontaktu z 3 przyciskami:
  1. **Zaproś na rozmowę** — wybór typu (online/telefon/stacjonarna), input link do kalendarza, textarea z gotowym szablonem → zapisz w `match_results` i wyślij `candidate_messages` typu `interview_invite`
  2. **Poproś o LinkedIn** — widoczne tylko gdy kandydat nie podał `linkedin_url`. Gotowa edytowalna wiadomość → insert do `candidate_messages`
  3. **Odblokuj profil** — jeśli `profile_ready=false` → przycisk „Poproś o uzupełnienie profilu" (wysyła wiadomość). Jeśli `profile_ready=true` → przycisk „Odblokuj" ustawia `unlocked_at=now()`.
- Po odblokowaniu wywołać RPC `get_candidate_full_profile` i pokazać: LinkedIn, work_description, getting_to_know (4 odpowiedzi).

## 4. i18n
Dodać klucze PL/EN dla wszystkich nowych etykiet, szablonów wiadomości.

## Techniczne szczegóły

- Szablony wiadomości jako stałe w `src/data/messageTemplates.ts` (PL/EN).
- Modal: shadcn `Dialog` + `Tabs` lub 3 sekcje.
- Stan `profile_ready` aktualizowany triggerem po update `candidate_test_results` (sprawdza komplet pól) — lub w aplikacji przy zapisie.
- Zachować obecną zasadę anonimowości: imię i nazwisko + LinkedIn + getting_to_know widoczne dopiero po `unlocked_at`.
