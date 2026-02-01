// Pytania do testów kompetencji - z arkusza candidate_test_kompetencje

export interface CompetencyQuestion {
  id: string;
  competencyCode: string;
  subdimensionCode: string;
  text: string;
  reversed: boolean;
}

export const competencyTests = {
  komunikacja: {
    name: "Komunikacja",
    description: "Pisemna i ustna",
    icon: "MessageSquare",
    estimatedTime: "8-10 min",
    questionCount: 17,
  },
  myslenie_analityczne: {
    name: "Myślenie analityczne",
    description: "Analiza i wnioskowanie",
    icon: "Brain",
    estimatedTime: "8-10 min",
    questionCount: 17,
  },
  out_of_the_box: {
    name: "Out of the box",
    description: "Kreatywność i innowacje",
    icon: "Lightbulb",
    estimatedTime: "8-10 min",
    questionCount: 15,
  },
  determinacja: {
    name: "Determinacja i motywacja",
    description: "Osiąganie celów",
    icon: "Target",
    estimatedTime: "8-10 min",
    questionCount: 17,
  },
  adaptacja: {
    name: "Umiejętność adaptacji",
    description: "Adaptacja do zmian",
    icon: "RefreshCw",
    estimatedTime: "8-10 min",
    questionCount: 17,
  },
};

export const competencyQuestions: CompetencyQuestion[] = [
  // KOMUNIKACJA
  { id: "KOMU_01", competencyCode: "komunikacja", subdimensionCode: "klarownosc", text: "Gdy mam dwie minuty, potrafię streścić sedno tego co chce powiedzieć w kilku zdaniach.", reversed: false },
  { id: "KOMU_02", competencyCode: "komunikacja", subdimensionCode: "klarownosc", text: "W krótkiej wiadomości nigdy nie mieszam wątków i trzymam się jednego przekazu.", reversed: false },
  { id: "KOMU_03", competencyCode: "komunikacja", subdimensionCode: "klarownosc", text: "Gdy rozmawiam w pośpiechu, często gubię wątek i zdarza się, że wchodzę w szczegóły.", reversed: true },
  { id: "KOMU_04", competencyCode: "komunikacja", subdimensionCode: "dostosowanie", text: "Staram się mówić w taki sam sposób do wszystkich, niezależnie od tego, kim są.", reversed: true },
  { id: "KOMU_05", competencyCode: "komunikacja", subdimensionCode: "dostosowanie", text: "W pracy zazwyczaj wysyłam osobom z różnych działów wiadomości z taką samą treścią, bo to oszczędza czas.", reversed: true },
  { id: "KOMU_06", competencyCode: "komunikacja", subdimensionCode: "dostosowanie", text: "Staram się używać specjalistycznego języka w każdej rozmowie.", reversed: true },
  { id: "KOMU_07", competencyCode: "komunikacja", subdimensionCode: "sluchanie", text: "Podczas rozmowy skupiam się na aktywnym słuchaniu rozmówcy.", reversed: false },
  { id: "KOMU_08", competencyCode: "komunikacja", subdimensionCode: "sluchanie", text: "Podczas rozmowy reaguję na emocje i zachowanie rozmówcy.", reversed: false },
  { id: "KOMU_09", competencyCode: "komunikacja", subdimensionCode: "sluchanie", text: "Często jestem tak zaangażowany w rozmowę, że zdarza mi się wchodzić w słowo osobom, z którymi rozmawiam.", reversed: true },
  { id: "KOMU_10", competencyCode: "komunikacja", subdimensionCode: "argumentacja", text: "Gdy chcę kogoś z rodziny do czegoś przekonać, wcześniej układam sobie w głowie, co powiem i na czym to oprę.", reversed: false },
  { id: "KOMU_11", competencyCode: "komunikacja", subdimensionCode: "argumentacja", text: "Wolę mówić konkretnie i z przekonaniem, zamiast używać rozbudowanej argumentacji.", reversed: true },
  { id: "KOMU_12", competencyCode: "komunikacja", subdimensionCode: "argumentacja", text: "Zazwyczaj się nie tłumaczę, tylko trzymam się swojego zdania, nawet jeśli jestem niezrozumiany.", reversed: true },
  { id: "KOMU_13", competencyCode: "komunikacja", subdimensionCode: "forma_pisemna", text: "Przygotowane przeze mnie pisma urzędowe, notatki, raporty, prezentacje i itp. są wysoko oceniane.", reversed: false },
  { id: "KOMU_14", competencyCode: "komunikacja", subdimensionCode: "forma_pisemna", text: "Gdy piszę wiadomość, dbam o to, żeby była jasna i zrozumiała.", reversed: false },
  { id: "KOMU_15", competencyCode: "komunikacja", subdimensionCode: "forma_pisemna", text: "Gdy czasu jest bardzo mało, ważniejszy jest termin niż dokładne dopracowanie tekstu.", reversed: true },
  { id: "KOMU_16", competencyCode: "komunikacja", subdimensionCode: "aprobata", text: "Nigdy nie zdarza mi się odkładać zadań na później.", reversed: false },
  { id: "KOMU_17", competencyCode: "komunikacja", subdimensionCode: "aprobata", text: "Zawsze odnoszę się z pełnym spokojem do krytyki skierowanej pod moim adresem.", reversed: false },

  // MYŚLENIE ANALITYCZNE
  { id: "MYSL_01", competencyCode: "myslenie_analityczne", subdimensionCode: "rozkladanie", text: "Kiedy napotykam duży problem, staram się rozbić go na mniejsze części.", reversed: false },
  { id: "MYSL_02", competencyCode: "myslenie_analityczne", subdimensionCode: "rozkladanie", text: "Gdy czekają mnie liczne sprawunki domowe, ustalam, co zrobię jako pierwsze, a co później.", reversed: false },
  { id: "MYSL_03", competencyCode: "myslenie_analityczne", subdimensionCode: "rozkladanie", text: "Wolę spontaniczne działanie niż planowanie.", reversed: true },
  { id: "MYSL_04", competencyCode: "myslenie_analityczne", subdimensionCode: "selekcja", text: "Gdy zbieram informacje na jakiś temat, wybieram tylko te najistotniejsze a resztę pomijam.", reversed: false },
  { id: "MYSL_05", competencyCode: "myslenie_analityczne", subdimensionCode: "selekcja", text: "Wyszukując coś w sieci, zwykle sprawdzam, na ile źródło można uznać za wiarygodne.", reversed: false },
  { id: "MYSL_06", competencyCode: "myslenie_analityczne", subdimensionCode: "selekcja", text: "Staram się brać pod uwagę wszystkie informacje, nawet te mniej istotne.", reversed: true },
  { id: "MYSL_07", competencyCode: "myslenie_analityczne", subdimensionCode: "analiza", text: "Gdy pojawia się jakaś trudna sytuacja, najpierw porządkuję to, co o niej wiem.", reversed: false },
  { id: "MYSL_08", competencyCode: "myslenie_analityczne", subdimensionCode: "analiza", text: "Kiedy bliscy różnie opisują tę to samo zdarzenie, porównuję ich relacje i wyciągam własny wniosek.", reversed: false },
  { id: "MYSL_09", competencyCode: "myslenie_analityczne", subdimensionCode: "analiza", text: "Kiedy nadmiernie rozkładam czyjeś działania na czynniki, mam tendencję do ich usprawiedliwiania.", reversed: true },
  { id: "MYSL_10", competencyCode: "myslenie_analityczne", subdimensionCode: "wnioskowanie", text: "Gdy pojawia się problem między mną a inną osobą, potrafię dojść do tego, co jest jego główną przyczyną.", reversed: false },
  { id: "MYSL_11", competencyCode: "myslenie_analityczne", subdimensionCode: "wnioskowanie", text: "W większości sytuacji opieram swoje wnioski na faktach, a nie na emocjach.", reversed: false },
  { id: "MYSL_12", competencyCode: "myslenie_analityczne", subdimensionCode: "wnioskowanie", text: "Niektóre moje decyzje mogłyby zostać uznane za mało logiczne.", reversed: true },
  { id: "MYSL_13", competencyCode: "myslenie_analityczne", subdimensionCode: "decyzje", text: "W poważniejszych sprawach zwykle analizuję kilka opcji, zanim wybiorę jedną.", reversed: false },
  { id: "MYSL_14", competencyCode: "myslenie_analityczne", subdimensionCode: "decyzje", text: "Podejmując decyzję, zawsze staram się brać pod uwagę potencjalne konsekwencje, jakie może to mieć dla innych osób.", reversed: false },
  { id: "MYSL_15", competencyCode: "myslenie_analityczne", subdimensionCode: "decyzje", text: "Często zdarza mi się kierować pierwszą intuicją, uznając ją za właściwy wybór.", reversed: true },
  { id: "MYSL_16", competencyCode: "myslenie_analityczne", subdimensionCode: "aprobata", text: "W każdej sytuacji traktuję wszystkich jednakowo i nigdy nie faworyzuję nikogo.", reversed: false },
  { id: "MYSL_17", competencyCode: "myslenie_analityczne", subdimensionCode: "aprobata", text: "Zawsze dotrzymuję wszystkich obietnic, niezależnie od okoliczności.", reversed: false },

  // OUT OF THE BOX
  { id: "OUT_01", competencyCode: "out_of_the_box", subdimensionCode: "ciekawosc", text: "Gdy tylko pojawia się taka możliwość, chętnie testuje różne nowinki pojawiające się na rynku.", reversed: false },
  { id: "OUT_02", competencyCode: "out_of_the_box", subdimensionCode: "ciekawosc", text: "Najczęściej wybieram znane mi metody, a do nowych podchodzę ostrożnie.", reversed: true },
  { id: "OUT_03", competencyCode: "out_of_the_box", subdimensionCode: "ciekawosc", text: "Lubię próbować nowych sposobów, nawet jeśli nie wiem, czy się sprawdzą.", reversed: false },
  { id: "OUT_04", competencyCode: "out_of_the_box", subdimensionCode: "chaos", text: "W obliczu nagłych zmian potrafię działać dalej, nawet jeśli wszystko nie jest do końca jasne.", reversed: false },
  { id: "OUT_05", competencyCode: "out_of_the_box", subdimensionCode: "chaos", text: "Przeszkadza mi, gdy sytuacja staje się nieuporządkowana lub zmienia się zbyt szybko.", reversed: true },
  { id: "OUT_06", competencyCode: "out_of_the_box", subdimensionCode: "chaos", text: "Podejmuję decyzje, mimo że nie mam wszystkich potrzebnych informacji.", reversed: false },
  { id: "OUT_07", competencyCode: "out_of_the_box", subdimensionCode: "redefiniowanie", text: "Kiedy sytuacja nie układa się po mojej myśli, staram się spojrzeć na nią z innej perspektywy.", reversed: false },
  { id: "OUT_08", competencyCode: "out_of_the_box", subdimensionCode: "redefiniowanie", text: "Zwykle trzymam się tak, długo jak mogę, pierwszego pomysłu nawet wtedy, gdy nie przynosi oczekiwanych rezultatów.", reversed: true },
  { id: "OUT_09", competencyCode: "out_of_the_box", subdimensionCode: "redefiniowanie", text: "Zdarza mi się zmieniać pierwotny pomysł, jeśli widzę możliwość lepszego rozwiązania sytuacji.", reversed: false },
  { id: "OUT_10", competencyCode: "out_of_the_box", subdimensionCode: "synteza", text: "Lubię łączyć różne pomysły i inspiracje, żeby stworzyć coś nowego.", reversed: false },
  { id: "OUT_11", competencyCode: "out_of_the_box", subdimensionCode: "synteza", text: "Inspiruję się rzeczami, które na pierwszy rzut oka nie mają ze sobą wiele wspólnego.", reversed: false },
  { id: "OUT_12", competencyCode: "out_of_the_box", subdimensionCode: "synteza", text: "Najczęściej trzymam się znanych mi rozwiązań, bo tylko do nich mam pewność, że działają jak trzeba.", reversed: true },
  { id: "OUT_13", competencyCode: "out_of_the_box", subdimensionCode: "eksperymentowanie", text: "Gdy wpadnę na pomysł, lubię sprawdzić go w praktyce, choćby w małej skali.", reversed: false },
  { id: "OUT_14", competencyCode: "out_of_the_box", subdimensionCode: "eksperymentowanie", text: "Po wypróbowaniu czegoś nowego wyciągam wnioski, co zadziałało, a co nie.", reversed: false },
  { id: "OUT_15", competencyCode: "out_of_the_box", subdimensionCode: "eksperymentowanie", text: "Lubię szukać nowych idei, choć rzadko wprowadzam je w życie.", reversed: true },

  // DETERMINACJA I MOTYWACJA
  { id: "DETE_01", competencyCode: "determinacja", subdimensionCode: "cel", text: "W pracy koncentruję się głównie na celu, nie na szczegółach po drodze.", reversed: false },
  { id: "DETE_02", competencyCode: "determinacja", subdimensionCode: "cel", text: "Zdarza mi się działać od razu, zanim jasno określę cel.", reversed: true },
  { id: "DETE_03", competencyCode: "determinacja", subdimensionCode: "cel", text: "W codziennych sprawach zwracam uwagę na to, czy to, co robię, przynosi mi oczekiwany efekt.", reversed: false },
  { id: "DETE_04", competencyCode: "determinacja", subdimensionCode: "koncentracja", text: "Kiedy mam coś ważnego do zrobienia, odkładam na bok sprawy, które w danym momencie są mniej istotne.", reversed: false },
  { id: "DETE_05", competencyCode: "determinacja", subdimensionCode: "koncentracja", text: "Trudno mi czasem utrzymać pełne skupienie na jednym celu, bo zajmuję się wieloma sprawami jednocześnie.", reversed: true },
  { id: "DETE_06", competencyCode: "determinacja", subdimensionCode: "koncentracja", text: "Potrafię skupić się na tym, co naprawdę przybliża mnie do wyniku, który chcę osiągnąć.", reversed: false },
  { id: "DETE_07", competencyCode: "determinacja", subdimensionCode: "systematycznosc", text: "Zazwyczaj realizuję zadanie kolejno, etapami, aż do jego zakończenia.", reversed: false },
  { id: "DETE_08", competencyCode: "determinacja", subdimensionCode: "systematycznosc", text: "Jeśli nie dokończę czegoś w planowanym czasie, po prostu przekładam to na później.", reversed: true },
  { id: "DETE_09", competencyCode: "determinacja", subdimensionCode: "systematycznosc", text: "W codziennych obowiązkach staram się trzymać ustalonego planu, zamiast działać spontanicznie.", reversed: false },
  { id: "DETE_10", competencyCode: "determinacja", subdimensionCode: "motywacja", text: "Umiem znaleźć motywację, nawet gdy inni mnie nie rozumieją.", reversed: false },
  { id: "DETE_11", competencyCode: "determinacja", subdimensionCode: "motywacja", text: "Lepiej radzę sobie, gdy mam czyjeś wsparcie, niż gdy działam samodzielnie.", reversed: true },
  { id: "DETE_12", competencyCode: "determinacja", subdimensionCode: "motywacja", text: "Mimo przeszkód potrafię znaleźć w sobie powód, by działać.", reversed: false },
  { id: "DETE_13", competencyCode: "determinacja", subdimensionCode: "monitorowanie", text: "W trakcie pracy nad skomplikowanymi zadaniami od czasu do czasu sprawdzam, czy zadanie zmierza w zaplanowanym kierunku.", reversed: false },
  { id: "DETE_14", competencyCode: "determinacja", subdimensionCode: "monitorowanie", text: "Czasem wystarczy po prostu działać, zamiast analizować, czy wszystko idzie zgodnie z planem.", reversed: true },
  { id: "DETE_15", competencyCode: "determinacja", subdimensionCode: "monitorowanie", text: "Wprowadzam drobne poprawki w działaniu, kiedy widzę, że coś nie idzie w odpowiednim kierunku.", reversed: false },
  { id: "DETE_16", competencyCode: "determinacja", subdimensionCode: "aprobata", text: "Zawsze postępuję w pełni uczciwie, bez względu na konsekwencje.", reversed: false },
  { id: "DETE_17", competencyCode: "determinacja", subdimensionCode: "aprobata", text: "Zawsze potrafię przyznać się do błędu, nawet jeśli jest to dla mnie niekorzystne.", reversed: false },

  // UMIEJĘTNOŚĆ ADAPTACJI
  { id: "UMIE_01", competencyCode: "adaptacja", subdimensionCode: "kontekst", text: "W codziennych sytuacjach nie zwracam dużej uwagi na otoczenie.", reversed: true },
  { id: "UMIE_02", competencyCode: "adaptacja", subdimensionCode: "kontekst", text: "Zwykle zauważam, gdy działania innych wpływają na moje plany.", reversed: false },
  { id: "UMIE_03", competencyCode: "adaptacja", subdimensionCode: "kontekst", text: "Czasem nie zauważam drobnych sygnałów z otoczenia i orientuję się dopiero wtedy, gdy zmiana już nastąpi.", reversed: true },
  { id: "UMIE_04", competencyCode: "adaptacja", subdimensionCode: "emocje", text: "Kiedy wydarza się coś nieprzewidzianego, najpierw łapię oddech, a dopiero potem działam, zamiast reagować od razu.", reversed: false },
  { id: "UMIE_05", competencyCode: "adaptacja", subdimensionCode: "emocje", text: "Potrafię nazwać emocje których doświadczam w codziennym życiu.", reversed: false },
  { id: "UMIE_06", competencyCode: "adaptacja", subdimensionCode: "emocje", text: "Nagłe zmiany wytrącają mnie z równowagi.", reversed: true },
  { id: "UMIE_07", competencyCode: "adaptacja", subdimensionCode: "elastycznosc", text: "Nie mam problemów z dostosowaniem swoich planów do zmieniającej się sytuacji.", reversed: false },
  { id: "UMIE_08", competencyCode: "adaptacja", subdimensionCode: "elastycznosc", text: "Dobrze odnajduję się nawet wtedy, gdy sytuacja szybko się zmienia.", reversed: false },
  { id: "UMIE_09", competencyCode: "adaptacja", subdimensionCode: "elastycznosc", text: "Zazwyczaj trudno jest mi zmienić założenia, które podjąłem wcześniej.", reversed: true },
  { id: "UMIE_10", competencyCode: "adaptacja", subdimensionCode: "odpornosc", text: "W nagłej zmianie potrafię działać dalej, nawet gdy nie wszystko jest jasne.", reversed: false },
  { id: "UMIE_11", competencyCode: "adaptacja", subdimensionCode: "odpornosc", text: "Nawet przy różnych przeszkodach staram się utrzymać tempo wykonywania zadania.", reversed: false },
  { id: "UMIE_12", competencyCode: "adaptacja", subdimensionCode: "odpornosc", text: "Kiedy zmieniają się warunki, mogę odpuścić i przerwać to, co robiłem.", reversed: true },
  { id: "UMIE_13", competencyCode: "adaptacja", subdimensionCode: "uczenie", text: "Staram się wyciągać wnioski z doświadczeń, które mnie czegoś uczą.", reversed: false },
  { id: "UMIE_14", competencyCode: "adaptacja", subdimensionCode: "uczenie", text: "Wykorzystuję sprawdzone sposoby działania, które okazały się skuteczne w nowej sytuacji.", reversed: false },
  { id: "UMIE_15", competencyCode: "adaptacja", subdimensionCode: "uczenie", text: "Gdy popełnię błąd to do niego nie wracam i nie analizuję.", reversed: true },
  { id: "UMIE_16", competencyCode: "adaptacja", subdimensionCode: "aprobata", text: "Czasem wolę nie przyznawać się do błędu, jeśli mogłoby to źle o mnie świadczyć.", reversed: true },
  { id: "UMIE_17", competencyCode: "adaptacja", subdimensionCode: "aprobata", text: "Zdarza mi się przedstawiać siebie w lepszym świetle, niż jest w rzeczywistości.", reversed: true },
];

export const getQuestionsByCompetency = (competencyCode: string): CompetencyQuestion[] => {
  return competencyQuestions.filter(q => q.competencyCode === competencyCode);
};
