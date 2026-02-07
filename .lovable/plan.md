
# Plan naprawy dopasowywania kandydata do pracodawcy

## Zdiagnozowane problemy

1. **Edge function `generate-candidate-matches` nie jest wdrożona** - zwraca błąd 404, co oznacza że wywołanie po stronie kandydata nie działa

2. **Niezgodność schematu danych** - funkcja `generate-candidate-matches` używa starego modelu dopasowania (kandydat → profil pracodawcy), podczas gdy baza danych wymaga dopasowania per-zlecenie (`job_offer_id`):
   - Constraint unikalności: `(employer_user_id, candidate_user_id, job_offer_id)`
   - Funkcja używa: `onConflict: 'employer_user_id,candidate_user_id'` (bez job_offer_id)

3. **Brak job_offer_id w upsert** - funkcja nie przekazuje `job_offer_id` przy zapisie, co powoduje błędy zapisu

## Stan bazy danych

| Tabela | Liczba rekordów |
|--------|-----------------|
| Kandydaci (all_tests_completed=true) | 3 |
| Pracodawcy (profile_completed=true) | 2 |
| Aktywne oferty pracy | 2 |
| Dopasowania (match_results) | 0 |

## Plan naprawy

### 1. Aktualizacja funkcji `generate-candidate-matches`

Przekształcenie logiki z dopasowania do profilu pracodawcy na dopasowanie do każdej aktywnej oferty pracy:

- Pobranie wszystkich aktywnych ofert (`job_offers` z `is_active = true`)
- Dla każdej oferty pobranie profilu kultury pracodawcy z `employer_profiles`
- Obliczenie dopasowania: kompetencje z oferty, kultura z profilu pracodawcy
- Zapis z poprawnym `job_offer_id` i zgodnym `onConflict`

### 2. Wdrożenie funkcji

Po aktualizacji kodu - automatyczne wdrożenie edge function

### 3. Zmiany w kodzie

**Plik: `supabase/functions/generate-candidate-matches/index.ts`**

Główne zmiany:
- Dodanie interfejsu `JobOfferData` z polami wymagań kompetencji
- Zmiana zapytania z `employer_profiles` na `job_offers` + `employer_profiles`
- Aktualizacja `calculateCompetenceMatch` aby używała wymagań z oferty
- Dodanie `job_offer_id` do upsert
- Zmiana `onConflict` na `'employer_user_id,candidate_user_id,job_offer_id'`

## Szczegóły techniczne

```text
Aktualny przepływ (błędny):
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Kandydat   │ ──▶ │ employer_profiles │ ──▶ │ match_results │
│ (user_id)   │     │  (bez job_offer)  │     │ (brak oferty) │
└─────────────┘     └──────────────────┘     └───────────────┘

Poprawny przepływ:
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Kandydat   │ ──▶ │ job_offers  │ ──▶ │ employer_profiles │ ──▶ │ match_results │
│ (user_id)   │     │ (is_active) │     │ (kultura firmy)  │     │(z job_offer_id)│
└─────────────┘     └─────────────┘     └──────────────────┘     └───────────────┘
```

## Podsumowanie zmian

| Co | Zmiana |
|----|--------|
| Zapytanie główne | Z `employer_profiles` na `job_offers` z joinem do `employer_profiles` |
| Obliczanie kompetencji | Z `employer.req_*` na `offer.req_*` |
| Upsert | Dodanie `job_offer_id: offer.id` |
| onConflict | Z `employer_user_id,candidate_user_id` na `employer_user_id,candidate_user_id,job_offer_id` |
| Deployment | Automatyczny po zapisaniu zmian |
