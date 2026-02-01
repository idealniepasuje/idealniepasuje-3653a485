// Dodatkowe pytania - z arkuszy candidate_dodatkowe i employer_dodatkowe

export const industries = [
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
];

export const experienceLevels = [
  "0–2",
  "2–4",
  "4–6",
  "6–8",
  "8–10",
  "ponad 10",
];

export const positionLevels = [
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
];

export const industryChangeOptions = [
  "Tak",
  "Nie",
  "Jestem otwarty/a",
];

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

export const competencyLabels: Record<string, string> = {
  komunikacja: "Komunikacja (pisemna i ustna)",
  myslenie_analityczne: "Myślenie analityczne",
  out_of_the_box: "Out of the box (kreatywność)",
  determinacja: "Determinacja i motywacja",
  adaptacja: "Umiejętność adaptacji do zmian",
};

export const importanceScale = [
  { value: 1, label: "Nieistotna" },
  { value: 2, label: "Rzadko potrzebna" },
  { value: 3, label: "Umiarkowanie potrzebna" },
  { value: 4, label: "Bardzo potrzebna" },
  { value: 5, label: "Kluczowa" },
];

export const agreementScale = [
  { value: 1, label: "Zupełnie się nie zgadzam" },
  { value: 2, label: "Nie zgadzam się" },
  { value: 3, label: "Ani się zgadzam, ani nie zgadzam" },
  { value: 4, label: "Zgadzam się" },
  { value: 5, label: "Całkowicie się zgadzam" },
];
