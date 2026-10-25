import { describe, expect, it } from "vitest";
import { parseReviewSummary } from "./useReviews";

describe("parseReviewSummary", () => {
  it("lit le résumé renvoyé par public_review_summary", () => {
    expect(
      parseReviewSummary({ count: 3, average: "4.3", distribution: { "5": 2, "4": 0, "3": 1, "2": 0, "1": 0 } }),
    ).toEqual({ count: 3, average: 4.3, distribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 } });
  });

  it("tolère une réponse vide", () => {
    expect(parseReviewSummary(null)).toEqual({ count: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  });
});
