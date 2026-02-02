// Dodatkowe pytania - z arkuszy candidate_dodatkowe i employer_dodatkowe

export const industries = {
  pl: [
    "Administracja biurowa",
    "Badania i rozwój",
    "Bankowość",
    "BHP / Ochrona środowiska",
    "Budownictwo",
    "Call Center",
    "Doradztwo / Konsulting",
    "Energetyka",
    "Edukacja / Szkolenia",
    "Finanse / Ekonomia",
    "Franczyza / Własny biznes",
    "Hotelarstwo / Gastronomia / Turystyka",
    "Human Resources / Zasoby ludzkie",
    "Internet / e-Commerce / Nowe media",
    "Inżynieria",
    "IT – Administracja",
    "IT – Rozwój oprogramowania",
    "Kontrola jakości",
    "Łańcuch dostaw",
    "Marketing",
    "Media / Sztuka / Rozrywka",
    "Nieruchomości",
    "Obsługa klienta",
    "Praca fizyczna",
    "Prawo",
    "Produkcja",
    "Public Relations",
    "Reklama / Grafika / Kreacja / Fotografia",
    "Sektor publiczny",
    "Sprzedaż",
    "Transport / Spedycja / Logistyka",
    "Ubezpieczenia",
    "Zakupy",
    "Zdrowie / Uroda / Rekreacja",
    "Inne",
  ],
  en: [
    "Office Administration",
    "Research & Development",
    "Banking",
    "Health & Safety / Environment",
    "Construction",
    "Call Center",
    "Consulting / Advisory",
    "Energy",
    "Education / Training",
    "Finance / Economics",
    "Franchise / Own Business",
    "Hospitality / Gastronomy / Tourism",
    "Human Resources",
    "Internet / e-Commerce / New Media",
    "Engineering",
    "IT – Administration",
    "IT – Software Development",
    "Quality Control",
    "Supply Chain",
    "Marketing",
    "Media / Art / Entertainment",
    "Real Estate",
    "Customer Service",
    "Physical Work",
    "Law",
    "Manufacturing",
    "Public Relations",
    "Advertising / Graphics / Creative / Photography",
    "Public Sector",
    "Sales",
    "Transport / Shipping / Logistics",
    "Insurance",
    "Procurement",
    "Health / Beauty / Recreation",
    "Other",
  ],
};

export const experienceLevels = [
  "0–2",
  "2–4",
  "4–6",
  "6–8",
  "8–10",
  "10+",
];

export const positionLevels = {
  pl: [
    "Praktykant lub stażysta",
    "Asystent",
    "Młodszy specjalista",
    "Specjalista",
    "Starszy specjalista",
    "Ekspert",
    "Kierownik lub koordynator",
    "Menadżer",
    "Dyrektor",
    "Prezes",
  ],
  en: [
    "Intern or Trainee",
    "Assistant",
    "Junior Specialist",
    "Specialist",
    "Senior Specialist",
    "Expert",
    "Team Leader or Coordinator",
    "Manager",
    "Director",
    "CEO / President",
  ],
};

export const industryChangeOptions = {
  pl: ["Tak", "Nie", "Jestem otwarty/a"],
  en: ["Yes", "No", "I'm open to it"],
};

export interface CandidateAdditionalData {
  industry: string;
  experience: string;
  positionLevel: string;
  wantsToChangeIndustry: string;
  workDescription?: string;
}

export interface EmployerAdditionalData {
  industry: string;
  requiredExperience: string;
  positionLevel: string;
  acceptedIndustries: string[];
  roleDescription: string;
  roleResponsibilities: string;
}

export interface EmployerCompetencyRequirements {
  komunikacja: number;
  myslenie_analityczne: number;
  out_of_the_box: number;
  determinacja: number;
  adaptacja: number;
}

export const competencyLabels = {
  pl: {
    komunikacja: "Komunikacja (pisemna i ustna)",
    myslenie_analityczne: "Myślenie analityczne",
    out_of_the_box: "Out of the box (kreatywność)",
    determinacja: "Determinacja i motywacja",
    adaptacja: "Umiejętność adaptacji do zmian",
  },
  en: {
    komunikacja: "Communication (written and verbal)",
    myslenie_analityczne: "Analytical Thinking",
    out_of_the_box: "Out of the box (creativity)",
    determinacja: "Determination and Motivation",
    adaptacja: "Adaptability to Change",
  },
};

export const importanceScale = {
  pl: [
    { value: 1, label: "Nieistotna" },
    { value: 2, label: "Rzadko potrzebna" },
    { value: 3, label: "Umiarkowanie potrzebna" },
    { value: 4, label: "Bardzo potrzebna" },
    { value: 5, label: "Kluczowa" },
  ],
  en: [
    { value: 1, label: "Not important" },
    { value: 2, label: "Rarely needed" },
    { value: 3, label: "Moderately needed" },
    { value: 4, label: "Very important" },
    { value: 5, label: "Critical" },
  ],
};

export const agreementScale = {
  pl: [
    { value: 1, label: "Zupełnie się nie zgadzam" },
    { value: 2, label: "Nie zgadzam się" },
    { value: 3, label: "Ani się zgadzam, ani nie zgadzam" },
    { value: 4, label: "Zgadzam się" },
    { value: 5, label: "Całkowicie się zgadzam" },
  ],
  en: [
    { value: 1, label: "Strongly disagree" },
    { value: 2, label: "Disagree" },
    { value: 3, label: "Neither agree nor disagree" },
    { value: 4, label: "Agree" },
    { value: 5, label: "Strongly agree" },
  ],
};

// Helper function to get localized data
export const getLocalizedData = <T>(data: { pl: T; en: T }, lang: string): T => {
  return lang === 'en' ? data.en : data.pl;
};
