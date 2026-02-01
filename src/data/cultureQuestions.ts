// Pytania o kulturę pracy - z arkusza candidate_kultura i employer_kultura

export interface CultureQuestion {
  id: string;
  dimensionCode: string;
  itemType: 'candidate' | 'employer';
  text: string;
}

export const cultureDimensions = {
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
};

export const candidateCultureQuestions: CultureQuestion[] = [
  // Relacja i współpraca
  { id: "CULT_RW_C_01", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: "Ważna jest dla mnie przyjazna i wspierająca atmosfera." },
  { id: "CULT_RW_C_02", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: "Dobre relacje między osobami w zespole są istotne." },
  { id: "CULT_RW_C_03", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: "Współpraca i wzajemna pomoc są priorytetem." },
  { id: "CULT_RW_C_04", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: "Zaufanie i otwartość przełożonych są istotne w miejscu pracy." },
  { id: "CULT_RW_C_05", dimensionCode: "relacja_wspolpraca", itemType: "candidate", text: "Praca zespołowa i wspólne cele liczą się dla mnie bardziej niż indywidualna rywalizacja." },
  
  // Elastyczność i innowacyjność
  { id: "CULT_EI_C_01", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: "Lubię środowisko, w którym zmiany i usprawnienia są naturalną częścią codziennej pracy." },
  { id: "CULT_EI_C_02", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: "Możliwość testowania nowych pomysłów jest ważna." },
  { id: "CULT_EI_C_03", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: "Lubię testować nowe metody i szukać nieszablonowych rozwiązań, zamiast trzymać się utartych schematów." },
  { id: "CULT_EI_C_04", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: "Zmiany i eksperymenty są naturalną częścią miejsca pracy." },
  { id: "CULT_EI_C_05", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "candidate", text: "Kreatywność i nieszablonowe rozwiązania są doceniane przez organizację." },
  
  // Wyniki i cele
  { id: "CULT_WC_C_01", dimensionCode: "wyniki_cele", itemType: "candidate", text: "Ważne są jasno określone cele i mierzalne wyniki pracy." },
  { id: "CULT_WC_C_02", dimensionCode: "wyniki_cele", itemType: "candidate", text: "Wysokie wymagania i ambitne zadania motywują do dalszej pracy." },
  { id: "CULT_WC_C_03", dimensionCode: "wyniki_cele", itemType: "candidate", text: "Zdrowa rywalizacja w zespole jest pozytywnym aspektem." },
  { id: "CULT_WC_C_04", dimensionCode: "wyniki_cele", itemType: "candidate", text: "Sukces organizacji ocenia się przede wszystkim przez efekty jej pracowników." },
  { id: "CULT_WC_C_05", dimensionCode: "wyniki_cele", itemType: "candidate", text: "Jasne standardy i kryteria oceny pracy są bardzo istotne." },
  { id: "CULT_WC_C_06", dimensionCode: "wyniki_cele", itemType: "candidate", text: "Wewnętrzna konkurencja między pracownikami motywuje mnie do lepszych wyników." },
  
  // Stabilność i struktura
  { id: "CULT_SS_C_01", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: "Środowisko pracy powinno być przewidywalne i stabilne." },
  { id: "CULT_SS_C_02", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: "Jasny podział ról i odpowiedzialności ułatwia działanie i prawidłowe wykonywanie przydzielonych zadań." },
  { id: "CULT_SS_C_03", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: "Procedury i standardy w organizacji zapewniają poczucie bezpieczeństwa." },
  { id: "CULT_SS_C_04", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: "Hierarchia i formalna struktura są istotne." },
  { id: "CULT_SS_C_05", dimensionCode: "stabilnosc_struktura", itemType: "candidate", text: "W pracy ważne są zasady i procedury, które należy respektować." },
  
  // Autonomia i styl pracy
  { id: "CULT_AS_C_01", dimensionCode: "autonomia_styl_pracy", itemType: "candidate", text: "Ważna jest możliwość samodzielnego podejmowania decyzji." },
  { id: "CULT_AS_C_02", dimensionCode: "autonomia_styl_pracy", itemType: "candidate", text: "Elastyczna organizacja pracy zwiększa efektywność." },
  { id: "CULT_AS_C_03", dimensionCode: "autonomia_styl_pracy", itemType: "candidate", text: "Odpowiedzialność za własne działania jest motywująca." },
  { id: "CULT_AS_C_04", dimensionCode: "autonomia_styl_pracy", itemType: "candidate", text: "Nie jest potrzebny stały nadzór, aby wykonywać obowiązki dobrze." },
  
  // Work-life balance
  { id: "CULT_WLB_C_01", dimensionCode: "wlb_dobrostan", itemType: "candidate", text: "Równowaga między pracą a życiem prywatnym jest istotna." },
  { id: "CULT_WLB_C_02", dimensionCode: "wlb_dobrostan", itemType: "candidate", text: "Nadgodziny nie powinny być standardem w miejscu pracy." },
  { id: "CULT_WLB_C_03", dimensionCode: "wlb_dobrostan", itemType: "candidate", text: "Ważne jest dla mnie, by pracodawca dbał o moje samopoczucie i chronił przed nadmiernym obciążeniem." },
  { id: "CULT_WLB_C_04", dimensionCode: "wlb_dobrostan", itemType: "candidate", text: "Długofalowa stabilność jest ważniejsza niż szybki sukces." },
];

export const employerCultureQuestions: CultureQuestion[] = [
  // Relacja i współpraca
  { id: "CULT_RW_E_01", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: "W codziennej pracy pracownicy zwracają się do siebie po pomoc, gdy mają trudność z realizacją zadań." },
  { id: "CULT_RW_E_02", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: "W zespołach częściej dominuje współpraca niż rywalizacja między pracownikami." },
  { id: "CULT_RW_E_03", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: "Trudności pojawiające się w zespołach są omawiane podczas spotkań lub rozmów w ciągu dnia lub na komunikatorach." },
  { id: "CULT_RW_E_04", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: "Przełożeni regularnie rozmawiają z pracownikami o trudnościach w pracy." },
  { id: "CULT_RW_E_05", dimensionCode: "relacja_wspolpraca", itemType: "employer", text: "W naszej firmie sukcesy zespołu są ważniejsze i wyżej premiowane niż osiągnięcia indywidualnych jednostek." },
  
  // Elastyczność i innowacyjność
  { id: "CULT_EI_E_01", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: "Zmiany i usprawnienia są u nas naturalną częścią codziennej pracy." },
  { id: "CULT_EI_E_02", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: "Zgłoszone propozycje przez pracowników są omawiane w zespole lub z przełożonym." },
  { id: "CULT_EI_E_03", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: "W naszej organizacji zachęcamy do eksperymentowania i ciągłego zmieniania sposobów pracy na nowocześniejsze." },
  { id: "CULT_EI_E_04", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: "W pracy pojawiają się działania o charakterze testowym lub pilotażowym." },
  { id: "CULT_EI_E_05", dimensionCode: "elastycznosc_innowacyjnosc", itemType: "employer", text: "Pracownicy mają wpływ na przebieg realizowanych procesów." },
  
  // Wyniki i cele
  { id: "CULT_WC_E_01", dimensionCode: "wyniki_cele", itemType: "employer", text: "Pracownicy otrzymują informacje dotyczące oczekiwanych rezultatów swojej pracy." },
  { id: "CULT_WC_E_02", dimensionCode: "wyniki_cele", itemType: "employer", text: "Cele i priorytety są komunikowane w trakcie realizacji zadań." },
  { id: "CULT_WC_E_03", dimensionCode: "wyniki_cele", itemType: "employer", text: "W naszej firmie zachęcamy pracowników do rywalizacji i porównywania swoich wyników." },
  { id: "CULT_WC_E_04", dimensionCode: "wyniki_cele", itemType: "employer", text: "Wyniki pracy są brane pod uwagę przy ocenie realizacji zadań." },
  { id: "CULT_WC_E_05", dimensionCode: "wyniki_cele", itemType: "employer", text: "Kryteria oceny pracy są komunikowane pracownikom." },
  { id: "CULT_WC_E_06", dimensionCode: "wyniki_cele", itemType: "employer", text: "W naszej organizacji stosujemy mechanizmy porównywania wyników i rankingowania pracowników." },
  
  // Stabilność i struktura
  { id: "CULT_SS_E_01", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: "Zakres obowiązków pracowników jest określony na początku współpracy lub projektu." },
  { id: "CULT_SS_E_02", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: "Odpowiedzialności decyzyjne są przypisane do konkretnych ról lub stanowisk." },
  { id: "CULT_SS_E_03", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: "W organizacji funkcjonują procedury lub standardy dotyczące sposobu pracy." },
  { id: "CULT_SS_E_04", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: "Decyzje organizacyjne są podejmowane na określonych poziomach struktury." },
  { id: "CULT_SS_E_05", dimensionCode: "stabilnosc_struktura", itemType: "employer", text: "Zasady obowiązujące w organizacji są komunikowane pracownikom." },
  
  // Autonomia i styl pracy
  { id: "CULT_AS_E_01", dimensionCode: "autonomia_styl_pracy", itemType: "employer", text: "Pracownicy samodzielnie podejmują decyzje dotyczące bieżących zadań." },
  { id: "CULT_AS_E_02", dimensionCode: "autonomia_styl_pracy", itemType: "employer", text: "Organizacja pracy (kolejność, tempo, sposób realizacji) jest ustalana przez pracownika lub zespół." },
  { id: "CULT_AS_E_03", dimensionCode: "autonomia_styl_pracy", itemType: "employer", text: "Skutki podjętych decyzji są omawiane z pracownikami." },
  { id: "CULT_AS_E_04", dimensionCode: "autonomia_styl_pracy", itemType: "employer", text: "Praca jest rozliczana na podstawie rezultatów lub wykonanych zadań." },
  
  // Work-life balance
  { id: "CULT_WLB_E_01", dimensionCode: "wlb_dobrostan", itemType: "employer", text: "Praca w nadgodzinach jest standardowym elementem funkcjonowania w naszej firmie." },
  { id: "CULT_WLB_E_02", dimensionCode: "wlb_dobrostan", itemType: "employer", text: "Obciążenie pracą jest omawiane w rozmowach z przełożonymi." },
  { id: "CULT_WLB_E_03", dimensionCode: "wlb_dobrostan", itemType: "employer", text: "W organizacji monitoruje się obciążenie pracą i w razie potrzeby wprowadza zmiany w organizacji zadań." },
  { id: "CULT_WLB_E_04", dimensionCode: "wlb_dobrostan", itemType: "employer", text: "Organizacja monitoruje skutki krótkoterminowych działań pod kątem ich wpływu na stabilność zespołu lub procesów." },
];

export const getQuestionsByDimension = (dimensionCode: string, itemType: 'candidate' | 'employer'): CultureQuestion[] => {
  const questions = itemType === 'candidate' ? candidateCultureQuestions : employerCultureQuestions;
  return questions.filter(q => q.dimensionCode === dimensionCode);
};
