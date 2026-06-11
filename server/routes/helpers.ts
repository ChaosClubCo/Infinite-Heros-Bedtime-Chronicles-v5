import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { checkRateLimit } from "../rate-limit";
import { classifyError, createErrorResponse } from "../utils";
import { TTS_CACHE_DIR } from "./context";

export function getClientIp(req: Request): string {
  return req.user?.uid || req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Per-route rate-limit middleware. Keys on the authenticated uid when present,
 * falling back to client IP (see getClientIp).
 */
export function rateLimited(message = "Too many requests. Please wait a moment.") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!checkRateLimit(getClientIp(req))) {
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
