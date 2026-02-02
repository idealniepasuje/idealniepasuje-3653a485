// Feedback data z arkuszy candidate_feedback_kompet, candidate_feedback_kultura, employer_feedback_kompet, employer_feedback_kultura

export type FeedbackLevel = 'low' | 'medium' | 'high';
export type Audience = 'candidate' | 'employer';

export interface CompetencyFeedback {
  competencyCode: string;
  level: FeedbackLevel;
  audience: Audience;
  text: { pl: string; en: string };
}

export interface CultureFeedback {
  dimensionCode: string;
  level: FeedbackLevel;
  audience: Audience;
  text: { pl: string; en: string };
}

// Progi punktowe
export const getLevel = (average: number): FeedbackLevel => {
  if (average <= 2.2) return 'low';
  if (average <= 3.7) return 'medium';
  return 'high';
};

export const levelLabels = {
  pl: {
    low: { label: 'Niski', color: 'destructive' },
    medium: { label: 'Średni', color: 'cta' },
    high: { label: 'Wysoki', color: 'success' },
  },
  en: {
    low: { label: 'Low', color: 'destructive' },
    medium: { label: 'Medium', color: 'cta' },
    high: { label: 'High', color: 'success' },
  },
};

// FEEDBACK KOMPETENCJI - KANDYDAT
export const candidateCompetencyFeedback: CompetencyFeedback[] = [
  {
    competencyCode: "komunikacja",
    level: "low",
    audience: "candidate",
    text: { 
      pl: "Często masz trudność z krótkim i spójnym przedstawieniem kluczowego sensu przekazu, co prowadzi niekiedy do nadmiernego wchodzenia w szczegóły i utraty klarowności komunikatu. Zwykle przekazujesz podobne treści różnym odbiorcom w tej samej formie, rzadko dostosowując język i styl do ich potrzeb. W rozmowach koncentrujesz się głównie na prezentowaniu własnego stanowiska, co bywa związane z przerywaniem innym lub stosowaniem nacisku zamiast argumentów.",
      en: "You often have difficulty briefly and coherently presenting the key message, sometimes going into excessive detail and losing clarity. You usually convey similar content to different audiences in the same form, rarely adjusting language and style to their needs. In conversations, you mainly focus on presenting your own position, which sometimes involves interrupting others or using pressure instead of arguments."
    }
  },
  {
    competencyCode: "komunikacja",
    level: "medium",
    audience: "candidate",
    text: { 
      pl: "Zazwyczaj nie masz trudności z krótkim i spójnym przedstawieniem kluczowego sensu przekazu, jednak podczas rozmowy niekiedy wchodzisz nadmiernie w szczegóły. Zdarza się, że komunikujesz podobne treści do różnych odbiorców w zbliżonej formie, rzadziej dostosowując język i styl do ich potrzeb oraz kontekstu. W rozmowach bywasz silnie zaangażowany w prezentowanie własnego stanowiska.",
      en: "You usually don't have difficulty briefly and coherently presenting the key message, although you sometimes go into excessive detail. You occasionally communicate similar content to different audiences in a similar form, less often adjusting language and style to their needs and context. In conversations, you can be strongly engaged in presenting your own position."
    }
  },
  {
    competencyCode: "komunikacja",
    level: "high",
    audience: "candidate",
    text: { 
      pl: "Sprawnie formułujesz przekazy w sposób zwięzły, spójny i adekwatny do celu komunikacji, koncentrując się na kluczowych informacjach. Zazwyczaj świadomie i elastycznie dostosowujesz język, formę oraz poziom szczegółowości do odbiorcy i kontekstu sytuacyjnego. W rozmowach dbasz o równowagę między prezentowaniem własnego stanowiska a uważnym słuchaniem innych.",
      en: "You effectively formulate messages in a concise, coherent manner appropriate to the communication goal, focusing on key information. You usually consciously and flexibly adjust language, form and level of detail to the audience and situational context. In conversations, you maintain a balance between presenting your own position and listening carefully to others."
    }
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "low",
    audience: "candidate",
    text: { 
      pl: "W niektórych sytuacjach możesz doświadczać trudności z rozkładaniem skomplikowanych problemów na mniejsze, czytelne części oraz z selekcją informacji, co sprzyja gubieniu się w szczegółach lub intuicyjnemu podejmowaniu decyzji. Niekiedy możesz wyciągać fragmentaryczne wnioski, mniej logicznie powiązane oraz mniej użyteczne dla innych.",
      en: "In some situations, you may experience difficulty breaking down complex problems into smaller, readable parts and selecting information, which leads to getting lost in details or making intuitive decisions. Sometimes you may draw fragmentary conclusions that are less logically connected and less useful to others."
    }
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "medium",
    audience: "candidate",
    text: { 
      pl: "Zazwyczaj potrafisz rozłożyć skomplikowane problemy na etapy, wybrać najważniejsze informacje i wyciągnąć spójne wnioski. Logicznie łączysz fakty, choć nie zawsze uwzględniasz pełen kontekst lub niekiedy nie jest on w pełni zrozumiały dla innych. W warunkach niepewności jesteś gotów podjąć decyzję na podstawie dostępnych danych.",
      en: "You can usually break down complex problems into stages, select the most important information and draw coherent conclusions. You logically connect facts, although you don't always consider the full context or sometimes it's not fully understandable to others. In uncertain conditions, you're ready to make decisions based on available data."
    }
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "high",
    audience: "candidate",
    text: { 
      pl: "Sprawnie dekomponujesz problemy, selekcjonujesz dane i syntetyzujesz informacje w sposób uporządkowany i logiczny. Potrafisz formułować jasne wnioski, które dobrze opisują zależności i wspierają proces decyzyjny, również przy niepełnych danych. Twoje działania pozwalają przechodzić od analizy do decyzji w sposób czytelny.",
      en: "You efficiently decompose problems, select data and synthesize information in an organized and logical manner. You can formulate clear conclusions that well describe relationships and support the decision-making process, even with incomplete data. Your actions allow transitioning from analysis to decision in a clear way."
    }
  },
  {
    competencyCode: "out_of_the_box",
    level: "low",
    audience: "candidate",
    text: { 
      pl: "W sytuacjach wymagających kreatywnego podejścia możesz częściej opierać się na znanych schematach oraz minimalizować eksperymentowanie. Zmienne i niejasne warunki mogą powodować dezorientację, co utrudnia redefiniowanie problemu lub formułowanie nieszablonowych koncepcji. Propozycje rozwiązań bywają przewidywalne.",
      en: "In situations requiring a creative approach, you may more often rely on known patterns and minimize experimentation. Variable and unclear conditions can cause disorientation, making it difficult to redefine the problem or formulate unconventional concepts. Solution proposals tend to be predictable."
    }
  },
  {
    competencyCode: "out_of_the_box",
    level: "medium",
    audience: "candidate",
    text: { 
      pl: "Interesujesz się nowościami i zdobywasz nowe informacje w umiarkowanym zakresie. W wielu sytuacjach potrafisz spojrzeć na zadanie z innej perspektywy i łączyć różne inspiracje, zwłaszcza kiedy masz przestrzeń na eksplorację. Zwykle tolerujesz pewien poziom niejasności oraz jesteś gotów przetestować nowe pomysły.",
      en: "You're interested in novelties and acquire new information to a moderate extent. In many situations, you can look at a task from a different perspective and combine various inspirations, especially when you have space for exploration. You usually tolerate a certain level of ambiguity and are ready to test new ideas."
    }
  },
  {
    competencyCode: "out_of_the_box",
    level: "high",
    audience: "candidate",
    text: { 
      pl: "Swobodnie generujesz i rozwijasz niestandardowe koncepcje, łącząc różnorodne idee w spójne rozwiązania. Sprawnie redefiniujesz problemy oraz tolerujesz niepewność i zmienność jako integralne elementy procesu twórczego. Twoje pomysły są nie tylko kreatywne, lecz także wdrażane w praktyce.",
      en: "You freely generate and develop non-standard concepts, combining diverse ideas into coherent solutions. You efficiently redefine problems and tolerate uncertainty and variability as integral elements of the creative process. Your ideas are not only creative but also implemented in practice."
    }
  },
  {
    competencyCode: "determinacja",
    level: "low",
    audience: "candidate",
    text: { 
      pl: "Utrzymanie koncentracji na celu oraz systematyczna realizacja zadań mogą być dla Ciebie trudne, zwłaszcza w przypadku pojawienia się przeszkód. Zdarza się, że zamiast konsekwentnie zmierzać do rezultatu, odchodzisz w poboczne wątki i rozpraszasz uwagę na dodatkowe elementy zadania. Motywacja często może mieć charakter zmienny.",
      en: "Maintaining focus on the goal and systematic task completion may be difficult for you, especially when obstacles arise. Sometimes instead of consistently working toward results, you veer into side topics and disperse attention to additional task elements. Motivation can often be variable."
    }
  },
  {
    competencyCode: "determinacja",
    level: "medium",
    audience: "candidate",
    text: { 
      pl: "W większości sytuacji potrafisz wyznaczać cele i realizować je konsekwentnie, utrzymując koncentrację na najważniejszych działaniach. Twoja motywacja jest względnie stabilna i może jedynie niekiedy wymagać wspierania dodatkowymi bodźcami zewnętrznymi. Śledzisz postępy i wprowadzasz korekty.",
      en: "In most situations, you can set goals and achieve them consistently while maintaining focus on the most important activities. Your motivation is relatively stable and may only occasionally require support from external stimuli. You track progress and make corrections."
    }
  },
  {
    competencyCode: "determinacja",
    level: "high",
    audience: "candidate",
    text: { 
      pl: "Konsekwentnie dążysz do osiągnięcia celów, utrzymując koncentrację oraz zaangażowanie nawet w trudnych warunkach. Systematycznie monitorujesz postępy, wprowadzasz działania korygujące oraz samodzielnie podtrzymujesz motywację. Wyzwania traktujesz jako naturalny element procesu.",
      en: "You consistently strive to achieve goals while maintaining focus and engagement even in difficult conditions. You systematically monitor progress, implement corrective actions and independently maintain motivation. You treat challenges as a natural part of the process."
    }
  },
  {
    competencyCode: "adaptacja",
    level: "low",
    audience: "candidate",
    text: { 
      pl: "Zajmujesz się przede wszystkim własnymi obowiązkami, nie zawsze uwzględniając ich wpływ na pracę innych. W obliczu zmian możesz potrzebować więcej czasu na zrozumienie sytuacji oraz wyciszenie reakcji emocjonalnych. Nowe warunki obniżają Twoje tempo działania i utrzymanie skuteczności.",
      en: "You mainly focus on your own duties, not always considering their impact on others' work. When facing changes, you may need more time to understand the situation and calm emotional reactions. New conditions lower your pace of action and effectiveness."
    }
  },
  {
    competencyCode: "adaptacja",
    level: "medium",
    audience: "candidate",
    text: { 
      pl: "Zazwyczaj rozumiesz wpływ swojej pracy na pracę innych. W wielu sytuacjach potrafisz dostosować swoje działania do zmiennych warunków oraz zachować funkcjonalny poziom pracy. Zwykle rozumiesz kontekst zmian i podejmujesz decyzje po analizie konsekwencji.",
      en: "You usually understand the impact of your work on others' work. In many situations, you can adjust your actions to changing conditions and maintain a functional level of work. You usually understand the context of changes and make decisions after analyzing consequences."
    }
  },
  {
    competencyCode: "adaptacja",
    level: "high",
    audience: "candidate",
    text: { 
      pl: "Zawsze jesteś świadomy i uwzględniasz wpływ swojej pracy na pracę innych. Sprawnie adaptujesz sposób myślenia, priorytety oraz działania do sytuacji wymagających elastyczności. Zachowujesz spokój nawet w obliczu presji lub niepewności, utrzymując skuteczność oraz wspierając innych w procesie zmiany.",
      en: "You're always aware of and consider the impact of your work on others' work. You efficiently adapt your thinking, priorities and actions to situations requiring flexibility. You remain calm even under pressure or uncertainty, maintaining effectiveness and supporting others in the change process."
    }
  },
];

// FEEDBACK KOMPETENCJI - PRACODAWCA
export const employerCompetencyFeedback: CompetencyFeedback[] = [
  {
    competencyCode: "komunikacja",
    level: "low",
    audience: "employer",
    text: { 
      pl: "Kandydat może doświadczać trudności z krótkim i spójnym przedstawieniem kluczowego sensu przekazu, co może prowadzić do nadmiernego wchodzenia w szczegóły i utraty klarowności komunikatu. Może koncentrować się głównie na prezentowaniu własnego stanowiska.",
      en: "The candidate may experience difficulty briefly and coherently presenting the key message, which can lead to excessive detail and loss of clarity. They may mainly focus on presenting their own position."
    }
  },
  {
    competencyCode: "komunikacja",
    level: "medium",
    audience: "employer",
    text: { 
      pl: "Kandydat zazwyczaj nie doświadcza trudności z krótkim i spójnym przedstawieniem kluczowego sensu przekazu, jednak w niektórych sytuacjach podczas rozmowy wchodzi nadmiernie w szczegóły. W warunkach presji czasu nie zawsze udaje mu się odpowiednio dopracować formę wypowiedzi pisemnej.",
      en: "The candidate usually doesn't experience difficulty briefly presenting the key message, although in some situations they go into excessive detail. Under time pressure, they don't always manage to properly refine written communication."
    }
  },
  {
    competencyCode: "komunikacja",
    level: "high",
    audience: "employer",
    text: { 
      pl: "Kandydat zazwyczaj sprawnie formułuje przekazy w sposób zwięzły, spójny i adekwatny do celu komunikacji. Może świadomie i elastycznie dostosowywać język, formę oraz poziom szczegółowości do odbiorcy i kontekstu sytuacyjnego.",
      en: "The candidate usually effectively formulates messages in a concise, coherent manner appropriate to the communication goal. They can consciously and flexibly adjust language, form and level of detail to the audience and context."
    }
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "low",
    audience: "employer",
    text: { 
      pl: "W niektórych sytuacjach kandydat może doświadczać trudności z rozkładaniem skomplikowanych problemów na mniejsze, czytelne części oraz z selekcją informacji. Może wyciągać fragmentaryczne wnioski, mniej logicznie powiązane.",
      en: "In some situations, the candidate may experience difficulty breaking down complex problems into smaller parts and selecting information. They may draw fragmentary, less logically connected conclusions."
    }
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "medium",
    audience: "employer",
    text: { 
      pl: "Kandydat zazwyczaj potrafi rozłożyć skomplikowane problemy na etapy, wybrać najważniejsze informacje i wyciągać spójne wnioski. Może logicznie łączyć fakty, choć nie zawsze uwzględnia pełen kontekst.",
      en: "The candidate can usually break down complex problems into stages, select the most important information and draw coherent conclusions. They can logically connect facts, although they don't always consider the full context."
    }
  },
  {
    competencyCode: "myslenie_analityczne",
    level: "high",
    audience: "employer",
    text: { 
      pl: "Kandydat sprawnie dekomponuje problemy, selekcjonuje dane i syntetyzuje informacje w sposób uporządkowany i logiczny. Potrafi formułować jasne wnioski, które dobrze opisują zależności i wspierają proces decyzyjny.",
      en: "The candidate efficiently decomposes problems, selects data and synthesizes information in an organized and logical manner. They can formulate clear conclusions that well describe relationships and support decision-making."
    }
  },
  {
    competencyCode: "out_of_the_box",
    level: "low",
    audience: "employer",
    text: { 
      pl: "W sytuacjach wymagających kreatywnego podejścia kandydat może częściej opierać się na znanych schematach oraz minimalizować eksperymentowanie. Zmienne i niejasne warunki mogą powodować dezorientację.",
      en: "In situations requiring a creative approach, the candidate may more often rely on known patterns and minimize experimentation. Variable and unclear conditions can cause disorientation."
    }
  },
  {
    competencyCode: "out_of_the_box",
    level: "medium",
    audience: "employer",
    text: { 
      pl: "Kandydat interesuje się nowościami i zdobywa nowe informacje w umiarkowanym zakresie. W wielu sytuacjach może patrzeć na zadanie z innej perspektywy i łączyć różne inspiracje.",
      en: "The candidate is interested in novelties and acquires new information to a moderate extent. In many situations, they can look at a task from a different perspective and combine various inspirations."
    }
  },
  {
    competencyCode: "out_of_the_box",
    level: "high",
    audience: "employer",
    text: { 
      pl: "Kandydat swobodnie generuje i rozwija niestandardowe koncepcje, łącząc różnorodne idee w spójne rozwiązania. Może sprawnie redefiniować problemy oraz tolerować niepewność i zmienność.",
      en: "The candidate freely generates and develops non-standard concepts, combining diverse ideas into coherent solutions. They can efficiently redefine problems and tolerate uncertainty and variability."
    }
  },
  {
    competencyCode: "determinacja",
    level: "low",
    audience: "employer",
    text: { 
      pl: "Utrzymanie koncentracji na celu oraz systematyczna realizacja zadań mogą być dla kandydata trudne, zwłaszcza w przypadku pojawienia się przeszkód. Motywacja może mieć charakter zmienny.",
      en: "Maintaining focus on the goal and systematic task completion may be difficult for the candidate, especially when obstacles arise. Motivation can be variable."
    }
  },
  {
    competencyCode: "determinacja",
    level: "medium",
    audience: "employer",
    text: { 
      pl: "W większości sytuacji kandydat potrafi wyznaczać cele i realizować je konsekwentnie, utrzymując koncentrację na najważniejszych działaniach. Jego motywacja jest względnie stabilna.",
      en: "In most situations, the candidate can set goals and achieve them consistently while maintaining focus on the most important activities. Their motivation is relatively stable."
    }
  },
  {
    competencyCode: "determinacja",
    level: "high",
    audience: "employer",
    text: { 
      pl: "Kandydat konsekwentnie dąży do osiągnięcia celów, utrzymując koncentrację oraz zaangażowanie nawet w trudnych warunkach. Systematycznie monitoruje postępy i wprowadza działania korygujące.",
      en: "The candidate consistently strives to achieve goals while maintaining focus and engagement even in difficult conditions. They systematically monitor progress and implement corrective actions."
    }
  },
  {
    competencyCode: "adaptacja",
    level: "low",
    audience: "employer",
    text: { 
      pl: "Kandydat koncentruje się przede wszystkim na własnych obowiązkach, nie zawsze uwzględniając ich wpływ na pracę innych. W obliczu zmian może potrzebować więcej czasu na zrozumienie sytuacji.",
      en: "The candidate mainly focuses on their own duties, not always considering their impact on others' work. When facing changes, they may need more time to understand the situation."
    }
  },
  {
    competencyCode: "adaptacja",
    level: "medium",
    audience: "employer",
    text: { 
      pl: "Kandydat zazwyczaj rozumie wpływ swojej pracy na pracę innych. W wielu sytuacjach potrafi dostosować działania do zmiennych warunków oraz zachować funkcjonalny poziom pracy.",
      en: "The candidate usually understands the impact of their work on others' work. In many situations, they can adjust actions to changing conditions and maintain a functional level of work."
    }
  },
  {
    competencyCode: "adaptacja",
    level: "high",
    audience: "employer",
    text: { 
      pl: "Kandydat jest świadomy wpływu swojej pracy na pracę innych. Sprawnie adaptuje sposób myślenia, priorytety oraz działania do sytuacji wymagających elastyczności.",
      en: "The candidate is aware of the impact of their work on others' work. They efficiently adapt their thinking, priorities and actions to situations requiring flexibility."
    }
  },
];

// FEEDBACK KULTURY - KANDYDAT
export const candidateCultureFeedback: CultureFeedback[] = [
  { dimensionCode: "relacja_wspolpraca", level: "low", audience: "candidate", text: { pl: "Atmosfera zespołu, współpraca oraz relacje w pracy mają dla Ciebie ograniczone znaczenie. Doceniasz wsparcie zespołu, jednak nie jest ono kluczowym czynnikiem przy wyborze miejsca pracy. Preferujesz niezależną pracę i samodzielne realizowanie zadań.", en: "Team atmosphere, cooperation and relationships at work have limited importance to you. You appreciate team support, but it's not a key factor when choosing a workplace. You prefer independent work and completing tasks on your own." } },
  { dimensionCode: "relacja_wspolpraca", level: "medium", audience: "candidate", text: { pl: "Przyjazna atmosfera i współpraca są dla Ciebie istotne, ale nie decydują o Twojej satysfakcji z pracy. Możesz pracować zarówno w zespole, jak i samodzielnie.", en: "A friendly atmosphere and cooperation are important to you, but they don't determine your job satisfaction. You can work both in a team and independently." } },
  { dimensionCode: "relacja_wspolpraca", level: "high", audience: "candidate", text: { pl: "Bardzo zależy Ci na wspierającej atmosferze i dobrej współpracy w zespole. Relacje z kolegami i przełożonymi są dla Ciebie bardzo ważne przy wyborze pracy.", en: "You care a lot about a supportive atmosphere and good teamwork. Relationships with colleagues and supervisors are very important to you when choosing a job." } },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "low", audience: "candidate", text: { pl: "Preferujesz środowisko stabilne, ze znanymi i przewidywalnymi procesami, w którym zmiany nie są częste. Wolniej adaptujesz się do nowych sposobów pracy i lubisz stałe, sprawdzone rozwiązania.", en: "You prefer a stable environment with known and predictable processes where changes are not frequent. You adapt more slowly to new ways of working and like established, proven solutions." } },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "medium", audience: "candidate", text: { pl: "Czasami angażujesz się w testowanie nowych metod i usprawnień, ale nie jest to dla Ciebie kluczowe w pracy. Możesz pracować zarówno w środowisku stabilnym, jak i innowacyjnym.", en: "Sometimes you engage in testing new methods and improvements, but it's not crucial for you at work. You can work in both stable and innovative environments." } },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "high", audience: "candidate", text: { pl: "Bardzo zależy Ci na testowaniu nowych pomysłów, eksperymentowaniu i wdrażaniu usprawnień. Lubisz kreatywne środowisko, w którym zmiany i innowacje są naturalną częścią pracy.", en: "You care a lot about testing new ideas, experimenting and implementing improvements. You like a creative environment where changes and innovations are a natural part of work." } },
  { dimensionCode: "wyniki_cele", level: "low", audience: "candidate", text: { pl: "Jasno określone cele, mierzalne wyniki oraz ambitne zadania mają dla Ciebie ograniczone znaczenie. Nie motywują Cię wysokie wymagania ani rywalizacja w zespole.", en: "Clearly defined goals, measurable results and ambitious tasks have limited importance to you. High demands or team competition don't motivate you." } },
  { dimensionCode: "wyniki_cele", level: "medium", audience: "candidate", text: { pl: "Cele i wyniki pracy są dla Ciebie istotne, jednak nie stanowią jedynego źródła motywacji. Doceniasz jasno określone oczekiwania oraz ambitne zadania, o ile są realistyczne.", en: "Goals and work results are important to you, but they're not the only source of motivation. You appreciate clearly defined expectations and ambitious tasks, as long as they're realistic." } },
  { dimensionCode: "wyniki_cele", level: "high", audience: "candidate", text: { pl: "Jasno określone cele i mierzalne wyniki są dla Ciebie kluczowe. Ambitne zadania oraz wysokie wymagania silnie Cię motywują, a zdrowa rywalizacja w zespole stanowi pozytywny element.", en: "Clearly defined goals and measurable results are crucial for you. Ambitious tasks and high demands strongly motivate you, and healthy team competition is a positive element." } },
  { dimensionCode: "stabilnosc_struktura", level: "low", audience: "candidate", text: { pl: "Przewidywalność i stabilność środowiska pracy nie są dla Ciebie kluczowe. Jasny podział ról, formalna hierarchia oraz rozbudowane procedury mają ograniczone znaczenie.", en: "Predictability and stability of the work environment are not crucial for you. Clear role division, formal hierarchy and extensive procedures have limited importance." } },
  { dimensionCode: "stabilnosc_struktura", level: "medium", audience: "candidate", text: { pl: "Stabilne i przewidywalne środowisko pracy jest dla Ciebie ważne, jednak nie musi być oparte na sztywnej strukturze. Doceniasz jasny podział ról i procedury.", en: "A stable and predictable work environment is important to you, but it doesn't have to be based on rigid structure. You appreciate clear role division and procedures." } },
  { dimensionCode: "stabilnosc_struktura", level: "high", audience: "candidate", text: { pl: "Cenisz przewidywalne i stabilne środowisko pracy oparte na jasno określonych zasadach. Jasny podział ról i odpowiedzialności zapewnia Ci poczucie bezpieczeństwa.", en: "You value a predictable and stable work environment based on clearly defined rules. Clear division of roles and responsibilities gives you a sense of security." } },
  { dimensionCode: "autonomia_styl_pracy", level: "low", audience: "candidate", text: { pl: "Możliwość samodzielnego podejmowania decyzji oraz elastyczna organizacja pracy mają dla Ciebie ograniczone znaczenie. Preferujesz jasno określone wytyczne i regularny nadzór.", en: "The ability to make independent decisions and flexible work organization have limited importance to you. You prefer clear guidelines and regular supervision." } },
  { dimensionCode: "autonomia_styl_pracy", level: "medium", audience: "candidate", text: { pl: "Doceniasz samodzielność i elastyczność, o ile towarzyszą im jasne cele i ramy działania. Autonomia jest dla Ciebie ważna, ale nie kluczowa.", en: "You appreciate independence and flexibility, as long as they come with clear goals and frameworks. Autonomy is important to you, but not crucial." } },
  { dimensionCode: "autonomia_styl_pracy", level: "high", audience: "candidate", text: { pl: "Samodzielne podejmowanie decyzji oraz elastyczna organizacja pracy są dla Ciebie istotnymi czynnikami efektywności. Cenisz środowisko oparte na zaufaniu i samodzielności.", en: "Making independent decisions and flexible work organization are important efficiency factors for you. You value an environment based on trust and independence." } },
  { dimensionCode: "wlb_dobrostan", level: "low", audience: "candidate", text: { pl: "Równowaga między pracą a życiem prywatnym nie jest dla Ciebie kluczowa. Nadgodziny i intensywne tempo pracy są akceptowalne.", en: "Work-life balance is not crucial for you. Overtime and intensive work pace are acceptable." } },
  { dimensionCode: "wlb_dobrostan", level: "medium", audience: "candidate", text: { pl: "Równowaga między pracą a życiem prywatnym jest dla Ciebie ważna, choć w niektórych sytuacjach dopuszczasz dodatkowe obciążenie.", en: "Work-life balance is important to you, although in some situations you allow additional workload." } },
  { dimensionCode: "wlb_dobrostan", level: "high", audience: "candidate", text: { pl: "Równowaga między pracą a życiem prywatnym jest dla Ciebie kluczowa. Nadgodziny nie są akceptowalne jako standard, a dbałość o samopoczucie jest istotna.", en: "Work-life balance is crucial for you. Overtime is not acceptable as standard, and caring for well-being is important." } },
];

// FEEDBACK KULTURY - PRACODAWCA
export const employerCultureFeedback: CultureFeedback[] = [
  { dimensionCode: "relacja_wspolpraca", level: "low", audience: "employer", text: { pl: "Współpraca i wsparcie między pracownikami występują w ograniczonym stopniu. Kultura organizacyjna często opiera się głównie na indywidualnych osiągnięciach i rywalizacji.", en: "Cooperation and support among employees occur to a limited extent. Organizational culture is often based mainly on individual achievements and competition." } },
  { dimensionCode: "relacja_wspolpraca", level: "medium", audience: "employer", text: { pl: "Zespoły współpracują, ale nie zawsze w pełni. Relacje i wsparcie są umiarkowane.", en: "Teams cooperate, but not always fully. Relationships and support are moderate." } },
  { dimensionCode: "relacja_wspolpraca", level: "high", audience: "employer", text: { pl: "W firmie panuje silna kultura współpracy, wzajemnego wsparcia i otwartości. Pracownicy chętnie dzielą się wiedzą, a sukcesy zespołu są doceniane.", en: "The company has a strong culture of cooperation, mutual support and openness. Employees willingly share knowledge, and team successes are appreciated." } },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "low", audience: "employer", text: { pl: "W firmie zmiany i usprawnienia pojawiają się rzadko, a procesy są sztywne i ustalone z góry. Pracownicy mają ograniczony wpływ na sposób realizacji zadań.", en: "Changes and improvements rarely occur in the company, and processes are rigid and predetermined. Employees have limited influence on how tasks are performed." } },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "medium", audience: "employer", text: { pl: "W firmie pojawiają się okazjonalne usprawnienia i zmiany w procesach, ale nie są one systematycznie wdrażane.", en: "Occasional improvements and process changes occur in the company, but they are not systematically implemented." } },
  { dimensionCode: "elastycznosc_innowacyjnosc", level: "high", audience: "employer", text: { pl: "W firmie zmiany i eksperymenty są naturalną częścią codziennej pracy. Pracownicy aktywnie uczestniczą w testowaniu nowych rozwiązań.", en: "Changes and experiments are a natural part of daily work in the company. Employees actively participate in testing new solutions." } },
  { dimensionCode: "wyniki_cele", level: "low", audience: "employer", text: { pl: "Oczekiwane rezultaty pracy nie są jasno komunikowane lub pojawiają się nieregularnie. Cele i priorytety nie zawsze są precyzyjnie określone.", en: "Expected work results are not clearly communicated or appear irregularly. Goals and priorities are not always precisely defined." } },
  { dimensionCode: "wyniki_cele", level: "medium", audience: "employer", text: { pl: "Pracownicy otrzymują informacje dotyczące oczekiwanych rezultatów, choć nie zawsze konsekwentnie. Wyniki są brane pod uwagę.", en: "Employees receive information about expected results, although not always consistently. Results are taken into account." } },
  { dimensionCode: "wyniki_cele", level: "high", audience: "employer", text: { pl: "Oczekiwane rezultaty są jasno i regularnie komunikowane. Cele oraz priorytety są konsekwentnie przekazywane i aktualizowane.", en: "Expected results are clearly and regularly communicated. Goals and priorities are consistently conveyed and updated." } },
  { dimensionCode: "stabilnosc_struktura", level: "low", audience: "employer", text: { pl: "Zakres obowiązków nie zawsze jest jasno określony na początku współpracy. Odpowiedzialności decyzyjne są rozproszone.", en: "The scope of duties is not always clearly defined at the beginning of cooperation. Decision-making responsibilities are dispersed." } },
  { dimensionCode: "stabilnosc_struktura", level: "medium", audience: "employer", text: { pl: "Zakres obowiązków jest zazwyczaj określany, choć bywa zmienny. Odpowiedzialności są przypisane do ról.", en: "The scope of duties is usually defined, although it can be variable. Responsibilities are assigned to roles." } },
  { dimensionCode: "stabilnosc_struktura", level: "high", audience: "employer", text: { pl: "Zakres obowiązków jest jasno określony. Odpowiedzialności są jednoznacznie przypisane do ról. Funkcjonują spójne procedury i standardy.", en: "The scope of duties is clearly defined. Responsibilities are unambiguously assigned to roles. Consistent procedures and standards are in place." } },
  { dimensionCode: "autonomia_styl_pracy", level: "low", audience: "employer", text: { pl: "Pracownicy mają ograniczoną możliwość samodzielnego podejmowania decyzji. Organizacja pracy jest w dużej mierze narzucana odgórnie.", en: "Employees have limited ability to make independent decisions. Work organization is largely imposed from above." } },
  { dimensionCode: "autonomia_styl_pracy", level: "medium", audience: "employer", text: { pl: "Pracownicy mogą samodzielnie podejmować decyzje w określonym zakresie. Organizacja pracy bywa ustalana przez pracownika lub zespół.", en: "Employees can make decisions independently within a certain scope. Work organization is sometimes determined by the employee or team." } },
  { dimensionCode: "autonomia_styl_pracy", level: "high", audience: "employer", text: { pl: "Pracownicy samodzielnie podejmują decyzje i mają realny wpływ na organizację pracy. Praca jest rozliczana przede wszystkim na podstawie rezultatów.", en: "Employees independently make decisions and have real influence on work organization. Work is accounted for primarily based on results." } },
  { dimensionCode: "wlb_dobrostan", level: "low", audience: "employer", text: { pl: "Praca ponad normy czasu pracy jest standardem. Obciążenie pracą nie jest monitorowane ani omawiane.", en: "Working beyond standard hours is the norm. Workload is not monitored or discussed." } },
  { dimensionCode: "wlb_dobrostan", level: "medium", audience: "employer", text: { pl: "Obciążenie pracą bywa omawiane, a praca ponad normy nie jest standardem w każdym dziale.", en: "Workload is sometimes discussed, and overtime is not standard in every department." } },
  { dimensionCode: "wlb_dobrostan", level: "high", audience: "employer", text: { pl: "Organizacja aktywnie dba o równowagę pracy i życia prywatnego. Nadgodziny nie są standardem, obciążenie jest monitorowane.", en: "The organization actively cares about work-life balance. Overtime is not standard, workload is monitored." } },
];

export const getFeedback = (
  type: 'competency' | 'culture',
  code: string,
  level: FeedbackLevel,
  audience: Audience,
  lang: string = 'pl'
): string => {
  if (type === 'competency') {
    const feedbackList = audience === 'candidate' ? candidateCompetencyFeedback : employerCompetencyFeedback;
    const feedback = feedbackList.find(f => f.competencyCode === code && f.level === level);
    return feedback?.text[lang as 'pl' | 'en'] || (lang === 'en' ? 'No description for this level.' : 'Brak opisu dla tego poziomu.');
  } else {
    const feedbackList = audience === 'candidate' ? candidateCultureFeedback : employerCultureFeedback;
    const feedback = feedbackList.find(f => f.dimensionCode === code && f.level === level);
    return feedback?.text[lang as 'pl' | 'en'] || (lang === 'en' ? 'No description for this level.' : 'Brak opisu dla tego poziomu.');
  }
};

export const getLocalizedLevelLabels = (lang: string) => {
  return lang === 'en' ? levelLabels.en : levelLabels.pl;
};
