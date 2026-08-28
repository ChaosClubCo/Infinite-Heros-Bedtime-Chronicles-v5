import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { checkRateLimitAsync } from "../rate-limit";
import { classifyError, createErrorResponse } from "../utils";
import { TTS_CACHE_DIR } from "./context";

export function getClientIp(req: Request): string {
  if (req.user?.uid) return req.user.uid;
  // Strip IPv6 zone/scope suffix (e.g. "fe80::1%eth0") so the same client
  // can't fragment into distinct rate-limit buckets. `trust proxy` is set in
  // createApp(), so req.ip reflects the real client behind Replit/Vercel.
  const raw = req.ip ?? req.socket?.remoteAddress ?? "unknown";
  return raw.replace(/%.*$/, "");
}

/**
 * Per-route rate-limit middleware. Keys on the authenticated uid when present,
 * falling back to client IP. Uses Cloudflare KV when configured (persistent
 * across restarts), otherwise falls back to the in-memory sliding window.
 */
export function rateLimited(message = "Too many requests. Please wait a moment.") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!(await checkRateLimitAsync(getClientIp(req)))) {
      return res.status(429).json({ error: message });
    }
    next();
  };
}

/**
 * Shared catch-block response: classify the error, log it on the request
 * logger, and emit the sanitized 503/500 payload.
 */
export function sendRouteError(req: Request, res: Response, error: unknown, logMsg: string, publicMsg: string): void {
  req.log?.error({ err: error }, logMsg);
  const kind = classifyError(error);
  res.status(kind === 'transient' ? 503 : 500).json(createErrorResponse(publicMsg, kind));
}

export function ttsCachePathFor(cacheKey: string): { fileName: string; filePath: string } {
  const hash = crypto.createHash("md5").update(cacheKey).digest("hex");
  const fileName = `${hash}.mp3`;
  return { fileName, filePath: path.join(TTS_CACHE_DIR, fileName) };
}
