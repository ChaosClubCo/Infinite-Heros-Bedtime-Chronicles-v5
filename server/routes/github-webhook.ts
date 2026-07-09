import express, { type Express, type Request, type Response } from "express";
import crypto from "node:crypto";
import { logger } from "../logger";
import { rateLimited } from "./helpers";

/**
 * GitHub webhook receiver. Verifies X-Hub-Signature-256 against the RAW
 * request body, captured here (not by the global express.json parser in
 * server/index.ts, which server/index.ts skips for this path) so:
 *  - GitHub's up-to-25MB payloads aren't rejected by the app-wide 100kb limit
 *  - form-urlencoded deliveries (GitHub's other supported content type) get
 *    their exact wire bytes captured too, since express.urlencoded() has no
 *    verify hook of its own
 *
 * TEMPORARY: verbose structured logging below is for diagnosing the 403 on
 * webhook 645778760 (delivery 17c1c010-7b5b-11f1-919c-3358006d3edc) and should
 * be removed once the root cause is confirmed fixed.
 */

const rawBodyParser = express.raw({ type: () => true, limit: "25mb" });

function verifySignature(secret: string, rawBody: Buffer, signatureHeader: string | undefined): { ok: boolean; reason: string } {
  if (!signatureHeader) return { ok: false, reason: "missing_signature_header" };
  if (!signatureHeader.startsWith("sha256=")) return { ok: false, reason: "unsupported_signature_scheme" };

  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);

  if (expectedBuf.length !== actualBuf.length) return { ok: false, reason: "signature_length_mismatch" };
  const ok = crypto.timingSafeEqual(expectedBuf, actualBuf);
  return { ok, reason: ok ? "ok" : "signature_mismatch" };
}

export function registerGithubWebhookRoute(app: Express): void {
  app.post(
    "/api/github/webhook",
    rateLimited("Too many webhook deliveries. Please wait a moment."),
    rawBodyParser,
    (req: Request, res: Response) => {
      const delivery = req.header("x-github-delivery");
      const event = req.header("x-github-event");
      const signatureHeader = req.header("x-hub-signature-256");
      const signaturePresent = !!signatureHeader;

      const secret = process.env.GITHUB_WEBHOOK_SECRET;
      if (!secret) {
        logger.error(
          { event: "github_webhook", delivery, githubEvent: event, signaturePresent, result: "fail", reason: "server_secret_not_configured", status: 500 },
          "github webhook rejected",
        );
        return res.status(500).json({ error: "Webhook not configured" });
      }

      const rawBody = req.body instanceof Buffer ? req.body : undefined;
      if (!rawBody) {
        logger.error(
          { event: "github_webhook", delivery, githubEvent: event, signaturePresent, result: "fail", reason: "raw_body_unavailable", status: 400 },
          "github webhook rejected",
        );
        return res.status(400).json({ error: "Bad request" });
      }

      const { ok, reason } = verifySignature(secret, rawBody, signatureHeader);
      if (!ok) {
        logger.warn(
          { event: "github_webhook", delivery, githubEvent: event, signaturePresent, result: "fail", reason, status: 401 },
          "github webhook signature verification failed",
        );
        return res.status(401).json({ error: "Invalid signature" });
      }

      logger.info(
        { event: "github_webhook", delivery, githubEvent: event, signaturePresent, result: "pass", reason: "ok", status: 202 },
        "github webhook accepted",
      );

      // Accept and return immediately; do any real processing async/out-of-band
      // so GitHub's delivery isn't held open by downstream work.
      res.status(202).json({ ok: true });
    },
  );
}
