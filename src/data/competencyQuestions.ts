// Pytania do testów kompetencji - z arkusza candidate_test_kompetencje

export interface CompetencyQuestion {
  id: string;
  competencyCode: string;
  subdimensionCode: string;
  text: { pl: string; en: string };
  reversed: boolean;
}

export const competencyTests = {
  pl: {
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
  },
  en: {
    komunikacja: {
      name: "Communication",
      description: "Written and verbal",
      icon: "MessageSquare",
      estimatedTime: "8-10 min",
      questionCount: 17,
    },
    myslenie_analityczne: {
      name: "Analytical Thinking",
      description: "Analysis and reasoning",
      icon: "Brain",
      estimatedTime: "8-10 min",
      questionCount: 17,
    },
    out_of_the_box: {
      name: "Out of the box",
      description: "Creativity and innovation",
      icon: "Lightbulb",
      estimatedTime: "8-10 min",
      questionCount: 15,
    },
    determinacja: {
      name: "Determination & Motivation",
      description: "Achieving goals",
      icon: "Target",
      estimatedTime: "8-10 min",
      questionCount: 17,
    },
    adaptacja: {
      name: "Adaptability",
      description: "Adapting to change",
      icon: "RefreshCw",
      estimatedTime: "8-10 min",
      questionCount: 17,
    },
  },
};

export const competencyQuestions: CompetencyQuestion[] = [
  // KOMUNIKACJA
  { id: "KOMU_01", competencyCode: "komunikacja", subdimensionCode: "klarownosc", text: { pl: "Gdy mam dwie minuty, potrafię streścić sedno tego co chce powiedzieć w kilku zdaniach.", en: "When I have two minutes, I can summarize the essence of what I want to say in a few sentences." }, reversed: false },
  { id: "KOMU_02", competencyCode: "komunikacja", subdimensionCode: "klarownosc", text: { pl: "W krótkiej wiadomości nigdy nie mieszam wątków i trzymam się jednego przekazu.", en: "In a short message, I never mix topics and stick to one message." }, reversed: false },
  { id: "KOMU_03", competencyCode: "komunikacja", subdimensionCode: "klarownosc", text: { pl: "Gdy rozmawiam w pośpiechu, często gubię wątek i zdarza się, że wchodzę w szczegóły.", en: "When I talk in a hurry, I often lose track and sometimes go into details." }, reversed: true },
  { id: "KOMU_04", competencyCode: "komunikacja", subdimensionCode: "dostosowanie", text: { pl: "Staram się mówić w taki sam sposób do wszystkich, niezależnie od tego, kim są.", en: "I try to speak the same way to everyone, regardless of who they are." }, reversed: true },
  { id: "KOMU_05", competencyCode: "komunikacja", subdimensionCode: "dostosowanie", text: { pl: "W pracy zazwyczaj wysyłam osobom z różnych działów wiadomości z taką samą treścią, bo to oszczędza czas.", en: "At work, I usually send people from different departments the same message content because it saves time." }, reversed: true },
  { id: "KOMU_06", competencyCode: "komunikacja", subdimensionCode: "dostosowanie", text: { pl: "Staram się używać specjalistycznego języka w każdej rozmowie.", en: "I try to use specialized language in every conversation." }, reversed: true },
  { id: "KOMU_07", competencyCode: "komunikacja", subdimensionCode: "sluchanie", text: { pl: "Podczas rozmowy skupiam się na aktywnym słuchaniu rozmówcy.", en: "During a conversation, I focus on actively listening to the other person." }, reversed: false },
  { id: "KOMU_08", competencyCode: "komunikacja", subdimensionCode: "sluchanie", text: { pl: "Podczas rozmowy reaguję na emocje i zachowanie rozmówcy.", en: "During a conversation, I respond to the emotions and behavior of the other person." }, reversed: false },
  { id: "KOMU_09", competencyCode: "komunikacja", subdimensionCode: "sluchanie", text: { pl: "Często jestem tak zaangażowany w rozmowę, że zdarza mi się wchodzić w słowo osobom, z którymi rozmawiam.", en: "I'm often so engaged in conversation that I sometimes interrupt the people I'm talking to." }, reversed: true },
  { id: "KOMU_10", competencyCode: "komunikacja", subdimensionCode: "argumentacja", text: { pl: "Gdy chcę kogoś z rodziny do czegoś przekonać, wcześniej układam sobie w głowie, co powiem i na czym to oprę.", en: "When I want to convince a family member of something, I first think about what I'll say and what I'll base it on." }, reversed: false },
  { id: "KOMU_11", competencyCode: "komunikacja", subdimensionCode: "argumentacja", text: { pl: "Wolę mówić konkretnie i z przekonaniem, zamiast używać rozbudowanej argumentacji.", en: "I prefer to speak concretely and with conviction rather than using elaborate argumentation." }, reversed: true },
  { id: "KOMU_12", competencyCode: "komunikacja", subdimensionCode: "argumentacja", text: { pl: "Zazwyczaj się nie tłumaczę, tylko trzymam się swojego zdania, nawet jeśli jestem niezrozumiany.", en: "I usually don't explain myself, I just stick to my opinion, even if I'm misunderstood." }, reversed: true },
  { id: "KOMU_13", competencyCode: "komunikacja", subdimensionCode: "forma_pisemna", text: { pl: "Przygotowane przeze mnie pisma urzędowe, notatki, raporty, prezentacje i itp. są wysoko oceniane.", en: "Official documents, notes, reports, presentations I prepare are highly rated." }, reversed: false },
  { id: "KOMU_14", competencyCode: "komunikacja", subdimensionCode: "forma_pisemna", text: { pl: "Gdy piszę wiadomość, dbam o to, żeby była jasna i zrozumiała.", en: "When I write a message, I make sure it's clear and understandable." }, reversed: false },
  { id: "KOMU_15", competencyCode: "komunikacja", subdimensionCode: "forma_pisemna", text: { pl: "Gdy czasu jest bardzo mało, ważniejszy jest termin niż dokładne dopracowanie tekstu.", en: "When time is very short, the deadline is more important than polishing the text." }, reversed: true },
  { id: "KOMU_16", competencyCode: "komunikacja", subdimensionCode: "aprobata", text: { pl: "Nigdy nie zdarza mi się odkładać zadań na później.", en: "I never postpone tasks." }, reversed: false },
  { id: "KOMU_17", competencyCode: "komunikacja", subdimensionCode: "aprobata", text: { pl: "Zawsze odnoszę się z pełnym spokojem do krytyki skierowanej pod moim adresem.", en: "I always respond calmly to criticism directed at me." }, reversed: false },

  // MYŚLENIE ANALITYCZNE
  { id: "MYSL_01", competencyCode: "myslenie_analityczne", subdimensionCode: "rozkladanie", text: { pl: "Kiedy napotykam duży problem, staram się rozbić go na mniejsze części.", en: "When I encounter a big problem, I try to break it down into smaller parts." }, reversed: false },
  { id: "MYSL_02", competencyCode: "myslenie_analityczne", subdimensionCode: "rozkladanie", text: { pl: "Gdy czekają mnie liczne sprawunki domowe, ustalam, co zrobię jako pierwsze, a co później.", en: "When I have many household errands, I determine what to do first and what later." }, reversed: false },
  { id: "MYSL_03", competencyCode: "myslenie_analityczne", subdimensionCode: "rozkladanie", text: { pl: "Wolę spontaniczne działanie niż planowanie.", en: "I prefer spontaneous action over planning." }, reversed: true },
  { id: "MYSL_04", competencyCode: "myslenie_analityczne", subdimensionCode: "selekcja", text: { pl: "Gdy zbieram informacje na jakiś temat, wybieram tylko te najistotniejsze a resztę pomijam.", en: "When I gather information on a topic, I select only the most important ones and skip the rest." }, reversed: false },
  { id: "MYSL_05", competencyCode: "myslenie_analityczne", subdimensionCode: "selekcja", text: { pl: "Wyszukując coś w sieci, zwykle sprawdzam, na ile źródło można uznać za wiarygodne.", en: "When searching online, I usually check how reliable the source is." }, reversed: false },
  { id: "MYSL_06", competencyCode: "myslenie_analityczne", subdimensionCode: "selekcja", text: { pl: "Staram się brać pod uwagę wszystkie informacje, nawet te mniej istotne.", en: "I try to consider all information, even the less important ones." }, reversed: true },
  { id: "MYSL_07", competencyCode: "myslenie_analityczne", subdimensionCode: "analiza", text: { pl: "Gdy pojawia się jakaś trudna sytuacja, najpierw porządkuję to, co o niej wiem.", en: "When a difficult situation arises, I first organize what I know about it." }, reversed: false },
  { id: "MYSL_08", competencyCode: "myslenie_analityczne", subdimensionCode: "analiza", text: { pl: "Kiedy bliscy różnie opisują tę to samo zdarzenie, porównuję ich relacje i wyciągam własny wniosek.", en: "When loved ones describe the same event differently, I compare their accounts and draw my own conclusion." }, reversed: false },
  { id: "MYSL_09", competencyCode: "myslenie_analityczne", subdimensionCode: "analiza", text: { pl: "Kiedy nadmiernie rozkładam czyjeś działania na czynniki, mam tendencję do ich usprawiedliwiania.", en: "When I overanalyze someone's actions, I tend to justify them." }, reversed: true },
  { id: "MYSL_10", competencyCode: "myslenie_analityczne", subdimensionCode: "wnioskowanie", text: { pl: "Gdy pojawia się problem między mną a inną osobą, potrafię dojść do tego, co jest jego główną przyczyną.", en: "When a problem arises between me and another person, I can figure out its main cause." }, reversed: false },
  { id: "MYSL_11", competencyCode: "myslenie_analityczne", subdimensionCode: "wnioskowanie", text: { pl: "W większości sytuacji opieram swoje wnioski na faktach, a nie na emocjach.", en: "In most situations, I base my conclusions on facts, not emotions." }, reversed: false },
  { id: "MYSL_12", competencyCode: "myslenie_analityczne", subdimensionCode: "wnioskowanie", text: { pl: "Niektóre moje decyzje mogłyby zostać uznane za mało logiczne.", en: "Some of my decisions could be considered illogical." }, reversed: true },
  { id: "MYSL_13", competencyCode: "myslenie_analityczne", subdimensionCode: "decyzje", text: { pl: "W poważniejszych sprawach zwykle analizuję kilka opcji, zanim wybiorę jedną.", en: "In more serious matters, I usually analyze several options before choosing one." }, reversed: false },
  { id: "MYSL_14", competencyCode: "myslenie_analityczne", subdimensionCode: "decyzje", text: { pl: "Podejmując decyzję, zawsze staram się brać pod uwagę potencjalne konsekwencje, jakie może to mieć dla innych osób.", en: "When making a decision, I always try to consider the potential consequences for others." }, reversed: false },
  { id: "MYSL_15", competencyCode: "myslenie_analityczne", subdimensionCode: "decyzje", text: { pl: "Często zdarza mi się kierować pierwszą intuicją, uznając ją za właściwy wybór.", en: "I often go with my first intuition, considering it the right choice." }, reversed: true },
  { id: "MYSL_16", competencyCode: "myslenie_analityczne", subdimensionCode: "aprobata", text: { pl: "W każdej sytuacji traktuję wszystkich jednakowo i nigdy nie faworyzuję nikogo.", en: "In every situation, I treat everyone equally and never favor anyone." }, reversed: false },
  { id: "MYSL_17", competencyCode: "myslenie_analityczne", subdimensionCode: "aprobata", text: { pl: "Zawsze dotrzymuję wszystkich obietnic, niezależnie od okoliczności.", en: "I always keep all promises, regardless of circumstances." }, reversed: false },

  // OUT OF THE BOX
  { id: "OUT_01", competencyCode: "out_of_the_box", subdimensionCode: "ciekawosc", text: { pl: "Gdy tylko pojawia się taka możliwość, chętnie testuje różne nowinki pojawiające się na rynku.", en: "Whenever possible, I eagerly test new innovations on the market." }, reversed: false },
  { id: "OUT_02", competencyCode: "out_of_the_box", subdimensionCode: "ciekawosc", text: { pl: "Najczęściej wybieram znane mi metody, a do nowych podchodzę ostrożnie.", en: "I usually choose methods I know, and approach new ones cautiously." }, reversed: true },
  { id: "OUT_03", competencyCode: "out_of_the_box", subdimensionCode: "ciekawosc", text: { pl: "Lubię próbować nowych sposobów, nawet jeśli nie wiem, czy się sprawdzą.", en: "I like trying new ways, even if I don't know if they'll work." }, reversed: false },
  { id: "OUT_04", competencyCode: "out_of_the_box", subdimensionCode: "chaos", text: { pl: "W obliczu nagłych zmian potrafię działać dalej, nawet jeśli wszystko nie jest do końca jasne.", en: "In the face of sudden changes, I can keep going even if everything isn't completely clear." }, reversed: false },
  { id: "OUT_05", competencyCode: "out_of_the_box", subdimensionCode: "chaos", text: { pl: "Przeszkadza mi, gdy sytuacja staje się nieuporządkowana lub zmienia się zbyt szybko.", en: "It bothers me when a situation becomes disorganized or changes too quickly." }, reversed: true },
  { id: "OUT_06", competencyCode: "out_of_the_box", subdimensionCode: "chaos", text: { pl: "Podejmuję decyzje, mimo że nie mam wszystkich potrzebnych informacji.", en: "I make decisions even though I don't have all the necessary information." }, reversed: false },
  { id: "OUT_07", competencyCode: "out_of_the_box", subdimensionCode: "redefiniowanie", text: { pl: "Kiedy sytuacja nie układa się po mojej myśli, staram się spojrzeć na nią z innej perspektywy.", en: "When things don't go my way, I try to look at the situation from a different perspective." }, reversed: false },
  { id: "OUT_08", competencyCode: "out_of_the_box", subdimensionCode: "redefiniowanie", text: { pl: "Zwykle trzymam się tak, długo jak mogę, pierwszego pomysłu nawet wtedy, gdy nie przynosi oczekiwanych rezultatów.", en: "I usually stick to my first idea as long as possible, even when it doesn't bring expected results." }, reversed: true },
  { id: "OUT_09", competencyCode: "out_of_the_box", subdimensionCode: "redefiniowanie", text: { pl: "Zdarza mi się zmieniać pierwotny pomysł, jeśli widzę możliwość lepszego rozwiązania sytuacji.", en: "I sometimes change my original idea if I see a possibility for a better solution." }, reversed: false },
  { id: "OUT_10", competencyCode: "out_of_the_box", subdimensionCode: "synteza", text: { pl: "Lubię łączyć różne pomysły i inspiracje, żeby stworzyć coś nowego.", en: "I like combining different ideas and inspirations to create something new." }, reversed: false },
  { id: "OUT_11", competencyCode: "out_of_the_box", subdimensionCode: "synteza", text: { pl: "Inspiruję się rzeczami, które na pierwszy rzut oka nie mają ze sobą wiele wspólnego.", en: "I get inspired by things that at first glance don't have much in common." }, reversed: false },
  { id: "OUT_12", competencyCode: "out_of_the_box", subdimensionCode: "synteza", text: { pl: "Najczęściej trzymam się znanych mi rozwiązań, bo tylko do nich mam pewność, że działają jak trzeba.", en: "I usually stick to solutions I know because I'm only sure those work properly." }, reversed: true },
  { id: "OUT_13", competencyCode: "out_of_the_box", subdimensionCode: "eksperymentowanie", text: { pl: "Gdy wpadnę na pomysł, lubię sprawdzić go w praktyce, choćby w małej skali.", en: "When I come up with an idea, I like to test it in practice, even on a small scale." }, reversed: false },
  { id: "OUT_14", competencyCode: "out_of_the_box", subdimensionCode: "eksperymentowanie", text: { pl: "Po wypróbowaniu czegoś nowego wyciągam wnioski, co zadziałało, a co nie.", en: "After trying something new, I draw conclusions about what worked and what didn't." }, reversed: false },
  { id: "OUT_15", competencyCode: "out_of_the_box", subdimensionCode: "eksperymentowanie", text: { pl: "Lubię szukać nowych idei, choć rzadko wprowadzam je w życie.", en: "I like looking for new ideas, although I rarely implement them." }, reversed: true },

  // DETERMINACJA I MOTYWACJA
  { id: "DETE_01", competencyCode: "determinacja", subdimensionCode: "cel", text: { pl: "W pracy koncentruję się głównie na celu, nie na szczegółach po drodze.", en: "At work, I focus mainly on the goal, not on details along the way." }, reversed: false },
  { id: "DETE_02", competencyCode: "determinacja", subdimensionCode: "cel", text: { pl: "Zdarza mi się działać od razu, zanim jasno określę cel.", en: "I sometimes act immediately before clearly defining the goal." }, reversed: true },
  { id: "DETE_03", competencyCode: "determinacja", subdimensionCode: "cel", text: { pl: "W codziennych sprawach zwracam uwagę na to, czy to, co robię, przynosi mi oczekiwany efekt.", en: "In daily matters, I pay attention to whether what I'm doing brings the expected result." }, reversed: false },
  { id: "DETE_04", competencyCode: "determinacja", subdimensionCode: "koncentracja", text: { pl: "Kiedy mam coś ważnego do zrobienia, odkładam na bok sprawy, które w danym momencie są mniej istotne.", en: "When I have something important to do, I set aside matters that are less important at the moment." }, reversed: false },
  { id: "DETE_05", competencyCode: "determinacja", subdimensionCode: "koncentracja", text: { pl: "Trudno mi czasem utrzymać pełne skupienie na jednym celu, bo zajmuję się wieloma sprawami jednocześnie.", en: "Sometimes it's hard for me to maintain full focus on one goal because I'm dealing with many things at once." }, reversed: true },
  { id: "DETE_06", competencyCode: "determinacja", subdimensionCode: "koncentracja", text: { pl: "Potrafię skupić się na tym, co naprawdę przybliża mnie do wyniku, który chcę osiągnąć.", en: "I can focus on what really brings me closer to the result I want to achieve." }, reversed: false },
  { id: "DETE_07", competencyCode: "determinacja", subdimensionCode: "systematycznosc", text: { pl: "Zazwyczaj realizuję zadanie kolejno, etapami, aż do jego zakończenia.", en: "I usually complete tasks step by step until they're finished." }, reversed: false },
  { id: "DETE_08", competencyCode: "determinacja", subdimensionCode: "systematycznosc", text: { pl: "Jeśli nie dokończę czegoś w planowanym czasie, po prostu przekładam to na później.", en: "If I don't finish something on time, I simply postpone it." }, reversed: true },
  { id: "DETE_09", competencyCode: "determinacja", subdimensionCode: "systematycznosc", text: { pl: "W codziennych obowiązkach staram się trzymać ustalonego planu, zamiast działać spontanicznie.", en: "In daily duties, I try to stick to the established plan rather than act spontaneously." }, reversed: false },
  { id: "DETE_10", competencyCode: "determinacja", subdimensionCode: "motywacja", text: { pl: "Umiem znaleźć motywację, nawet gdy inni mnie nie rozumieją.", en: "I can find motivation even when others don't understand me." }, reversed: false },
  { id: "DETE_11", competencyCode: "determinacja", subdimensionCode: "motywacja", text: { pl: "Lepiej radzę sobie, gdy mam czyjeś wsparcie, niż gdy działam samodzielnie.", en: "I do better when I have someone's support than when I act alone." }, reversed: true },
  { id: "DETE_12", competencyCode: "determinacja", subdimensionCode: "motywacja", text: { pl: "Mimo przeszkód potrafię znaleźć w sobie powód, by działać.", en: "Despite obstacles, I can find a reason within myself to act." }, reversed: false },
  { id: "DETE_13", competencyCode: "determinacja", subdimensionCode: "monitorowanie", text: { pl: "W trakcie pracy nad skomplikowanymi zadaniami od czasu do czasu sprawdzam, czy zadanie zmierza w zaplanowanym kierunku.", en: "While working on complex tasks, I occasionally check if the task is heading in the planned direction." }, reversed: false },
  { id: "DETE_14", competencyCode: "determinacja", subdimensionCode: "monitorowanie", text: { pl: "Czasem wystarczy po prostu działać, zamiast analizować, czy wszystko idzie zgodnie z planem.", en: "Sometimes it's enough to just act instead of analyzing if everything is going according to plan." }, reversed: true },
  { id: "DETE_15", competencyCode: "determinacja", subdimensionCode: "monitorowanie", text: { pl: "Wprowadzam drobne poprawki w działaniu, kiedy widzę, że coś nie idzie w odpowiednim kierunku.", en: "I make small corrections when I see that something isn't going in the right direction." }, reversed: false },
  { id: "DETE_16", competencyCode: "determinacja", subdimensionCode: "aprobata", text: { pl: "Zawsze postępuję w pełni uczciwie, bez względu na konsekwencje.", en: "I always act with complete honesty, regardless of consequences." }, reversed: false },
  { id: "DETE_17", competencyCode: "determinacja", subdimensionCode: "aprobata", text: { pl: "Zawsze potrafię przyznać się do błędu, nawet jeśli jest to dla mnie niekorzystne.", en: "I can always admit my mistakes, even if it's disadvantageous for me." }, reversed: false },

  // UMIEJĘTNOŚĆ ADAPTACJI
  { id: "UMIE_01", competencyCode: "adaptacja", subdimensionCode: "kontekst", text: { pl: "W codziennych sytuacjach nie zwracam dużej uwagi na otoczenie.", en: "In everyday situations, I don't pay much attention to my surroundings." }, reversed: true },
  { id: "UMIE_02", competencyCode: "adaptacja", subdimensionCode: "kontekst", text: { pl: "Zwykle zauważam, gdy działania innych wpływają na moje plany.", en: "I usually notice when others' actions affect my plans." }, reversed: false },
  { id: "UMIE_03", competencyCode: "adaptacja", subdimensionCode: "kontekst", text: { pl: "Czasem nie zauważam drobnych sygnałów z otoczenia i orientuję się dopiero wtedy, gdy zmiana już nastąpi.", en: "Sometimes I don't notice small signals from my environment and only realize when the change has already happened." }, reversed: true },
  { id: "UMIE_04", competencyCode: "adaptacja", subdimensionCode: "emocje", text: { pl: "Kiedy wydarza się coś nieprzewidzianego, najpierw łapię oddech, a dopiero potem działam, zamiast reagować od razu.", en: "When something unexpected happens, I first catch my breath and then act, instead of reacting immediately." }, reversed: false },
  { id: "UMIE_05", competencyCode: "adaptacja", subdimensionCode: "emocje", text: { pl: "Potrafię nazwać emocje których doświadczam w codziennym życiu.", en: "I can name the emotions I experience in daily life." }, reversed: false },
  { id: "UMIE_06", competencyCode: "adaptacja", subdimensionCode: "emocje", text: { pl: "Nagłe zmiany wytrącają mnie z równowagi.", en: "Sudden changes throw me off balance." }, reversed: true },
  { id: "UMIE_07", competencyCode: "adaptacja", subdimensionCode: "elastycznosc", text: { pl: "Nie mam problemów z dostosowaniem swoich planów do zmieniającej się sytuacji.", en: "I have no problem adjusting my plans to changing situations." }, reversed: false },
  { id: "UMIE_08", competencyCode: "adaptacja", subdimensionCode: "elastycznosc", text: { pl: "Dobrze odnajduję się nawet wtedy, gdy sytuacja szybko się zmienia.", en: "I do well even when the situation changes quickly." }, reversed: false },
  { id: "UMIE_09", competencyCode: "adaptacja", subdimensionCode: "elastycznosc", text: { pl: "Zazwyczaj trudno jest mi zmienić założenia, które podjąłem wcześniej.", en: "It's usually hard for me to change assumptions I made earlier." }, reversed: true },
  { id: "UMIE_10", competencyCode: "adaptacja", subdimensionCode: "odpornosc", text: { pl: "W nagłej zmianie potrafię działać dalej, nawet gdy nie wszystko jest jasne.", en: "In a sudden change, I can keep going even when not everything is clear." }, reversed: false },
  { id: "UMIE_11", competencyCode: "adaptacja", subdimensionCode: "odpornosc", text: { pl: "Nawet przy różnych przeszkodach staram się utrzymać tempo wykonywania zadania.", en: "Even with various obstacles, I try to maintain the pace of task completion." }, reversed: false },
  { id: "UMIE_12", competencyCode: "adaptacja", subdimensionCode: "odpornosc", text: { pl: "Kiedy zmieniają się warunki, mogę odpuścić i przerwać to, co robiłem.", en: "When conditions change, I may give up and stop what I was doing." }, reversed: true },
  { id: "UMIE_13", competencyCode: "adaptacja", subdimensionCode: "uczenie", text: { pl: "Staram się wyciągać wnioski z doświadczeń, które mnie czegoś uczą.", en: "I try to draw conclusions from experiences that teach me something." }, reversed: false },
  { id: "UMIE_14", competencyCode: "adaptacja", subdimensionCode: "uczenie", text: { pl: "Wykorzystuję sprawdzone sposoby działania, które okazały się skuteczne w nowej sytuacji.", en: "I use proven methods that have been effective in new situations." }, reversed: false },
  { id: "UMIE_15", competencyCode: "adaptacja", subdimensionCode: "uczenie", text: { pl: "Gdy popełnię błąd to do niego nie wracam i nie analizuję.", en: "When I make a mistake, I don't go back to it and don't analyze it." }, reversed: true },
  { id: "UMIE_16", competencyCode: "adaptacja", subdimensionCode: "aprobata", text: { pl: "Czasem wolę nie przyznawać się do błędu, jeśli mogłoby to źle o mnie świadczyć.", en: "Sometimes I prefer not to admit a mistake if it could reflect badly on me." }, reversed: true },
  { id: "UMIE_17", competencyCode: "adaptacja", subdimensionCode: "aprobata", text: { pl: "Zdarza mi się przedstawiać siebie w lepszym świetle, niż jest w rzeczywistości.", en: "I sometimes present myself in a better light than reality." }, reversed: true },
];

export const getLocalizedCompetencyTests = (lang: string) => {
  return lang === 'en' ? competencyTests.en : competencyTests.pl;
};

export const getLocalizedQuestionsByCompetency = (competencyCode: string, lang: string) => {
  return competencyQuestions
    .filter(q => q.competencyCode === competencyCode)
    .map(q => ({
      ...q,
      text: lang === 'en' ? q.text.en : q.text.pl
    }));
};

export const getQuestionsByCompetency = (competencyCode: string) => {
  return competencyQuestions
    .filter(q => q.competencyCode === competencyCode)
    .map(q => ({
      ...q,
      text: q.text.pl
    }));
};

