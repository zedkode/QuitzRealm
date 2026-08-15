import {
  BootstrapLeafCategory,
  BOOTSTRAP_QUESTION_TARGET,
  buildBootstrapQuestionPlan,
  questionBucketKey,
} from "./bootstrap-question-plan";

function categories(count: number): BootstrapLeafCategory[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `category-${String(index).padStart(2, "0")}`,
    name: `Categoria ${index}`,
    parentName: "Rădăcină",
  }));
}

describe("buildBootstrapQuestionPlan", () => {
  it("distribuie exact 5.000 de întrebări în 45 x 5 bucket-uri", () => {
    const plan = buildBootstrapQuestionPlan(categories(45), new Map());

    expect(plan.targetTotal).toBe(BOOTSTRAP_QUESTION_TARGET);
    expect(plan.categoryCount).toBe(45);
    expect(plan.bucketCount).toBe(225);
    expect(plan.buckets.reduce((sum, bucket) => sum + bucket.target, 0)).toBe(
      5_000,
    );
    expect(plan.buckets.filter((bucket) => bucket.target === 23)).toHaveLength(
      50,
    );
    expect(plan.buckets.filter((bucket) => bucket.target === 22)).toHaveLength(
      175,
    );
  });

  it("scade progresul existent fără să considere surplusul peste țintă", () => {
    const input = categories(2);
    const counts = new Map([
      [questionBucketKey(input[0].id, 1), 2],
      [questionBucketKey(input[0].id, 2), 99],
    ]);
    const plan = buildBootstrapQuestionPlan(input, counts, 12);

    expect(plan.existingTowardTarget).toBe(4);
    expect(plan.missingTotal).toBe(8);
    expect(plan.buckets[0]).toMatchObject({
      target: 2,
      existing: 2,
      missing: 0,
    });
    expect(plan.buckets[1]).toMatchObject({
      target: 2,
      existing: 99,
      missing: 0,
    });
  });

  it("respinge taxonomy goală și ținte invalide", () => {
    expect(() => buildBootstrapQuestionPlan([], new Map())).toThrow(
      "nu conține subcategorii",
    );
    expect(() =>
      buildBootstrapQuestionPlan(categories(1), new Map(), 0),
    ).toThrow("întreg pozitiv");
  });
});
