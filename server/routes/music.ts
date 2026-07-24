import type { Express } from "express";
import { sanitizeString, VALID_MODES } from "../validation";

const MUSIC_DISABLED_RESPONSE = {
  enabled: false,
  error: "Background music is disabled for this release",
} as const;

function isValidMode(mode: string): boolean {
  return (VALID_MODES as readonly string[]).includes(mode);
}

export function registerMusicRoutes(app: Express): void {
  app.get("/api/music/:mode", (req, res) => {
    const mode = sanitizeString(req.params.mode, 20);
    if (!isValidMode(mode)) {
      return res.status(400).set("Cache-Control", "no-store").json({ error: "Invalid mode" });
    }

    return res
      .status(404)
      .set("Cache-Control", "no-store")
      .json(MUSIC_DISABLED_RESPONSE);
  });

  app.get("/api/music-info/:mode", (req, res) => {
    const mode = sanitizeString(req.params.mode, 20);
    if (!isValidMode(mode)) {
      return res.status(400).set("Cache-Control", "no-store").json({ error: "Invalid mode" });
    }

    return res
      .status(200)
      .set("Cache-Control", "no-store")
      .json({ enabled: false, trackCount: 0 });
  });
}
