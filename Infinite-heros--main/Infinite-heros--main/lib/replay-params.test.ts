import { describe, expect, it } from "vitest";
import { buildStoryReplayParams } from "./replay-params";
import type { CachedStory } from "@/constants/types";

function makeStory(overrides: Partial<CachedStory> = {}): CachedStory {
  return {
    id: "story-1",
    timestamp: 1,
    heroId: "nova",
    mode: "classic",
    voice: "aurora",
    speed: "fast",
    story: {
      title: "Test",
      parts: [{ text: "hello", partIndex: 0 }],
      vocabWord: { word: "brave", definition: "bold" },
      joke: "ha",
      lesson: "be kind",
      tomorrowHook: "next",
      rewardBadge: { emoji: "⭐", title: "Star", description: "Great" },
    },
    ...overrides,
  };
}

describe("buildStoryReplayParams", () => {
  it("uses persisted voice/speed from cached story", () => {
    const params = buildStoryReplayParams(makeStory({ voice: "captain", speed: "gentle" }));
    expect(params.voice).toBe("captain");
    expect(params.speed).toBe("gentle");
  });

  it("falls back to defaults when voice/speed are missing", () => {
    const params = buildStoryReplayParams(
      makeStory({
        voice: "" as string,
        speed: "" as string,
      }),
    );
    expect(params.voice).toBe("moonbeam");
    expect(params.speed).toBe("medium");
  });
});
