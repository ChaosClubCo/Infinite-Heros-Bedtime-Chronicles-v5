import type { Express } from "express";
import { createVideoJob, getVideoJob, getVideoFilePath, isVideoAvailable } from "../video";
import { sanitizeString, VideoRequestSchema } from "../validation";
import { isFeatureEnabled } from "../feature-flags";
import { rateLimited, sendRouteError } from "./helpers";

export function registerVideoRoutes(app: Express): void {
  app.get("/api/video-available", (_req, res) => {
    if (!isFeatureEnabled('videoEnabled')) {
      return res.json({ available: false });
    }
    res.json({ available: isVideoAvailable() });
  });

  app.post("/api/generate-video", async (req, res, next) => {
    // The feature-flag 404 must precede the rate-limit check (original ordering).
    if (!isFeatureEnabled('videoEnabled')) {
      return res.status(404).json({ error: "Video generation is not available" });
    }
    return rateLimited()(req, res, next);
  }, async (req, res) => {
    const parsed = VideoRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const { sceneText, heroName, heroDescription } = parsed.data;

    try {
      const result = await createVideoJob(sceneText, heroName, heroDescription);
      if ("error" in result) {
        return res.status(503).json({ error: result.error });
      }

      res.json({ jobId: result.jobId });
    } catch (error: unknown) {
      sendRouteError(req, res, error, 'video generation failed', 'Failed to start video generation');
    }
  });

  app.get("/api/video-status/:id", (req, res) => {
    const jobId = sanitizeString(req.params.id, 32);
    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    const job = getVideoJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Video job not found" });
    }

    res.json({
      status: job.status,
      progress: job.progress,
      error: job.error,
      videoUrl: job.status === "completed" ? `/api/video/${jobId}` : undefined,
    });
  });

  app.get("/api/video/:id", (req, res) => {
    const jobId = req.params.id;
    if (!jobId || !/^[a-f0-9]+$/.test(jobId)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const filePath = getVideoFilePath(jobId);
    if (!filePath) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: "Failed to serve video" });
      }
    });
  });
}
