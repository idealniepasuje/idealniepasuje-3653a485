import { describe, it, expect } from "vitest";
import {
  calculateMatch,
  calculateCompetenceMatch,
  calculateCultureMatch,
  calculateExtraMatch,
  dimensionMatchPercent,
  workModeCompatible,
  type CandidateData,
  type JobOfferData,
  type EmployerCultureData,
} from "@/lib/matching";

const candidate = (over: Partial<CandidateData> = {}): CandidateData => ({
  komunikacja_score: 3,
  myslenie_analityczne_score: 3,
  out_of_the_box_score: 3,
  determinacja_score: 3,
  adaptacja_score: 3,
  culture_relacja_wspolpraca: 3,
  culture_elastycznosc_innowacyjnosc: 3,
  culture_wyniki_cele: 3,
  culture_stabilnosc_struktura: 3,
  culture_autonomia_styl_pracy: 3,
  culture_wlb_dobrostan: 3,
  industry: "Marketing",
  experience: "4–6",
  position_level: "Specjalista",
  work_mode: "onsite",
  city: "Warszawa",
  ...over,
});

const offer = (over: Partial<JobOfferData> = {}): JobOfferData => ({
  req_komunikacja: 3,
  req_myslenie_analityczne: 3,
  req_out_of_the_box: 3,
  req_determinacja: 3,
  req_adaptacja: 3,
  industry: "Marketing",
  required_experience: "4–6",
  position_level: "Specjalista",
  accepted_industries: [],
  no_experience_required: false,
  work_mode: "onsite",
  city: "Warszawa",
  ...over,
});

const culture = (over: Partial<EmployerCultureData> = {}): EmployerCultureData => ({
  culture_completed: true,
  culture_relacja_wspolpraca: 3,
  culture_elastycznosc_innowacyjnosc: 3,
  culture_wyniki_cele: 3,
  culture_stabilnosc_struktura: 3,
  culture_autonomia_styl_pracy: 3,
  culture_wlb_dobrostan: 3,
  ...over,
});

describe("skala różnicy", () => {
  it("mapuje różnicę 0-4 na 100/75/50/25/0", () => {
    expect(dimensionMatchPercent(3, 3)).toBe(100);
    expect(dimensionMatchPercent(4, 3)).toBe(75);
    expect(dimensionMatchPercent(5, 3)).toBe(50);
    expect(dimensionMatchPercent(1, 5)).toBe(0);
  });
});

describe("kompetencje", () => {
  it("100% gdy kandydat trafia w oczekiwany poziom", () => {
    const r = calculateCompetenceMatch(candidate(), offer());
    expect(r.percent).toBe(100);
  });

  it("nie premiuje przekroczenia oczekiwań", () => {
    const higher = calculateCompetenceMatch(candidate({ komunikacja_score: 5 }), offer());
    const lower = calculateCompetenceMatch(candidate({ komunikacja_score: 1 }), offer());
    expect(higher.details[0].matchPercent).toBe(50);
    expect(lower.details[0].matchPercent).toBe(50);
    expect(higher.percent).toBe(lower.percent);
  });

  it("kompetencje niższe od oczekiwanych obniżają wynik", () => {
    const r = calculateCompetenceMatch(candidate({ determinacja_score: 2 }), offer());
    expect(r.percent).toBeLessThan(100);
  });

  it("pomija brakujące dane zamiast podstawiać 3", () => {
    const r = calculateCompetenceMatch(
      candidate({ komunikacja_score: null }),
      offer({ req_myslenie_analityczne: null }),
    );
    expect(r.details).toHaveLength(3);
  });
});

describe("dane dodatkowe", () => {
  it("zgodna branża = TAK", () => {
    const r = calculateExtraMatch(candidate(), offer());
    expect(r.details.find((d) => d.key === "industry")!.matched).toBe(true);
  });

  it("niezgodna branża = NIE, otwartość na zmianę nie daje punktów", () => {
    const r = calculateExtraMatch(candidate({ industry: "Prawo" }), offer());
    const industry = r.details.filter((d) => d.key === "industry");
    expect(industry).toHaveLength(1);
    expect(industry[0].matched).toBe(false);
    expect(r.details.some((d) => d.field === "Elastyczność branżowa")).toBe(false);
  });

  it("branża dodatkowa akceptowana przez pracodawcę = TAK", () => {
    const r = calculateExtraMatch(
      candidate({ industry: "Prawo" }),
      offer({ accepted_industries: ["Prawo"] }),
    );
    expect(r.details.find((d) => d.key === "industry")!.matched).toBe(true);
  });

  it("doświadczenie poniżej wymaganego = NIE", () => {
    const r = calculateExtraMatch(candidate({ experience: "0–2" }), offer({ required_experience: "4–6" }));
    expect(r.details.find((d) => d.key === "experience")!.matched).toBe(false);
  });

  it("brak wymaganego doświadczenia = zawsze TAK", () => {
    const r = calculateExtraMatch(
      candidate({ experience: null }),
      offer({ no_experience_required: true }),
    );
    expect(r.details.find((d) => d.key === "experience")!.matched).toBe(true);
  });

  it("poziom stanowiska równy lub wyższy = TAK", () => {
    const eq = calculateExtraMatch(candidate(), offer());
    const higher = calculateExtraMatch(candidate({ position_level: "Ekspert" }), offer());
    const lower = calculateExtraMatch(candidate({ position_level: "Asystent" }), offer());
    expect(eq.details.find((d) => d.key === "position_level")!.matched).toBe(true);
    expect(higher.details.find((d) => d.key === "position_level")!.matched).toBe(true);
    expect(lower.details.find((d) => d.key === "position_level")!.matched).toBe(false);
  });

  it("hierarchia: bez dodatkowych branż branża ma najwyższą wagę", () => {
    const r = calculateExtraMatch(candidate(), offer());
    const industry = r.details.find((d) => d.key === "industry")!;
    const experience = r.details.find((d) => d.key === "experience")!;
    expect(industry.weight).toBeGreaterThan(experience.weight);
  });

  it("hierarchia: z dodatkowymi branżami doświadczenie ma najwyższą wagę", () => {
    const r = calculateExtraMatch(candidate(), offer({ accepted_industries: ["Prawo"] }));
    const industry = r.details.find((d) => d.key === "industry")!;
    const experience = r.details.find((d) => d.key === "experience")!;
    expect(experience.weight).toBeGreaterThan(industry.weight);
  });
});

describe("tryb pracy", () => {
  it("kandydat zdalny nie pasuje do oferty stacjonarnej", () => {
    expect(workModeCompatible("remote", "onsite")).toBe(false);
    const r = calculateExtraMatch(candidate({ work_mode: "remote" }), offer({ work_mode: "onsite" }));
    expect(r.details.find((d) => d.key === "work_mode")!.matched).toBe(false);
  });

  it("zgodne tryby pracy", () => {
    expect(workModeCompatible("remote", "remote")).toBe(true);
    expect(workModeCompatible("onsite", "hybrid")).toBe(true);
    expect(workModeCompatible("hybrid", "onsite")).toBe(false);
  });
});

describe("lokalizacja", () => {
  it("ignorowana dla ofert w pełni zdalnych", () => {
    const r = calculateExtraMatch(
      candidate({ work_mode: "remote", city: "Kraków" }),
      offer({ work_mode: "remote", city: "Warszawa" }),
    );
    expect(r.details.some((d) => d.key === "city")).toBe(false);
  });

  it("uwzględniana dla ofert stacjonarnych", () => {
    const r = calculateExtraMatch(candidate({ city: "Kraków" }), offer());
    expect(r.details.find((d) => d.key === "city")!.matched).toBe(false);
  });
});

describe("kultura", () => {
  it("liczona gdy pracodawca ukończył test", () => {
    const r = calculateCultureMatch(candidate(), culture());
    expect(r.percent).toBe(100);
  });

  it("pominięta i wagi przeliczone gdy brak testu kultury", () => {
    const r = calculateMatch(candidate(), offer(), culture({ culture_completed: false }));
    expect(r.culturePercent).toBe(0);
    expect(r.cultureDetails).toHaveLength(0);
    expect(r.appliedWeights.culture).toBe(0);
    expect(r.appliedWeights.competence + r.appliedWeights.extra).toBeCloseTo(1);
  });
});

describe("wynik końcowy", () => {
  it("idealne dopasowanie = 100%", () => {
    const r = calculateMatch(candidate(), offer(), culture());
    expect(r.overallPercent).toBe(100);
  });

  it("łączy sekcje zgodnie z wagami 50/35/15", () => {
    const r = calculateMatch(
      candidate({ komunikacja_score: 5, industry: "Prawo" }),
      offer(),
      culture({ culture_wlb_dobrostan: 5 }),
    );
    const expected =
      0.5 * r.competencePercent + 0.35 * r.culturePercent + 0.15 * r.extraPercent;
    expect(r.overallPercent).toBe(Math.round(expected));
    expect(r.overallPercent).toBeLessThan(100);
  });

  it("generuje mocne strony i ryzyka", () => {
    const r = calculateMatch(candidate({ komunikacja_score: 1 }), offer({ industry: "Prawo" }), culture());
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.risks.some((x) => x.includes("Branża"))).toBe(true);
  });
});

describe("kwalifikowalność oferty (brak wymagań kompetencyjnych)", () => {
  it("odrzuca ofertę bez kompletu kompetencji i podaje brakujące", async () => {
    const { checkOfferEligibility, isOfferEligibleForMatching } = await import("@/lib/matching");
    const incomplete = offer({ req_komunikacja: null as any, req_adaptacja: null as any });
    const res = checkOfferEligibility(incomplete);
    expect(res.eligible).toBe(false);
    expect(res.missingCompetencies).toContain("Komunikacja");
    expect(res.missingCompetencies).toContain("Adaptacja do zmian");
    expect(res.reason).toBeTruthy();
    expect(isOfferEligibleForMatching(incomplete)).toBe(false);
  });

  it("akceptuje ofertę z kompletem 5 kompetencji", async () => {
    const { checkOfferEligibility } = await import("@/lib/matching");
    expect(checkOfferEligibility(offer()).eligible).toBe(true);
  });
});

describe("trzeci stan: brak danych kandydata", () => {
  it("pomija kryterium bez danych i przelicza wagi pozostałych", () => {
    const res = calculateExtraMatch(
      candidate({ industry: null as any, position_level: null as any }),
      offer(),
    );
    const industry = res.details.find((d) => d.key === "industry");
    expect(industry?.status).toBe("no_data");
    expect(industry?.weight).toBe(0);
    const active = res.details.filter((d) => d.status !== "no_data");
    expect(active.every((d) => d.weight > 0)).toBe(true);
    // sekcja liczona wyłącznie z kryteriów posiadających dane
    expect(res.percent).not.toBeNull();
  });

  it("brak danych nie obniża wyniku sekcji", () => {
    const full = calculateExtraMatch(candidate(), offer());
    const partial = calculateExtraMatch(candidate({ industry: null as any }), offer());
    expect(partial.percent).toBeGreaterThanOrEqual(full.percent);
  });
});

describe("minimalne pokrycie danych w sekcji dodatkowej", () => {
  const bare = (over: Partial<CandidateData> = {}): CandidateData =>
    candidate({ industry: null, experience: null, position_level: null, work_mode: null, city: null, ...over });

  it("1 dostępne kryterium (zgodne) → percent = null, nie 100%", () => {
    const r = calculateExtraMatch(bare({ work_mode: "onsite" }), offer());
    expect(r.availableCriteria).toBe(1);
    expect(r.totalCriteria).toBe(5);
    expect(r.coveragePercent).toBe(20);
    expect(r.status).toBe("insufficient_data");
    expect(r.percent).toBeNull();
  });

  it("2 dostępne kryteria → percent = null", () => {
    const r = calculateExtraMatch(bare({ work_mode: "onsite", city: "Warszawa" }), offer());
    expect(r.availableCriteria).toBe(2);
    expect(r.coveragePercent).toBe(40);
    expect(r.status).toBe("insufficient_data");
    expect(r.percent).toBeNull();
  });

  it("3 dostępne kryteria → sekcja liczona", () => {
    const r = calculateExtraMatch(
      bare({ industry: "Marketing", work_mode: "onsite", city: "Warszawa" }),
      offer(),
    );
    expect(r.availableCriteria).toBe(3);
    expect(r.status).toBe("ok");
    expect(r.percent).toBe(100);
  });

  it("5 dostępnych kryteriów → sekcja liczona normalnie", () => {
    const r = calculateExtraMatch(candidate(), offer());
    expect(r.availableCriteria).toBe(5);
    expect(r.coveragePercent).toBe(100);
    expect(r.status).toBe("ok");
    expect(r.percent).toBe(100);
  });

  it("brak danych nie obniża wyniku (przy zachowanym pokryciu)", () => {
    const full = calculateExtraMatch(candidate(), offer());
    const partial = calculateExtraMatch(candidate({ city: null }), offer());
    expect(partial.percent!).toBeGreaterThanOrEqual(full.percent!);
  });

  it("kandydat z pustym profilem nie jest zawyżany w wyniku końcowym", () => {
    const empty = calculateMatch(bare({ work_mode: "onsite" }), offer(), culture());
    const complete = calculateMatch(candidate(), offer(), culture());
    expect(empty.extraStatus).toBe("insufficient_data");
    expect(empty.appliedWeights.extra).toBe(0);
    expect(complete.overallPercent).toBeGreaterThanOrEqual(empty.overallPercent);
  });
});
