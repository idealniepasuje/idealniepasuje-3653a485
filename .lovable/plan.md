# Analiza obecnych pracowników firmy względem oferty (moduł internal)

Cel: pracodawca może analizować własny zespół względem konkretnej oferty/roli, w pełni oddzielnie od kandydatów z rynku, wykorzystując istniejący algorytm dopasowania bez jego duplikowania.

## Stan obecny (zweryfikowany)

- `job_offers` należą do jednego `user_id` (pracodawcy). Brak pojęcia organizacji.
- `match_results` jest jedyną tabelą wyników: klucz `(employer_user_id, candidate_user_id, job_offer_id)`, statusy `pending/viewed/considering/rejected`, RLS pozwala kandydatowi i pracodawcy widzieć swoje wiersze.
- Matching liczą edge functions `generate-matches` (per pracodawca/oferta), `generate-candidate-matches` (per kandydat), `generate-all-matches`; wszystkie filtrują `job_offers.is_active = true` oraz kandydatów po `all_tests_completed = true`. Sam algorytm jest w `supabase/functions/_shared/matching.ts` i przyjmuje czyste struktury `CandidateData` + `JobOfferData` + kultura — nadaje się do ponownego użycia bez zmian.
- `profiles.user_type` to `candidate` | `employer`, pilnowane triggerem `prevent_user_type_change`.

## Architektura docelowa (minimalna i bezpieczna)

### 1. Organizacje
- `organizations` (nazwa, właściciel).
- `organization_members` (organization_id, user_id, rola: `owner`/`admin`/`recruiter`) — dla kont pracodawcy zarządzających firmą.
- `job_offers.organization_id` — nowa kolumna; backfill: dla każdego istniejącego pracodawcy tworzymy organizację z jego `employer_profiles.company_name` i podpinamy jego oferty. `user_id` zostaje (autor), ale docelowo uprawnienia liczone przez organizację.
- Funkcja SECURITY DEFINER `is_org_member(_org uuid, _user uuid, _min_role)` — używana w RLS, żeby uniknąć rekurencji.

### 2. Pracownicy (osobno od członków-adminów)
- `organization_employees` (organization_id, user_id, status: `invited`/`active`/`removed`, joined_at, removed_at).
- Pracownik to zwykły użytkownik (nadal `candidate`) — nie tworzymy typu konta `employee`. Konto i wyniki testów pozostają jego.
- `organization_invitations` (organization_id, email, token, status, expires_at, invited_by). Zaproszenie e-mailem, akceptacja świadoma przez zalogowanego użytkownika o tym adresie. Brak jakiegokolwiek wyszukiwania użytkowników systemu.
- Odłączenie = `status='removed'` + wygaszenie zgód; konto i wyniki nietknięte, firma traci dostęp natychmiast (RLS sprawdza status `active`).

### 3. Tryby oferty
- `job_offers.analyze_internal_team boolean default false`
- `job_offers.recruit_external_candidates boolean default true`
- CHECK: co najmniej jeden true.
- Backfill: wszystkie istniejące oferty = `recruit_external_candidates true`, `analyze_internal_team false` (zero zmian w obecnych danych i mailach).
- Edge functions matchingu dostają dodatkowy filtr `recruit_external_candidates = true` — oferta „tylko internal” znika z rynku zewnętrznego, ale zostaje aktywna.

### 4. Analiza wewnętrzna względem konkretnej roli
- `internal_assessments` (organization_id, job_offer_id, employee_user_id, consent_status: `pending`/`granted`/`revoked`, consent_at, revoked_at, overall_percent, competence_percent, culture_percent, extra_percent, match_details jsonb, computed_at). Unikalne `(job_offer_id, employee_user_id)`.
- Osobna tabela zamiast flagi w `match_results`: brak ryzyka wycieku pracownika do list kandydatów, brak kolizji z lifecycle statusów, brak zmian w istniejących zapytaniach i mailach.
- Wyliczenie: nowa edge function `generate-internal-assessments` importująca ten sam `_shared/matching.ts` — zero duplikacji algorytmu. Wejście: `job_offer_id` (+ opcjonalnie `employee_user_id`).
- Testy nie są powtarzane — użycie istniejących `candidate_test_results` pracownika.
- Wyniki liczymy i pokazujemy wyłącznie gdy `consent_status='granted'` i pracownik ma `all_tests_completed = true`; inaczej status „oczekuje na zgodę” / „niekompletny profil”.

### 5. Zgoda i kontrola pracownika
- Zgoda jest per (organizacja, oferta): pracownik widzi nazwę firmy, tytuł roli i zakres udostępnianych danych (wyniki kompetencji, kultura, kryteria dodatkowe — bez surowych odpowiedzi testowych).
- `candidate_test_results.open_to_external_offers boolean default true` — niezależny przełącznik udziału w rynku. Gdy `false`, kandydat jest pomijany przez `generate-matches` / `generate-all-matches` / `generate-candidate-matches`. Przynależność do organizacji nigdy nie zmienia tej flagi automatycznie.

### 6. RLS / uprawnienia
- Każda nowa tabela: GRANT dla `authenticated` (+ `service_role`), następnie ENABLE RLS.
- `organizations`/`organization_members`/`organization_employees`/`organization_invitations`: odczyt i zarządzanie tylko dla członków organizacji (przez `is_org_member`), pracownik widzi wyłącznie własne wiersze; zaproszenie widoczne po e-mailu zalogowanego użytkownika.
- `internal_assessments`: SELECT dla członków organizacji oraz dla samego pracownika (własny wiersz); UPDATE zgody wyłącznie przez pracownika i tylko kolumn zgody; zapis wyników wyłącznie przez service_role (edge function).
- Dostęp firmy do profilu pracownika (`candidate_test_results`): nowa polityka SELECT wyłącznie gdy istnieje `internal_assessments` z `consent_status='granted'` i aktywne członkostwo — bez rozszerzania istniejącej polityki `considering`.

### 7. UI
- Formularz oferty: dwa przełączniki trybu + walidacja „przynajmniej jeden”.
- Szczegóły oferty: gdy oba tryby aktywne — dwie sekcje/taby „Pracownicy firmy” i „Nowi kandydaci”; gdy jeden — bez tabów. Nigdzie nie nazywamy pracownika kandydatem (etykiety: pracownik, analiza zespołu, dopasowanie do roli).
- Nowa sekcja „Mój zespół” u pracodawcy: lista pracowników, zapraszanie e-mailem, statusy zgód, odłączanie.
- Panel kandydata/pracownika: „Moje firmy” (przynależności + odłączenie), lista próśb o zgodę na analizę roli (akceptuj/odrzuć/wycofaj), przełącznik „Chcę otrzymywać oferty z rynku”.

## Kolejność wdrożenia

1. Migracja 1: organizacje, członkowie, backfill organizacji dla obecnych pracodawców, `job_offers.organization_id`.
2. Migracja 2: flagi trybów oferty + CHECK + backfill; filtr `recruit_external_candidates` w trzech edge functions matchingu.
3. Migracja 3: pracownicy, zaproszenia, `internal_assessments`, polityki RLS, flaga `open_to_external_offers`.
4. Edge functions: `invite-employee` (e-mail), `accept-employee-invitation`, `generate-internal-assessments`.
5. UI pracodawcy: „Mój zespół”, tryby w formularzu oferty, sekcja pracowników w szczegółach oferty.
6. UI pracownika: zgody, przynależności, przełącznik rynku.
7. Weryfikacja: linter bazy, testy algorytmu (bez zmian w `_shared/matching.ts`), sprawdzenie, że dotychczasowe dopasowania i maile działają identycznie.

## Wpływ na obecne dane

- Żadnych zmian w `match_results` ani w istniejących politykach kandydat–pracodawca.
- Wszystkie obecne oferty zachowują dotychczasowe zachowanie (tylko rekrutacja zewnętrzna).
- Domyślne `open_to_external_offers = true` — nikt nie wypada z obecnego matchingu.

## Otwarte założenia (przyjęte, do korekty)

- Zaproszenie identyfikuje pracownika po e-mailu konta; brak konta = zaproszenie do rejestracji.
- Pracownik bez ukończonych testów jest widoczny na liście zespołu z informacją o braku wyników, bez procentu.
- Zakres danych widoczny firmie = ten sam co dla statusu „zainteresowany” przy kandydacie, ale bez danych kontaktowych poza tymi, które firma już posiada.
