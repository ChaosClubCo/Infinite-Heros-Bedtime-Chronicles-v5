import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { logger } from "./logger";

const VIDEO_CACHE_DIR = path.resolve("/tmp/video-cache");
if (!fs.existsSync(VIDEO_CACHE_DIR)) {
  fs.mkdirSync(VIDEO_CACHE_DIR, { recursive: true });
}

const VIDEO_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function cleanVideoCache() {
  try {
    const files = await fs.promises.readdir(VIDEO_CACHE_DIR);
    const now = Date.now();
    let removed = 0;
    for (const file of files) {
      const filePath = path.join(VIDEO_CACHE_DIR, file);
      const stat = await fs.promises.stat(filePath);
      if (now - stat.mtimeMs > VIDEO_CACHE_MAX_AGE_MS) {
        await fs.promises.unlink(filePath);
        removed++;
      }
    }
    if (removed > 0) {
      logger.info({ removed }, 'video cache cleanup completed');
    }
  } catch (err) {
    logger.error({ err }, 'video cache cleanup failed');
  }
}

setInterval(cleanVideoCache, 60 * 60 * 1000);
cleanVideoCache();

interface VideoJob {
  id: string;
  openaiVideoId: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  progress: number;
  videoPath?: string;
  error?: string;
  createdAt: number;
}

const VALID_VIDEO_STATUSES = new Set<string>(['queued', 'in_progress', 'completed', 'failed']);
function toVideoStatus(s: string | undefined | null): VideoJob['status'] {
  return (s && VALID_VIDEO_STATUSES.has(s)) ? (s as VideoJob['status']) : 'failed';
}

const activeJobs = new Map<string, VideoJob>();

const JOB_EXPIRY_MS = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of activeJobs) {
    if (now - job.createdAt > JOB_EXPIRY_MS) {
      activeJobs.delete(id);
    }
  }
}, 5 * 60 * 1000);

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function isVideoAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function createVideoJob(
  sceneText: string,
  heroName: string,
  heroDescription: string,
  referenceImageBase64?: string
): Promise<{ jobId: string } | { error: string }> {
  const client = getOpenAIClient();
  if (!client) {
    return { error: "Video generation is not configured. An OpenAI API key is required." };
  }

  const summary = sceneText.substring(0, 200);
  const prompt = `A gentle, child-friendly animated scene for a bedtime story. The hero "${heroName}" (${heroDescription?.substring(0, 80) || "a friendly superhero"}) is shown in this scene: ${summary}. Style: Soft, dreamy animation with warm pastel colors, magical sparkles, gentle movement, cozy atmosphere. Suitable for children ages 3-9. No scary elements, no violence. Camera slowly pans across the scene. Soft lighting, like moonlight or warm firelight.`;

  try {
    const video = await client.videos.create({
      model: "sora-2",
      prompt,
      size: "1280x720",
      seconds: 4,
    } as unknown as Parameters<typeof client.videos.create>[0]);

    const jobId = crypto.randomBytes(8).toString("hex");
    const job: VideoJob = {
      id: jobId,
      openaiVideoId: video.id,
      status: toVideoStatus(video.status),
      progress: 0,
      createdAt: Date.now(),
    };
    activeJobs.set(jobId, job);

    pollVideoStatus(client, job);

    return { jobId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, message }, 'video creation failed');
    return { error: message || "Failed to create video" };
  }
}

async function pollVideoStatus(client: OpenAI, job: VideoJob) {
  const maxPolls = 60;
  let polls = 0;

  while (polls < maxPolls) {
    await new Promise((r) => setTimeout(r, 10000));
    polls++;

    try {
      const video = await client.videos.retrieve(job.openaiVideoId);
      // intentional: Sora preview SDK response has `progress` and `output_url` fields
      // that aren't declared on the typed `Video` shape. Cast to a local extension.
      const soraVideo = video as typeof video & { progress?: number; output_url?: string };
      job.status = toVideoStatus(video.status);
      job.progress = soraVideo.progress || Math.min(polls * 5, 95);

      if (video.status === "completed") {
        try {
          const outputUrl = soraVideo.output_url;
          if (!outputUrl) {
            job.status = "failed";
            job.error = "No output URL in completed video";
            return;
          }

          const fileName = `${job.id}.mp4`;
          const filePath = path.join(VIDEO_CACHE_DIR, fileName);

          const response = await globalThis.fetch(outputUrl);
          if (!response.ok) throw new Error(`Download failed: ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

          job.videoPath = filePath;
          job.status = "completed";
          job.progress = 100;
        } catch (dlErr: unknown) {
          logger.error({ err: dlErr }, 'video download failed');
          job.status = "failed";
          job.error = "Video generated but download failed";
        }
        return;
      }

      if (video.status === "failed") {
        job.status = "failed";
        job.error = "Video generation failed";
        return;
      }
    } catch (err: unknown) {
      logger.error({ err }, 'video poll failed');
      if (polls >= maxPolls) {
        job.status = "failed";
        job.error = "Video generation timed out";
      }
    }
  }
}

export function getVideoJob(jobId: string): VideoJob | undefined {
  return activeJobs.get(jobId);
}

export function getVideoFilePath(jobId: string): string | null {
  const job = activeJobs.get(jobId);
  if (!job || !job.videoPath) return null;
  if (!fs.existsSync(job.videoPath)) return null;
  return job.videoPath;
}
