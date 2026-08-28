import { describe, it, expect, vi } from "vitest";

// Mock heroes
vi.mock("@/constants/heroes", () => ({
  HEROES: [
    { id: "hero-1", name: "Nova" },
    { id: "hero-2", name: "Coral" },
    { id: "hero-3", name: "Orion" },
    { id: "hero-4", name: "Luna" },
    { id: "hero-5", name: "Nimbus" },
    { id: "hero-6", name: "Bloom" },
    { id: "hero-7", name: "Whistle" },
    { id: "hero-8", name: "Shade" },
  ],
}));

import { evaluateBadges, getBadgeProgress, BadgeState } from "./badges";
import type { CachedStory } from "@/constants/types";

const PROFILE_ID = "profile-1";

function makeStory(overrides: Partial<CachedStory> = {}): CachedStory {
  return {
    id: "s-" + Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    story: {
      title: "Test Story",
      parts: [{ text: "Once upon a time...", partIndex: 0 }],
      vocabWord: { word: "brave", definition: "having courage" },
      joke: "haha",
      lesson: "be nice",
      tomorrowHook: "hook",
      rewardBadge: { emoji: "⭐", title: "Reward", description: "Nice" },
    },
    heroId: "hero-1",
    mode: "classic",
    voice: "moonbeam",
    speed: "medium",
    profileId: PROFILE_ID,
    ...overrides,
  };
}

describe("evaluateBadges & getBadgeProgress", () => {
  it("first-adventure triggers positive and negative correctly", () => {
    const emptyState: BadgeState = {
      profileId: PROFILE_ID,
      stories: [],
      currentStreak: 0,
      longestStreak: 0,
    };
    
    // Negative case
    let progress = getBadgeProgress("first-adventure", emptyState);
    expect(progress).toEqual({ current: 0, target: 1 });
    let earned = evaluateBadges(emptyState);
    expect(earned.find(b => b.id === "first-adventure")).toBeUndefined();

    // Positive case
    const oneStoryState: BadgeState = {
      ...emptyState,
      stories: [makeStory()],
    };
    progress = getBadgeProgress("first-adventure", oneStoryState);
    expect(progress).toEqual({ current: 1, target: 1 });
    earned = evaluateBadges(oneStoryState);
    expect(earned.find(b => b.id === "first-adventure")).toBeDefined();
  });

  it("night-owl triggers correctly", () => {
    // Current hour positive case
    const stateCurrentHour: BadgeState = {
      profileId: PROFILE_ID,
      stories: [],
      currentStreak: 0,
      longestStreak: 0,
      currentStoryHour: 21,
    };
    expect(getBadgeProgress("night-owl", stateCurrentHour)).toEqual({ current: 1, target: 1 });
    expect(evaluateBadges(stateCurrentHour).some(b => b.id === "night-owl")).toBe(true);

    // Negative case (both empty and day hour)
    const stateDayHour: BadgeState = {
      profileId: PROFILE_ID,
      stories: [],
      currentStreak: 0,
      longestStreak: 0,
      currentStoryHour: 14,
    };
    expect(getBadgeProgress("night-owl", stateDayHour)).toEqual({ current: 0, target: 1 });
    expect(evaluateBadges(stateDayHour).some(b => b.id === "night-owl")).toBe(false);

    // Story timestamp positive case
    const stateStoryTimestamp: BadgeState = {
      profileId: PROFILE_ID,
      stories: [
        makeStory({
          timestamp: new Date(2025, 0, 1, 22, 0, 0).getTime(), // 10 PM
        })
      ],
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("night-owl", stateStoryTimestamp)).toEqual({ current: 1, target: 1 });
    expect(evaluateBadges(stateStoryTimestamp).some(b => b.id === "night-owl")).toBe(true);
  });

  it("early-bird triggers correctly", () => {
    // Current hour positive case (5 AM - 10 AM)
    const stateMorning: BadgeState = {
      profileId: PROFILE_ID,
      stories: [],
      currentStreak: 0,
      longestStreak: 0,
      currentStoryHour: 7,
    };
    expect(getBadgeProgress("early-bird", stateMorning)).toEqual({ current: 1, target: 1 });
    expect(evaluateBadges(stateMorning).some(b => b.id === "early-bird")).toBe(true);

    // Negative case
    const stateNight: BadgeState = {
      profileId: PROFILE_ID,
      stories: [],
      currentStreak: 0,
      longestStreak: 0,
      currentStoryHour: 22,
    };
    expect(getBadgeProgress("early-bird", stateNight)).toEqual({ current: 0, target: 1 });
    expect(evaluateBadges(stateNight).some(b => b.id === "early-bird")).toBe(false);

    // Story timestamp positive case
    const stateStoryTimestamp: BadgeState = {
      profileId: PROFILE_ID,
      stories: [
        makeStory({
          timestamp: new Date(2025, 0, 1, 6, 30, 0).getTime(), // 6:30 AM
        })
      ],
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("early-bird", stateStoryTimestamp)).toEqual({ current: 1, target: 1 });
    expect(evaluateBadges(stateStoryTimestamp).some(b => b.id === "early-bird")).toBe(true);
  });

  it("all-heroes handles custom heroes correctly", () => {
    // Positive case: 8 stock heroes used, no custom heroes
    const stories8Stock = Array.from({ length: 8 }, (_, i) =>
      makeStory({ heroId: `hero-${i + 1}` })
    );
    const state8Stock: BadgeState = {
      profileId: PROFILE_ID,
      stories: stories8Stock,
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("all-heroes", state8Stock)).toEqual({ current: 8, target: 8 });
    expect(evaluateBadges(state8Stock).some(b => b.id === "all-heroes")).toBe(true);

    // Negative case: only 7 stock heroes used
    const stories7Stock = Array.from({ length: 7 }, (_, i) =>
      makeStory({ heroId: `hero-${i + 1}` })
    );
    const state7Stock: BadgeState = {
      profileId: PROFILE_ID,
      stories: stories7Stock,
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("all-heroes", state7Stock)).toEqual({ current: 7, target: 8 });
    // Positive case with custom hero: 8 stock heroes used AND 1 custom hero used
    const customHeroIds = ["custom-1"];
    const storiesWithCustom = [
      ...stories8Stock,
      makeStory({ heroId: "custom-1" }),
    ];
    const stateWithCustom: BadgeState = {
      profileId: PROFILE_ID,
      stories: storiesWithCustom,
      currentStreak: 0,
      longestStreak: 0,
      customHeroIds,
    };
    expect(getBadgeProgress("all-heroes", stateWithCustom)).toEqual({ current: 8, target: 8 });
    expect(evaluateBadges(stateWithCustom).some(b => b.id === "all-heroes")).toBe(true);

    // With 7 stock heroes and 1 custom hero, we have 8 unique heroes total
    const stories7Stock1Custom = [
      ...stories7Stock,
      makeStory({ heroId: "custom-1" }),
    ];
    const state7Stock1Custom: BadgeState = {
      profileId: PROFILE_ID,
      stories: stories7Stock1Custom,
      currentStreak: 0,
      longestStreak: 0,
      customHeroIds,
    };
    expect(getBadgeProgress("all-heroes", state7Stock1Custom)).toEqual({ current: 8, target: 8 });
    expect(evaluateBadges(state7Stock1Custom).some(b => b.id === "all-heroes")).toBe(true);

    // Negative case: 7 stock heroes, no custom hero used = 7 unique heroes total
    const state7Stock0Custom: BadgeState = {
      profileId: PROFILE_ID,
      stories: stories7Stock,
      currentStreak: 0,
      longestStreak: 0,
      customHeroIds,
    };
    expect(getBadgeProgress("all-heroes", state7Stock0Custom)).toEqual({ current: 7, target: 8 });
    expect(evaluateBadges(state7Stock0Custom).some(b => b.id === "all-heroes")).toBe(false);
  });

  it("mad-libs-master, dream-weaver, and classic-champion trigger correctly", () => {
    // 3 madlibs
    const storiesML = Array.from({ length: 3 }, () => makeStory({ mode: "madlibs" }));
    const stateML: BadgeState = {
      profileId: PROFILE_ID,
      stories: storiesML,
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("mad-libs-master", stateML)).toEqual({ current: 3, target: 3 });
    expect(evaluateBadges(stateML).some(b => b.id === "mad-libs-master")).toBe(true);

    // 2 sleep (under target)
    const storiesSleep = Array.from({ length: 2 }, () => makeStory({ mode: "sleep" }));
    const stateSleep: BadgeState = {
      profileId: PROFILE_ID,
      stories: storiesSleep,
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("dream-weaver", stateSleep)).toEqual({ current: 2, target: 3 });
    expect(evaluateBadges(stateSleep).some(b => b.id === "dream-weaver")).toBe(false);

    // 5 classic
    const storiesClassic = Array.from({ length: 5 }, () => makeStory({ mode: "classic" }));
    const stateClassic: BadgeState = {
      profileId: PROFILE_ID,
      stories: storiesClassic,
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("classic-champion", stateClassic)).toEqual({ current: 5, target: 5 });
    expect(evaluateBadges(stateClassic).some(b => b.id === "classic-champion")).toBe(true);
  });

  it("story-streak-3 and story-streak-7 trigger correctly", () => {
    const stateStreak: BadgeState = {
      profileId: PROFILE_ID,
      stories: [],
      currentStreak: 5,
      longestStreak: 5,
    };

    expect(getBadgeProgress("story-streak-3", stateStreak)).toEqual({ current: 3, target: 3 });
    expect(getBadgeProgress("story-streak-7", stateStreak)).toEqual({ current: 5, target: 7 });

    const earned = evaluateBadges(stateStreak);
    expect(earned.some(b => b.id === "story-streak-3")).toBe(true);
    expect(earned.some(b => b.id === "story-streak-7")).toBe(false);
  });

  it("bookworm and legend trigger correctly", () => {
    const stories15 = Array.from({ length: 15 }, () => makeStory());
    const state15: BadgeState = {
      profileId: PROFILE_ID,
      stories: stories15,
      currentStreak: 0,
      longestStreak: 0,
    };

    expect(getBadgeProgress("bookworm", state15)).toEqual({ current: 10, target: 10 });
    expect(getBadgeProgress("legend", state15)).toEqual({ current: 15, target: 25 });

    const earned = evaluateBadges(state15);
    expect(earned.some(b => b.id === "bookworm")).toBe(true);
    expect(earned.some(b => b.id === "legend")).toBe(false);
  });

  it("vocabulary-star only counts unique vocab words", () => {
    // 5 unique words
    const uniqueStories = ["brave", "curious", "kind", "smart", "helpful"].map(word =>
      makeStory({
        story: {
          title: "T",
          parts: [],
          vocabWord: { word, definition: "def" },
          joke: "",
          lesson: "",
          tomorrowHook: "",
          rewardBadge: { emoji: "", title: "", description: "" },
        }
      })
    );
    const stateUnique: BadgeState = {
      profileId: PROFILE_ID,
      stories: uniqueStories,
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("vocabulary-star", stateUnique)).toEqual({ current: 5, target: 5 });
    expect(evaluateBadges(stateUnique).some(b => b.id === "vocabulary-star")).toBe(true);

    // 5 stories but only 2 unique words (duplicate regression)
    const dupStories = ["brave", "brave", "kind", "kind", "kind"].map(word =>
      makeStory({
        story: {
          title: "T",
          parts: [],
          vocabWord: { word, definition: "def" },
          joke: "",
          lesson: "",
          tomorrowHook: "",
          rewardBadge: { emoji: "", title: "", description: "" },
        }
      })
    );
    const stateDup: BadgeState = {
      profileId: PROFILE_ID,
      stories: dupStories,
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("vocabulary-star", stateDup)).toEqual({ current: 2, target: 5 });
    expect(evaluateBadges(stateDup).some(b => b.id === "vocabulary-star")).toBe(false);
  });

  it("getBadgeProgress returns correct ratios at 0%, 50%, 100%", () => {
    const emptyState: BadgeState = {
      profileId: PROFILE_ID,
      stories: [],
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("mad-libs-master", emptyState)).toEqual({ current: 0, target: 3 });

    const stateHalf: BadgeState = {
      profileId: PROFILE_ID,
      stories: Array.from({ length: 5 }, () => makeStory()),
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("bookworm", stateHalf)).toEqual({ current: 5, target: 10 });

    const stateFull: BadgeState = {
      profileId: PROFILE_ID,
      stories: Array.from({ length: 10 }, () => makeStory()),
      currentStreak: 0,
      longestStreak: 0,
    };
    expect(getBadgeProgress("bookworm", stateFull)).toEqual({ current: 10, target: 10 });
  });
});
