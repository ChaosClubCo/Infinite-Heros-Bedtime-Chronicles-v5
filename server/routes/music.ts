import type { Express } from "express";
import { getMusicFilePath, getMusicTrackCount } from "../suno";
import { sanitizeString, VALID_MODES } from "../validation";
import { logger } from "../logger";

export function registerMusicRoutes(app: Express): void {
  app.get("/api/music/:mode", (req, res) => {
    const mode = sanitizeString(req.params.mode, 20);
    if (!(VALID_MODES as readonly string[]).includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    // Parse optional track index from query param (for cycling through multiple tracks)
    const trackParam = req.query.track;
    const trackIndex = trackParam !== undefined ? parseInt(String(trackParam), 10) : undefined;
    const resolvedTrackIndex = trackIndex !== undefined && !isNaN(trackIndex) ? trackIndex : undefined;
    const filePath = getMusicFilePath(mode, resolvedTrackIndex);
    // Use a short cache so different sessions can receive different random tracks
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.sendFile(filePath, (err) => {
      if (err) {
        logger.error({ err }, 'music file error');
        if (!res.headersSent) {
          res.status(404).json({ error: "Music file not found" });
        }
      }
    });
  });

  app.get("/api/music-info/:mode", (req, res) => {
    const mode = sanitizeString(req.params.mode, 20);
    if (!(VALID_MODES as readonly string[]).includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    res.json({ trackCount: getMusicTrackCount(mode) });
  });
}
