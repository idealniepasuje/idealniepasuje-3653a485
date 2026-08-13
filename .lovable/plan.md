# Diagnoza błędu na stronie szczegółów kandydata (`c6c6936b…`)

## Co zostało sprawdzone (bez zmian w kodzie)

- Log błędów runtime dla preview: **brak zapisanych błędów** (`No runtime errors found`).
- Próba odtworzenia w przeglądarce (Playwright, zalogowana sesja pracodawcy `ewa029870@gmail.com`, `a3ea14fa-…`):
  - `/employer/candidate/c6c6936b-d871-4b76-908f-bb081d188675` — strona renderuje się **poprawnie**, 0 błędów typu `pageerror`.
  - To samo z parametrem `?matchId=0c85de98-…` (jedyny match tego pracodawcy, status `considering`) — OK.
  - Otwarcie modala „Kontakt” — również bez błędu.
- Dane w bazie dla tego kandydata: `getting_to_know = {}` (puste), `work_description = null`, `tools = []`, `lang_* = null`, `profile_ready = false`. Wszystkie 4 rekordy `match_results` mają kompletny `match_details` (competenceDetails / cultureDetails / extraDetails niepuste).
- Kod `EmployerCandidateDetail.tsx` (1082 linie) w miejscach dotykających tych pól używa bezpiecznych wzorców: `candidateData?.getting_to_know || {}`, `it.value && it.value.trim()`, `Array.isArray(...tools)`, fallback „Nie uzupełnione”.

## Wniosek wstępny

Pusty `getting_to_know` / `work_description` **nie powoduje** tego błędu — te ścieżki są jawnie obsłużone i przetestowane na żywym rekordzie. Nie udało się odtworzyć crasha na aktualnym kodzie w preview, więc **przyczyna nie jest jeszcze potwierdzona**. Nie proponuję „naprawy na ślepo”.

Najbardziej prawdopodobne hipotezy do rozróżnienia:
1. Błąd występuje u **innego pracodawcy** (matche `47d1dd12-…` / `4ee7c6b7-…`) — moja sesja nie ma do nich dostępu (RLS zwraca „Nie znaleziono kandydata”).
2. Błąd pojawia się **po akcji** (np. „Zainteresowany”, „Poproś o uzupełnienie”, wysłanie zaproszenia), a nie przy samym wejściu.
3. Użytkownik widzi **stary bundle** (opublikowana wersja / cache) sprzed commita `58e2999`, a nie aktualny preview.

## Plan działania

1. **Potwierdzenie objawu** — poproszę o zrzut ekranu popupu z rozwiniętym stack trace (lub informację: który pracodawca, czy błąd jest przy wejściu czy po kliknięciu, preview czy opublikowana domena). To jednoznacznie wskaże plik i linię.
2. **Reprodukcja pod właściwym kontem** — po wskazaniu pracodawcy odtwarzam ścieżkę w przeglądarce z odpowiednim `matchId` i zbieram `pageerror` + logi sieciowe.
3. **Minimalna naprawa** — dopiero po zlokalizowaniu: jednopunktowy guard w konkretnej linii, bez zmian w logice matchingu, RLS ani edge functions.
4. **Weryfikacja** — ponowne przejście tej samej ścieżki w przeglądarce i sprawdzenie, że popup nie wraca.

## Uwaga techniczna

Podczas diagnozy strona została załadowana pod kontem `ewa029870@gmail.com`; jej match miał już status `considering`, więc żaden status nie został zmieniony. Żaden plik nie został zmodyfikowany.
