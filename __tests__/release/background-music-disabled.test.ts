import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("background music release containment", () => {
  it("keeps the client hook network-free and timer-free", () => {
    const hook = read("lib/useBackgroundMusic.ts");

    expect(hook).not.toContain("expo-av");
    expect(hook).not.toContain("getApiUrl");
    expect(hook).not.toContain("/api/music/");
    expect(hook).not.toContain("setTimeout");
    expect(hook).toContain("musicPlaying: false");
  });

  it("keeps the story music control hidden", () => {
    const controls = read("components/StoryPlayerControls.tsx");

    expect(controls).toContain("const BACKGROUND_MUSIC_ENABLED = false");
    expect(controls).toContain("BACKGROUND_MUSIC_ENABLED &&");
  });

  it("keeps server routes independent of absent source audio", () => {
    const routes = read("server/routes/music.ts");

    expect(routes).not.toContain('from "../suno"');
    expect(routes).not.toContain("sendFile");
    expect(routes).toContain("trackCount: 0");
    expect(routes).toContain("enabled: false");
  });
});
