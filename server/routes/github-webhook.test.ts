import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import crypto from "node:crypto";
import type { Express } from "express";
import type { Server } from "node:http";
import { registerGithubWebhookRoute } from "./github-webhook";

const SECRET = "test-webhook-secret";
const previousSecret = process.env.GITHUB_WEBHOOK_SECRET;

let app: Express;
let server: Server;

beforeAll(() => {
  // No global body parser here — the route installs its own raw-body parser
  // (matching how server/index.ts skips the global json/urlencoded parsers
  // for this path in production), so the exact wire bytes reach the HMAC check.
  app = express();
  registerGithubWebhookRoute(app);
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

beforeEach(() => {
  process.env.GITHUB_WEBHOOK_SECRET = SECRET;
});

afterEach(() => {
  if (previousSecret === undefined) {
    delete process.env.GITHUB_WEBHOOK_SECRET;
  } else {
    process.env.GITHUB_WEBHOOK_SECRET = previousSecret;
  }
});

function sign(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("POST /api/github/webhook", () => {
  it("returns 500 when GITHUB_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    const body = JSON.stringify({ action: "completed" });

    const res = await request(app)
      .post("/api/github/webhook")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", "workflow_run")
      .set("X-Hub-Signature-256", sign(SECRET, body))
      .send(body);

    expect(res.status).toBe(500);
  });

  it("returns 401 when the signature header is missing", async () => {
    const res = await request(app)
      .post("/api/github/webhook")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", "workflow_run")
      .send(JSON.stringify({ action: "completed" }));

    expect(res.status).toBe(401);
  });

  it("returns 401 when the signature does not match the body", async () => {
    const body = JSON.stringify({ action: "completed" });

    const res = await request(app)
      .post("/api/github/webhook")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", "workflow_run")
      .set("X-Hub-Signature-256", sign("wrong-secret", body))
      .send(body);

    expect(res.status).toBe(401);
  });

  it("returns 202 when the signature matches the raw body", async () => {
    const body = JSON.stringify({ action: "completed" });

    const res = await request(app)
      .post("/api/github/webhook")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", "workflow_run")
      .set("X-GitHub-Delivery", "test-delivery-id")
      .set("X-Hub-Signature-256", sign(SECRET, body))
      .send(body);

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
  });

  it("accepts a signed payload larger than the app-wide 100kb JSON limit", async () => {
    const body = JSON.stringify({ action: "completed", padding: "x".repeat(150_000) });

    const res = await request(app)
      .post("/api/github/webhook")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", "workflow_run")
      .set("X-Hub-Signature-256", sign(SECRET, body))
      .send(body);

    expect(res.status).toBe(202);
  });
});
