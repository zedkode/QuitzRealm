import { describe, expect, it } from "vitest";

describe("QuizRealm API configuration", () => {
  it("responds to the configured health endpoint", async () => {
    const baseUrl = process.env.VITE_QUIZREALM_API_URL;
    expect(baseUrl, "VITE_QUIZREALM_API_URL must be configured").toBeTruthy();
    const base = baseUrl!.replace(/\/$/, "");
    const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
    expect(response.ok).toBe(true);
    const statsResponse = await fetch(`${base}/health/stats`, { signal: AbortSignal.timeout(5000) });
    expect(statsResponse.ok).toBe(true);
    const stats = await statsResponse.json() as Record<string, unknown>;
    expect(typeof stats.activePlayers).toBe("number");
    expect(typeof stats.matchesToday).toBe("number");
    expect(typeof stats.questionsMastered).toBe("number");
    expect(typeof stats.achievementsUnlocked).toBe("number");
  });
});
