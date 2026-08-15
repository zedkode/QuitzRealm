import { canonicalText, jaccardSimilarity } from "./text-similarity";

describe("jaccardSimilarity", () => {
  it("normalizează diacriticele și punctuația", () => {
    expect(
      jaccardSimilarity(
        "Care este capitala României?",
        "Care este capitala Romaniei!",
      ),
    ).toBe(1);
  });

  it("separă întrebările care nu sunt variații triviale", () => {
    expect(
      jaccardSimilarity(
        "Care este capitala României?",
        "În ce an a început Primul Război Mondial?",
      ),
    ).toBeLessThan(0.85);
  });
});

describe("canonicalText", () => {
  it("produce aceeași formă pentru diferențe de diacritice și ordine", () => {
    expect(canonicalText("Marea Neagră")).toBe(canonicalText("neagra marea"));
  });
});
