// Pytania o kulturę pracy - z arkusza candidate_kultura i employer_kultura

export interface CultureQuestion {
  id: string;
  dimensionCode: string;
  itemType: 'candidate' | 'employer';
  text: { pl: string; en: string };
}

export const cultureDimensions = {
  pl: {
    relacja_wspolpraca: {
      name: "Relacja i Współpraca",
      description: "Atmosfera, wsparcie i współpraca w zespole",
      icon: "Users",
    },
    elastycznosc_innowacyjnosc: {
      name: "Elastyczność i innowacyjność",
      description: "Zmiany, usprawnienia i testowanie nowych rozwiązań",
      icon: "Sparkles",
    },
    wyniki_cele: {
      name: "Wyniki i cele",
      description: "Jasne cele, mierzalne wyniki i ambitne zadania",
      icon: "TrendingUp",
    },
    stabilnosc_struktura: {
      name: "Stabilność i struktura",
      description: "Przewidywalność, procedury i jasny podział ról",
      icon: "Shield",
    },
    autonomia_styl_pracy: {
      name: "Autonomia i styl pracy",
      description: "Samodzielność i elastyczna organizacja pracy",
      icon: "Compass",
    },
    wlb_dobrostan: {
      name: "Work-life balance",
      description: "Równowaga między pracą a życiem prywatnym",
      icon: "Heart",
    },
  },
  en: {
    relacja_wspolpraca: {
      name: "Relationships & Collaboration",
      description: "Atmosphere, support and teamwork",
      icon: "Users",
    },
    elastycznosc_innowacyjnosc: {
      name: "Flexibility & Innovation",
      description: "Changes, improvements and testing new solutions",
      icon: "Sparkles",
    },
    wyniki_cele: {
      name: "Results & Goals",
      description: "Clear goals, measurable results and ambitious tasks",
      icon: "TrendingUp",
    },
    stabilnosc_struktura: {
      name: "Stability & Structure",
      description: "Predictability, procedures and clear role division",
      icon: "Shield",
    },
    autonomia_styl_pracy: {
      name: "Autonomy & Work Style",
      description: "Independence and flexible work organization",
      icon: "Compass",
    },
    wlb_dobrostan: {
      name: "Work-life Balance",
      description: "Balance between work and personal life",
      icon: "Heart",
    },
  },
};

export const candidateCultureQuestions: CultureQuestion[] = [
  // Relacja i współpraca
  { id: "CULT_RW_C_01", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: { pl: "Ważna jest dla mnie przyjazna i wspierająca atmosfera.", en: "A friendly and supportive atmosphere is important to me." } },
  { id: "CULT_RW_C_02", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: { pl: "Dobre relacje między osobami w zespole są istotne.", en: "Good relationships between team members are important." } },
  { id: "CULT_RW_C_03", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: { pl: "Współpraca i wzajemna pomoc są priorytetem.", en: "Cooperation and mutual help are a priority." } },
  { id: "CULT_RW_C_04", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: { pl: "Zaufanie i otwartość przełożonych są istotne w miejscu pracy.", en: "Trust and openness from supervisors are important in the workplace." } },
  { id: "CULT_RW_C_05", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: { pl: "Praca zespołowa i wspólne cele liczą się dla mnie bardziej niż indywidualna rywalizacja.", en: "Teamwork and shared goals matter more to me than individual competition." } },
  
  // Elastyczność i innowacyjność
  { id: "CULT_EI_C_01", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: { pl: "Lubię środowisko, w którym zmiany i usprawnienia są naturalną częścią codziennej pracy.", en: "I like an environment where changes and improvements are a natural part of daily work." } },
  { id: "CULT_EI_C_02", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: { pl: "Możliwość testowania nowych pomysłów jest ważna.", en: "The opportunity to test new ideas is important." } },
  { id: "CULT_EI_C_03", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: { pl: "Lubię testować nowe metody i szukać nieszablonowych rozwiązań, zamiast trzymać się utartych schematów.", en: "I like testing new methods and looking for unconventional solutions instead of sticking to established patterns." } },
  { id: "CULT_EI_C_04", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: { pl: "Zmiany i eksperymenty są naturalną częścią miejsca pracy.", en: "Changes and experiments are a natural part of the workplace." } },
  { id: "CULT_EI_C_05", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: { pl: "Kreatywność i nieszablonowe rozwiązania są doceniane przez organizację.", en: "Creativity and unconventional solutions are appreciated by the organization." } },
  
  // Wyniki i cele
  { id: "CULT_WC_C_01", dimensionCode: "wyniki_cele", itemType: "candidate", text: { pl: "Ważne są jasno określone cele i mierzalne wyniki pracy.", en: "Clearly defined goals and measurable work results are important." } },
  { id: "CULT_WC_C_02", dimensionCode: "wyniki_cele", itemType: "candidate", text: { pl: "Wysokie wymagania i ambitne zadania motywują do dalszej pracy.", en: "High requirements and ambitious tasks motivate further work." } },
  { id: "CULT_WC_C_03", dimensionCode: "wyniki_cele", itemType: "candidate", text: { pl: "Zdrowa rywalizacja w zespole jest pozytywnym aspektem.", en: "Healthy competition in the team is a positive aspect." } },
  { id: "CULT_WC_C_04", dimensionCode: "wyniki_cele", itemType: "candidate", text: { pl: "Sukces organizacji ocenia się przede wszystkim przez efekty jej pracowników.", en: "The organization's success is primarily measured by employee results." } },
  { id: "CULT_WC_C_05", dimensionCode: "wyniki_cele", itemType: "candidate", text: { pl: "Jasne standardy i kryteria oceny pracy są bardzo istotne.", en: "Clear standards and work evaluation criteria are very important." } },
  { id: "CULT_WC_C_06", dimensionCode: "wyniki_cele", itemType: "candidate", text: { pl: "Wewnętrzna konkurencja między pracownikami motywuje mnie do lepszych wyników.", en: "Internal competition among employees motivates me to better results." } },
  
  // Stabilność i struktura
  { id: "CULT_SS_C_01", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: { pl: "Środowisko pracy powinno być przewidywalne i stabilne.", en: "The work environment should be predictable and stable." } },
  { id: "CULT_SS_C_02", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: { pl: "Jasny podział ról i odpowiedzialności ułatwia działanie i prawidłowe wykonywanie przydzielonych zadań.", en: "A clear division of roles and responsibilities facilitates action and proper execution of assigned tasks." } },
  { id: "CULT_SS_C_03", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: { pl: "Procedury i standardy w organizacji zapewniają poczucie bezpieczeństwa.", en: "Procedures and standards in the organization provide a sense of security." } },
  { id: "CULT_SS_C_04", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: { pl: "Hierarchia i formalna struktura są istotne.", en: "Hierarchy and formal structure are important." } },
  { id: "CULT_SS_C_05", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: { pl: "W pracy ważne są zasady i procedury, które należy respektować.", en: "At work, rules and procedures that should be respected are important." } },
  
  // Autonomia i styl pracy
  { id: "CULT_AS_C_01", dimensionCode: "autonomia_styl_pracy", itemType: "candidate", text: { pl: "Ważna jest możliwość samodzielnego podejmowania decyzji.", en: "The ability to make decisions independently is important." } },
  { id: "CULT_AS_C_02", dimensionCode: "autonomia_styl_pracy", itemType: "candidate", text: { pl: "Elastyczna organizacja pracy zwiększa efektywność.", en: "Flexible work organization increases efficiency." } },
  { id: "CULT_AS_C_03", dimensionCode: "autonomia_styl_pracy", itemType: "candidate", text: { pl: "Odpowiedzialność za własne działania jest motywująca.", en: "Responsibility for one's own actions is motivating." } },
  { id: "CULT_AS_C_04", dimensionCode: "autonomia_styl_pracy", itemType: "candidate", text: { pl: "Nie jest potrzebny stały nadzór, aby wykonywać obowiązki dobrze.", en: "Constant supervision is not needed to perform duties well." } },
  
  // Work-life balance
  { id: "CULT_WLB_C_01", dimensionCode: "wlb_dobrostan", itemType: "candidate", text: { pl: "Równowaga między pracą a życiem prywatnym jest istotna.", en: "Work-life balance is important." } },
  { id: "CULT_WLB_C_02", dimensionCode: "wlb_dobrostan", itemType: "candidate", text: { pl: "Nadgodziny nie powinny być standardem w miejscu pracy.", en: "Overtime should not be standard in the workplace." } },
  { id: "CULT_WLB_C_03", dimensionCode: "wlb_dobrostan", itemType: "candidate", text: { pl: "Ważne jest dla mnie, by pracodawca dbał o moje samopoczucie i chronił przed nadmiernym obciążeniem.", en: "It's important to me that the employer cares about my well-being and protects against excessive workload." } },
  { id: "CULT_WLB_C_04", dimensionCode: "wlb_dobrostan", itemType: "candidate", text: { pl: "Długofalowa stabilność jest ważniejsza niż szybki sukces.", en: "Long-term stability is more important than quick success." } },
];

export const employerCultureQuestions: CultureQuestion[] = [
  // Relacja i współpraca
  { id: "CULT_RW_E_01", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: { pl: "W codziennej pracy pracownicy zwracają się do siebie po pomoc, gdy mają trudność z realizacją zadań.", en: "In daily work, employees turn to each other for help when they have difficulty completing tasks." } },
  { id: "CULT_RW_E_02", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: { pl: "W zespołach częściej dominuje współpraca niż rywalizacja między pracownikami.", en: "In teams, cooperation dominates more often than competition among employees." } },
  { id: "CULT_RW_E_03", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: { pl: "Trudności pojawiające się w zespołach są omawiane podczas spotkań lub rozmów w ciągu dnia lub na komunikatorach.", en: "Difficulties arising in teams are discussed during meetings or conversations throughout the day or on messengers." } },
  { id: "CULT_RW_E_04", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: { pl: "Przełożeni regularnie rozmawiają z pracownikami o trudnościach w pracy.", en: "Supervisors regularly talk to employees about work difficulties." } },
  { id: "CULT_RW_E_05", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: { pl: "W naszej firmie sukcesy zespołu są ważniejsze i wyżej premiowane niż osiągnięcia indywidualnych jednostek.", en: "In our company, team successes are more important and rewarded higher than individual achievements." } },
  
  // Elastyczność i innowacyjność
  { id: "CULT_EI_E_01", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: { pl: "Zmiany i usprawnienia są u nas naturalną częścią codziennej pracy.", en: "Changes and improvements are a natural part of daily work for us." } },
  { id: "CULT_EI_E_02", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: { pl: "Zgłoszone propozycje przez pracowników są omawiane w zespole lub z przełożonym.", en: "Proposals submitted by employees are discussed in the team or with a supervisor." } },
  { id: "CULT_EI_E_03", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: { pl: "W naszej organizacji zachęcamy do eksperymentowania i ciągłego zmieniania sposobów pracy na nowocześniejsze.", en: "In our organization, we encourage experimenting and constantly changing work methods to more modern ones." } },
  { id: "CULT_EI_E_04", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: { pl: "W pracy pojawiają się działania o charakterze testowym lub pilotażowym.", en: "At work, there are test or pilot activities." } },
  { id: "CULT_EI_E_05", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: { pl: "Pracownicy mają wpływ na przebieg realizowanych procesów.", en: "Employees have an impact on the course of implemented processes." } },
  
  // Wyniki i cele
  { id: "CULT_WC_E_01", dimensionCode: "wyniki_cele", itemType: "employer", text: { pl: "Pracownicy otrzymują informacje dotyczące oczekiwanych rezultatów swojej pracy.", en: "Employees receive information about expected results of their work." } },
  { id: "CULT_WC_E_02", dimensionCode: "wyniki_cele", itemType: "employer", text: { pl: "Cele i priorytety są komunikowane w trakcie realizacji zadań.", en: "Goals and priorities are communicated during task execution." } },
  { id: "CULT_WC_E_03", dimensionCode: "wyniki_cele", itemType: "employer", text: { pl: "W naszej firmie zachęcamy pracowników do rywalizacji i porównywania swoich wyników.", en: "In our company, we encourage employees to compete and compare their results." } },
  { id: "CULT_WC_E_04", dimensionCode: "wyniki_cele", itemType: "employer", text: { pl: "Wyniki pracy są brane pod uwagę przy ocenie realizacji zadań.", en: "Work results are taken into account when evaluating task completion." } },
  { id: "CULT_WC_E_05", dimensionCode: "wyniki_cele", itemType: "employer", text: { pl: "Kryteria oceny pracy są komunikowane pracownikom.", en: "Work evaluation criteria are communicated to employees." } },
  { id: "CULT_WC_E_06", dimensionCode: "wyniki_cele", itemType: "employer", text: { pl: "W naszej organizacji stosujemy mechanizmy porównywania wyników i rankingowania pracowników.", en: "In our organization, we use mechanisms for comparing results and ranking employees." } },
  
  // Stabilność i struktura
  { id: "CULT_SS_E_01", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: { pl: "Zakres obowiązków pracowników jest określony na początku współpracy lub projektu.", en: "The scope of employee duties is defined at the beginning of cooperation or project." } },
  { id: "CULT_SS_E_02", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: { pl: "Odpowiedzialności decyzyjne są przypisane do konkretnych ról lub stanowisk.", en: "Decision-making responsibilities are assigned to specific roles or positions." } },
  { id: "CULT_SS_E_03", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: { pl: "W organizacji funkcjonują procedury lub standardy dotyczące sposobu pracy.", en: "The organization has procedures or standards regarding the way of working." } },
  { id: "CULT_SS_E_04", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: { pl: "Decyzje organizacyjne są podejmowane na określonych poziomach struktury.", en: "Organizational decisions are made at specific levels of the structure." } },
  { id: "CULT_SS_E_05", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: { pl: "Zasady obowiązujące w organizacji są komunikowane pracownikom.", en: "Rules in the organization are communicated to employees." } },
  
  // Autonomia i styl pracy
  { id: "CULT_AS_E_01", dimensionCode: "autonomia_styl_pracy", itemType: "employer", text: { pl: "Pracownicy samodzielnie podejmują decyzje dotyczące bieżących zadań.", en: "Employees independently make decisions regarding current tasks." } },
  { id: "CULT_AS_E_02", dimensionCode: "autonomia_styl_pracy", itemType: "employer", text: { pl: "Organizacja pracy (kolejność, tempo, sposób realizacji) jest ustalana przez pracownika lub zespół.", en: "Work organization (order, pace, method of implementation) is determined by the employee or team." } },
  { id: "CULT_AS_E_03", dimensionCode: "autonomia_styl_pracy", itemType: "employer", text: { pl: "Skutki podjętych decyzji są omawiane z pracownikami.", en: "The effects of decisions made are discussed with employees." } },
  { id: "CULT_AS_E_04", dimensionCode: "autonomia_styl_pracy", itemType: "employer", text: { pl: "Praca jest rozliczana na podstawie rezultatów lub wykonanych zadań.", en: "Work is accounted for based on results or tasks completed." } },
  
  // Work-life balance
  { id: "CULT_WLB_E_01", dimensionCode: "wlb_dobrostan", itemType: "employer", text: { pl: "Praca w nadgodzinach jest standardowym elementem funkcjonowania w naszej firmie.", en: "Working overtime is a standard element of functioning in our company." } },
  { id: "CULT_WLB_E_02", dimensionCode: "wlb_dobrostan", itemType: "employer", text: { pl: "Obciążenie pracą jest omawiane w rozmowach z przełożonymi.", en: "Workload is discussed in conversations with supervisors." } },
  { id: "CULT_WLB_E_03", dimensionCode: "wlb_dobrostan", itemType: "employer", text: { pl: "W organizacji monitoruje się obciążenie pracą i w razie potrzeby wprowadza zmiany w organizacji zadań.", en: "The organization monitors workload and makes changes to task organization if needed." } },
  { id: "CULT_WLB_E_04", dimensionCode: "wlb_dobrostan", itemType: "employer", text: { pl: "Organizacja monitoruje skutki krótkoterminowych działań pod kątem ich wpływu na stabilność zespołu lub procesów.", en: "The organization monitors the effects of short-term actions in terms of their impact on team or process stability." } },
];

export const getQuestionsByDimension = (dimensionCode: string, itemType: 'candidate' | 'employer'): CultureQuestion[] => {
  const questions = itemType === 'candidate' ? candidateCultureQuestions : employerCultureQuestions;
  return questions.filter(q => q.dimensionCode === dimensionCode);
};

export const getLocalizedCultureDimensions = (lang: string) => {
  return lang === 'en' ? cultureDimensions.en : cultureDimensions.pl;
};

export const getLocalizedCultureQuestions = (lang: string) => {
  return candidateCultureQuestions.map(q => ({
    ...q,
    text: lang === 'en' ? q.text.en : q.text.pl
  }));
};

export const getLocalizedEmployerCultureQuestions = (lang: string) => {
  return employerCultureQuestions.map(q => ({
    ...q,
    text: lang === 'en' ? q.text.en : q.text.pl
  }));
};
