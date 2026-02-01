// Feedback data z arkuszy candidate_feedback_kompet, candidate_feedback_kultura, employer_feedback_kompet, employer_feedback_kultura

export type FeedbackLevel = 'low' | 'medium' | 'high';
export type Audience = 'candidate' | 'employer';

export interface CompetencyFeedback {
  competencyCode: string;
  level: FeedbackLevel;
  audience: Audience;
  text: string;
}

export interface CultureFeedback {
  dimensionCode: string;
  level: FeedbackLevel;
  audience: Audience;
  text: string;
}

// Progi punktowe
export const getLevel = (average: number): FeedbackLevel => {
  if (average <= 2.2) return 'low';
  if (average <= 3.7) return 'medium';
  return 'high';
};

export const levelLabels: Record<FeedbackLevel, { label: string; color: string }> = {
  low: { label: 'Niski', color: 'destructive' },
  medium: { label: 'Średni', color: 'cta' },
  high: { label: 'Wysoki', color: 'success' },
};

// FEEDBACK KOMPETENCJI - KANDYDAT
export const candidateCompetencyFeedback: CompetencyFeedback[] = [
  {
    competencyCode: "komunikacja",
    level: "low",
    audience: "candidate",
    text: "Często masz trudność z krótkim i spójnym przedstawieniem kluczowego sensu przekazu, co prowadzi niekiedy do nadmiernego wchodzenia w szczegóły i utraty klarowności komunikatu. Zwykle przekazujesz podobne treści różnym odbiorcom w tej samej formie, rzadko dostosowując język i styl do ich potrzeb. W rozmowach koncentrujesz się głównie na prezentowaniu własnego stanowiska, co bywa związane z przerywaniem innym lub stosowaniem nacisku zamiast argumentów."
  },
  {
    competencyCode: "komunikacja",
    level: "medium",
    audience: "candidate",
    text: "Zazwyczaj nie masz trudności z krótkim i spójnym przedstawieniem kluczowego sensu przekazu, jednak podczas rozmowy niekiedy wchodzisz nadmiernie w szczegóły. Zdarza się, że komunikujesz podobne treści do różnych odbiorców w zbliżonej formie, rzadziej dostosowując język i styl do ich potrzeb oraz kontekstu. W rozmowach bywasz silnie zaangażowany w prezentowanie własnego stanowiska."
  },
  {
    competencyCode: "komunikacja",
    level: "high",
    audience: "candidate",
    text: "Sprawnie formułujesz przekazy w sposób zwięzły, spójny i adekwatny do celu komunikacji, koncentrując się na kluczowych informacjach. Zazwyczaj świadomie i elastycznie dostosowujesz język, formę oraz poziom szczegółowości do odbiorcy i kontekstu sytuacyjnego. W rozmowach dbasz o równowagę między prezentowaniem własnego stanowiska a uważnym słuchaniem innych."
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "low",
    audience: "candidate",
    text: "W niektórych sytuacjach możesz doświadczać trudności z rozkładaniem skomplikowanych problemów na mniejsze, czytelne części oraz z selekcją informacji, co sprzyja gubieniu się w szczegółach lub intuicyjnemu podejmowaniu decyzji. Niekiedy możesz wyciągać fragmentaryczne wnioski, mniej logicznie powiązane oraz mniej użyteczne dla innych."
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "medium",
    audience: "candidate",
    text: "Zazwyczaj potrafisz rozłożyć skomplikowane problemy na etapy, wybrać najważniejsze informacje i wyciągnąć spójne wnioski. Logicznie łączysz fakty, choć nie zawsze uwzględniasz pełen kontekst lub niekiedy nie jest on w pełni zrozumiały dla innych. W warunkach niepewności jesteś gotów podjąć decyzję na podstawie dostępnych danych."
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "high",
    audience: "candidate",
    text: "Sprawnie dekomponujesz problemy, selekcjonujesz dane i syntetyzujesz informacje w sposób uporządkowany i logiczny. Potrafisz formułować jasne wnioski, które dobrze opisują zależności i wspierają proces decyzyjny, również przy niepełnych danych. Twoje działania pozwalają przechodzić od analizy do decyzji w sposób czytelny."
  },
  {
    competencyCode: "out_of_the_box",
    level: "low",
    audience: "candidate",
    text: "W sytuacjach wymagających kreatywnego podejścia możesz częściej opierać się na znanych schematach oraz minimalizować eksperymentowanie. Zmienne i niejasne warunki mogą powodować dezorientację, co utrudnia redefiniowanie problemu lub formułowanie nieszablonowych koncepcji. Propozycje rozwiązań bywają przewidywalne."
  },
  {
    competencyCode: "out_of_the_box",
    level: "medium",
    audience: "candidate",
    text: "Interesujesz się nowościami i zdobywasz nowe informacje w umiarkowanym zakresie. W wielu sytuacjach potrafisz spojrzeć na zadanie z innej perspektywy i łączyć różne inspiracje, zwłaszcza kiedy masz przestrzeń na eksplorację. Zwykle tolerujesz pewien poziom niejasności oraz jesteś gotów przetestować nowe pomysły."
  },
  {
    competencyCode: "out_of_the_box",
    level: "high",
    audience: "candidate",
    text: "Swobodnie generujesz i rozwijasz niestandardowe koncepcje, łącząc różnorodne idee w spójne rozwiązania. Sprawnie redefiniujesz problemy oraz tolerujesz niepewność i zmienność jako integralne elementy procesu twórczego. Twoje pomysły są nie tylko kreatywne, lecz także wdrażane w praktyce."
  },
  {
    competencyCode: "determinacja",
    level: "low",
    audience: "candidate",
    text: "Utrzymanie koncentracji na celu oraz systematyczna realizacja zadań mogą być dla Ciebie trudne, zwłaszcza w przypadku pojawienia się przeszkód. Zdarza się, że zamiast konsekwentnie zmierzać do rezultatu, odchodzisz w poboczne wątki i rozpraszasz uwagę na dodatkowe elementy zadania. Motywacja często może mieć charakter zmienny."
  },
  {
    competencyCode: "determinacja",
    level: "medium",
    audience: "candidate",
    text: "W większości sytuacji potrafisz wyznaczać cele i realizować je konsekwentnie, utrzymując koncentrację na najważniejszych działaniach. Twoja motywacja jest względnie stabilna i może jedynie niekiedy wymagać wspierania dodatkowymi bodźcami zewnętrznymi. Śledzisz postępy i wprowadzasz korekty."
  },
  {
    competencyCode: "determinacja",
    level: "high",
    audience: "candidate",
    text: "Konsekwentnie dążysz do osiągnięcia celów, utrzymując koncentrację oraz zaangażowanie nawet w trudnych warunkach. Systematycznie monitorujesz postępy, wprowadzasz działania korygujące oraz samodzielnie podtrzymujesz motywację. Wyzwania traktujesz jako naturalny element procesu."
  },
  {
    competencyCode: "adaptacja",
    level: "low",
    audience: "candidate",
    text: "Zajmujesz się przede wszystkim własnymi obowiązkami, nie zawsze uwzględniając ich wpływ na pracę innych. W obliczu zmian możesz potrzebować więcej czasu na zrozumienie sytuacji oraz wyciszenie reakcji emocjonalnych. Nowe warunki obniżają Twoje tempo działania i utrzymanie skuteczności."
  },
  {
    competencyCode: "adaptacja",
    level: "medium",
    audience: "candidate",
    text: "Zazwyczaj rozumiesz wpływ swojej pracy na pracę innych. W wielu sytuacjach potrafisz dostosować swoje działania do zmiennych warunków oraz zachować funkcjonalny poziom pracy. Zwykle rozumiesz kontekst zmian i podejmujesz decyzje po analizie konsekwencji."
  },
  {
    competencyCode: "adaptacja",
    level: "high",
    audience: "candidate",
    text: "Zawsze jesteś świadomy i uwzględniasz wpływ swojej pracy na pracę innych. Sprawnie adaptujesz sposób myślenia, priorytety oraz działania do sytuacji wymagających elastyczności. Zachowujesz spokój nawet w obliczu presji lub niepewności, utrzymując skuteczność oraz wspierając innych w procesie zmiany."
  },
];

// FEEDBACK KOMPETENCJI - PRACODAWCA
export const employerCompetencyFeedback: CompetencyFeedback[] = [
  {
    competencyCode: "komunikacja",
    level: "low",
    audience: "employer",
    text: "Kandydat może doświadczać trudności z krótkim i spójnym przedstawieniem kluczowego sensu przekazu, co może prowadzić do nadmiernego wchodzenia w szczegóły i utraty klarowności komunikatu. Może koncentrować się głównie na prezentowaniu własnego stanowiska."
  },
  {
    competencyCode: "komunikacja",
    level: "medium",
    audience: "employer",
    text: "Kandydat zazwyczaj nie doświadcza trudności z krótkim i spójnym przedstawieniem kluczowego sensu przekazu, jednak w niektórych sytuacjach podczas rozmowy wchodzi nadmiernie w szczegóły. W warunkach presji czasu nie zawsze udaje mu się odpowiednio dopracować formę wypowiedzi pisemnej."
  },
  {
    competencyCode: "komunikacja",
    level: "high",
    audience: "employer",
    text: "Kandydat zazwyczaj sprawnie formułuje przekazy w sposób zwięzły, spójny i adekwatny do celu komunikacji. Może świadomie i elastycznie dostosowywać język, formę oraz poziom szczegółowości do odbiorcy i kontekstu sytuacyjnego."
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "low",
    audience: "employer",
    text: "W niektórych sytuacjach kandydat może doświadczać trudności z rozkładaniem skomplikowanych problemów na mniejsze, czytelne części oraz z selekcją informacji. Może wyciągać fragmentaryczne wnioski, mniej logicznie powiązane."
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "medium",
    audience: "employer",
    text: "Kandydat zazwyczaj potrafi rozłożyć skomplikowane problemy na etapy, wybrać najważniejsze informacje i wyciągać spójne wnioski. Może logicznie łączyć fakty, choć nie zawsze uwzględnia pełen kontekst."
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "high",
    audience: "employer",
    text: "Kandydat sprawnie dekomponuje problemy, selekcjonuje dane i syntetyzuje informacje w sposób uporządkowany i logiczny. Potrafi formułować jasne wnioski, które dobrze opisują zależności i wspierają proces decyzyjny."
  },
  {
    competencyCode: "out_of_the_box",
    level: "low",
    audience: "employer",
    text: "W sytuacjach wymagających kreatywnego podejścia kandydat może częściej opierać się na znanych schematach oraz minimalizować eksperymentowanie. Zmienne i niejasne warunki mogą powodować dezorientację."
  },
  {
    competencyCode: "out_of_the_box",
    level: "medium",
    audience: "employer",
    text: "Kandydat interesuje się nowościami i zdobywa nowe informacje w umiarkowanym zakresie. W wielu sytuacjach może patrzeć na zadanie z innej perspektywy i łączyć różne inspiracje."
  },
  {
    competencyCode: "out_of_the_box",
    level: "high",
    audience: "employer",
    text: "Kandydat swobodnie generuje i rozwija niestandardowe koncepcje, łącząc różnorodne idee w spójne rozwiązania. Może sprawnie redefiniować problemy oraz tolerować niepewność i zmienność."
  },
  {
    competencyCode: "determinacja",
    level: "low",
    audience: "employer",
    text: "Utrzymanie koncentracji na celu oraz systematyczna realizacja zadań mogą być dla kandydata trudne, zwłaszcza w przypadku pojawienia się przeszkód. Motywacja może mieć charakter zmienny."
  },
  {
    competencyCode: "determinacja",
    level: "medium",
    audience: "employer",
    text: "W większości sytuacji kandydat potrafi wyznaczać cele i realizować je konsekwentnie, utrzymując koncentrację na najważniejszych działaniach. Jego motywacja jest względnie stabilna."
  },
  {
    competencyCode: "determinacja",
    level: "high",
    audience: "employer",
    text: "Kandydat konsekwentnie dąży do osiągnięcia celów, utrzymując koncentrację oraz zaangażowanie nawet w trudnych warunkach. Systematycznie monitoruje postępy i wprowadza działania korygujące."
  },
  {
    competencyCode: "adaptacja",
    level: "low",
    audience: "employer",
    text: "Kandydat koncentruje się przede wszystkim na własnych obowiązkach, nie zawsze uwzględniając ich wpływ na pracę innych. W obliczu zmian może potrzebować więcej czasu na zrozumienie sytuacji."
  },
  {
    competencyCode: "adaptacja",
    level: "medium",
    audience: "employer",
    text: "Kandydat zazwyczaj rozumie wpływ swojej pracy na pracę innych. W wielu sytuacjach potrafi dostosować działania do zmiennych warunków oraz zachować funkcjonalny poziom pracy."
  },
  {
    competencyCode: "adaptacja",
    level: "high",
    audience: "employer",
    text: "Kandydat jest świadomy wpływu swojej pracy na pracę innych. Sprawnie adaptuje sposób myślenia, priorytety oraz działania do sytuacji wymagających elastyczności."
  },
];

// FEEDBACK KULTURY - KANDYDAT
export const candidateCultureFeedback: CultureFeedback[] = [
  { dimensionCode: "relacja_wspolpraca", level: "low", audience: "candidate", text: "Atmosfera zespołu, współpraca oraz relacje w pracy mają dla Ciebie ograniczone znaczenie. Doceniasz wsparcie zespołu, jednak nie jest ono kluczowym czynnikiem przy wyborze miejsca pracy. Preferujesz niezależną pracę i samodzielne realizowanie zadań." },
  { dimensionCode: "relacja_wspolpraca", level: "medium", audience: "candidate", text: "Przyjazna atmosfera i współpraca są dla Ciebie istotne, ale nie decydują o Twojej satysfakcji z pracy. Możesz pracować zarówno w zespole, jak i samodzielnie." },
  { dimensionCode: "relacja_wspolpraca", level: "high", audience: "candidate", text: "Bardzo zależy Ci na wspierającej atmosferze i dobrej współpracy w zespole. Relacje z kolegami i przełożonymi są dla Ciebie bardzo ważne przy wyborze pracy." },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "low", audience: "candidate", text: "Preferujesz środowisko stabilne, ze znanymi i przewidywalnymi procesami, w którym zmiany nie są częste. Wolniej adaptujesz się do nowych sposobów pracy i lubisz stałe, sprawdzone rozwiązania." },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "medium", audience: "candidate", text: "Czasami angażujesz się w testowanie nowych metod i usprawnień, ale nie jest to dla Ciebie kluczowe w pracy. Możesz pracować zarówno w środowisku stabilnym, jak i innowacyjnym." },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "high", audience: "candidate", text: "Bardzo zależy Ci na testowaniu nowych pomysłów, eksperymentowaniu i wdrażaniu usprawnień. Lubisz kreatywne środowisko, w którym zmiany i innowacje są naturalną częścią pracy." },
  { dimensionCode: "wyniki_cele", level: "low", audience: "candidate", text: "Jasno określone cele, mierzalne wyniki oraz ambitne zadania mają dla Ciebie ograniczone znaczenie. Nie motywują Cię wysokie wymagania ani rywalizacja w zespole." },
  { dimensionCode: "wyniki_cele", level: "medium", audience: "candidate", text: "Cele i wyniki pracy są dla Ciebie istotne, jednak nie stanowią jedynego źródła motywacji. Doceniasz jasno określone oczekiwania oraz ambitne zadania, o ile są realistyczne." },
  { dimensionCode: "wyniki_cele", level: "high", audience: "candidate", text: "Jasno określone cele i mierzalne wyniki są dla Ciebie kluczowe. Ambitne zadania oraz wysokie wymagania silnie Cię motywują, a zdrowa rywalizacja w zespole stanowi pozytywny element." },
  { dimensionCode: "stabilnosc_struktura", level: "low", audience: "candidate", text: "Przewidywalność i stabilność środowiska pracy nie są dla Ciebie kluczowe. Jasny podział ról, formalna hierarchia oraz rozbudowane procedury mają ograniczone znaczenie." },
  { dimensionCode: "stabilnosc_struktura", level: "medium", audience: "candidate", text: "Stabilne i przewidywalne środowisko pracy jest dla Ciebie ważne, jednak nie musi być oparte na sztywnej strukturze. Doceniasz jasny podział ról i procedury." },
  { dimensionCode: "stabilnosc_struktura", level: "high", audience: "candidate", text: "Cenisz przewidywalne i stabilne środowisko pracy oparte na jasno określonych zasadach. Jasny podział ról i odpowiedzialności zapewnia Ci poczucie bezpieczeństwa." },
  { dimensionCode: "autonomia_styl_pracy", level: "low", audience: "candidate", text: "Możliwość samodzielnego podejmowania decyzji oraz elastyczna organizacja pracy mają dla Ciebie ograniczone znaczenie. Preferujesz jasno określone wytyczne i regularny nadzór." },
  { dimensionCode: "autonomia_styl_pracy", level: "medium", audience: "candidate", text: "Doceniasz samodzielność i elastyczność, o ile towarzyszą im jasne cele i ramy działania. Autonomia jest dla Ciebie ważna, ale nie kluczowa." },
  { dimensionCode: "autonomia_styl_pracy", level: "high", audience: "candidate", text: "Samodzielne podejmowanie decyzji oraz elastyczna organizacja pracy są dla Ciebie istotnymi czynnikami efektywności. Cenisz środowisko oparte na zaufaniu i samodzielności." },
  { dimensionCode: "wlb_dobrostan", level: "low", audience: "candidate", text: "Równowaga między pracą a życiem prywatnym nie jest dla Ciebie kluczowa. Nadgodziny i intensywne tempo pracy są akceptowalne." },
  { dimensionCode: "wlb_dobrostan", level: "medium", audience: "candidate", text: "Równowaga między pracą a życiem prywatnym jest dla Ciebie ważna, choć w niektórych sytuacjach dopuszczasz dodatkowe obciążenie." },
  { dimensionCode: "wlb_dobrostan", level: "high", audience: "candidate", text: "Równowaga między pracą a życiem prywatnym jest dla Ciebie kluczowa. Nadgodziny nie są akceptowalne jako standard, a dbałość o samopoczucie jest istotna." },
];

// FEEDBACK KULTURY - PRACODAWCA
export const employerCultureFeedback: CultureFeedback[] = [
  { dimensionCode: "relacja_wspolpraca", level: "low", audience: "employer", text: "Współpraca i wsparcie między pracownikami występują w ograniczonym stopniu. Kultura organizacyjna często opiera się głównie na indywidualnych osiągnięciach i rywalizacji." },
  { dimensionCode: "relacja_wspolpraca", level: "medium", audience: "employer", text: "Zespoły współpracują, ale nie zawsze w pełni. Relacje i wsparcie są umiarkowane." },
  { dimensionCode: "relacja_wspolpraca", level: "high", audience: "employer", text: "W firmie panuje silna kultura współpracy, wzajemnego wsparcia i otwartości. Pracownicy chętnie dzielą się wiedzą, a sukcesy zespołu są doceniane." },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "low", audience: "employer", text: "W firmie zmiany i usprawnienia pojawiają się rzadko, a procesy są sztywne i ustalone z góry. Pracownicy mają ograniczony wpływ na sposób realizacji zadań." },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "medium", audience: "employer", text: "W firmie pojawiają się okazjonalne usprawnienia i zmiany w procesach, ale nie są one systematycznie wdrażane." },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "high", audience: "employer", text: "W firmie zmiany i eksperymenty są naturalną częścią codziennej pracy. Pracownicy aktywnie uczestniczą w testowaniu nowych rozwiązań." },
  { dimensionCode: "wyniki_cele", level: "low", audience: "employer", text: "Oczekiwane rezultaty pracy nie są jasno komunikowane lub pojawiają się nieregularnie. Cele i priorytety nie zawsze są precyzyjnie określone." },
  { dimensionCode: "wyniki_cele", level: "medium", audience: "employer", text: "Pracownicy otrzymują informacje dotyczące oczekiwanych rezultatów, choć nie zawsze konsekwentnie. Wyniki są brane pod uwagę." },
  { dimensionCode: "wyniki_cele", level: "high", audience: "employer", text: "Oczekiwane rezultaty są jasno i regularnie komunikowane. Cele oraz priorytety są konsekwentnie przekazywane i aktualizowane." },
  { dimensionCode: "stabilnosc_struktura", level: "low", audience: "employer", text: "Zakres obowiązków nie zawsze jest jasno określony na początku współpracy. Odpowiedzialności decyzyjne są rozproszone." },
  { dimensionCode: "stabilnosc_struktura", level: "medium", audience: "employer", text: "Zakres obowiązków jest zazwyczaj określany, choć bywa zmienny. Odpowiedzialności są przypisane do ról." },
  { dimensionCode: "stabilnosc_struktura", level: "high", audience: "employer", text: "Zakres obowiązków jest jasno określony. Odpowiedzialności są jednoznacznie przypisane do ról. Funkcjonują spójne procedury i standardy." },
  { dimensionCode: "autonomia_styl_pracy", level: "low", audience: "employer", text: "Pracownicy mają ograniczoną możliwość samodzielnego podejmowania decyzji. Organizacja pracy jest w dużej mierze narzucana odgórnie." },
  { dimensionCode: "autonomia_styl_pracy", level: "medium", audience: "employer", text: "Pracownicy mogą samodzielnie podejmować decyzje w określonym zakresie. Organizacja pracy bywa ustalana przez pracownika lub zespół." },
  { dimensionCode: "autonomia_styl_pracy", level: "high", audience: "employer", text: "Pracownicy samodzielnie podejmują decyzje i mają realny wpływ na organizację pracy. Praca jest rozliczana przede wszystkim na podstawie rezultatów." },
  { dimensionCode: "wlb_dobrostan", level: "low", audience: "employer", text: "Praca ponad normy czasu pracy jest standardem. Obciążenie pracą nie jest monitorowane ani omawiane." },
  { dimensionCode: "wlb_dobrostan", level: "medium", audience: "employer", text: "Obciążenie pracą bywa omawiane, a praca ponad normy nie jest standardem w każdym dziale." },
  { dimensionCode: "wlb_dobrostan", level: "high", audience: "employer", text: "Organizacja aktywnie dba o równowagę pracy i życia prywatnego. Nadgodziny nie są standardem, obciążenie jest monitorowane." },
];

export const getFeedback = (
  type: 'competency' | 'culture',
  code: string,
  level: FeedbackLevel,
  audience: Audience
): string => {
  if (type === 'competency') {
    const feedbackList = audience === 'candidate' ? candidateCompetencyFeedback : employerCompetencyFeedback;
    const feedback = feedbackList.find(f => f.competencyCode === code && f.level === level);
    return feedback?.text || 'Brak opisu dla tego poziomu.';
  } else {
    const feedbackList = audience === 'candidate' ? candidateCultureFeedback : employerCultureFeedback;
    const feedback = feedbackList.find(f => f.dimensionCode === code && f.level === level);
    return feedback?.text || 'Brak opisu dla tego poziomu.';
  }
};
