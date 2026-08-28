import express from "express";
import type { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes";
import { isAuthEnabled } from "./auth";
import { logger, createRequestId } from "./logger";
import { recordRequest, getMetrics } from "./metrics";
import { checkAlertThresholds } from "./alerting";
import { createLoadSheddingMiddleware } from "./load-shedding";
import * as fs from "fs";
import * as path from "path";

const log = logger.info.bind(logger);

// Server-side error tracking. No-ops gracefully when SENTRY_DSN is unset
// (mirrors the client-side init in app/_layout.tsx).
let sentryInitialized = false;
function initSentry() {
  if (sentryInitialized) return;
  sentryInitialized = true;
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

function validateEnvironment() {
  const providerConfigs: [string, string, string, boolean][] = [
    ["AI_INTEGRATIONS_GEMINI_API_KEY", "AI_INTEGRATIONS_GEMINI_BASE_URL", "Gemini", true],
    ["AI_INTEGRATIONS_OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_BASE_URL", "OpenAI (integrations)", true],
    ["AI_INTEGRATIONS_ANTHROPIC_API_KEY", "AI_INTEGRATIONS_ANTHROPIC_BASE_URL", "Anthropic Claude", false],
    ["AI_INTEGRATIONS_OPENROUTER_API_KEY", "AI_INTEGRATIONS_OPENROUTER_BASE_URL", "OpenRouter (xAI, Mistral, Cohere, Meta Llama)", false],
  ];

  let textProviders = 0;
  let imageProviders = 0;

  for (const [keyVar, urlVar, name, supportsImage] of providerConfigs) {
    const hasKey = !!process.env[keyVar];
    const hasUrl = !!process.env[urlVar];
    if (hasKey) {
      textProviders++;
      if (supportsImage) imageProviders++;
      if (hasUrl) {
        log(`[Env] INFO: ${name} custom base URL configured (${urlVar})`);
      }
    } else if (hasUrl) {
      log(`[Env] WARNING: ${name} base URL is set but ${keyVar} is missing`);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    textProviders++;
    imageProviders++;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    log("[Env] INFO: ELEVENLABS_API_KEY is not set — TTS narration will be unavailable");
  }
  if (!process.env.OPENAI_API_KEY) {
    log("[Env] INFO: OPENAI_API_KEY is not set — video generation (Sora) will be unavailable");
  }

  if (textProviders === 0) {
    log("[Env] WARNING: No text AI providers configured — story generation will fail");
    if (process.env.NODE_ENV === "production") {
      const fatalMsg = "No text AI providers configured in production. Refusing to start.";
      log(`[Env] FATAL: ${fatalMsg}`);
      // Throw instead of process.exit() so that:
      // - On Vercel (serverless) the rejected promise is caught by the handler
      //   and the function returns a 500 JSON response instead of crashing.
      // - On the standalone server the IIFE catch block calls process.exit(1).
      throw new Error(fatalMsg);
    }
  }
  if (imageProviders === 0) {
    log("[Env] WARNING: No image AI providers configured — avatar/scene generation will fail");
  }

  if (!isAuthEnabled()) {
    log("[Env] WARNING: Supabase auth not configured (need SUPABASE_SERVICE_ROLE_KEY + Supabase URL) — authentication is DISABLED (dev mode)");
  }

  // Cloudflare KV gives the rate limiter durable, cross-invocation state on
  // serverless. Missing entirely → silent in-memory fallback (fine for local/
  // Replit). Partially set → likely a misconfiguration worth surfacing.
  const cfVars = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_KV_NAMESPACE_ID", "CLOUDFLARE_API_TOKEN"];
  const cfSet = cfVars.filter((v) => !!process.env[v]).length;
  if (cfSet > 0 && cfSet < cfVars.length) {
    log("[Env] WARNING: CLOUDFLARE_* KV vars are partially set — rate limiting falls back to in-memory (not durable across serverless invocations)");
  }

  log(`[Env] Environment validation complete (${textProviders} text providers, ${imageProviders} image providers)`);
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
    requestId?: string;
    log?: import('pino').Logger;
  }
}

function setupSecurityHeaders(app: express.Application) {
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https:; font-src 'self' https://fonts.gstatic.com https:;");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    // Custom domain
    origins.add("https://bedtime-chronicles.com");
    origins.add("https://www.bedtime-chronicles.com");

    // Vercel preview deployments
    if (process.env.VERCEL_URL) {
      origins.add(`https://${process.env.VERCEL_URL}`);
    }

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    const ALLOWED_LOCAL_PORTS = [5000, 8081, 19000, 19001, 19002, 19003, 19004, 19005, 19006];
    const isLocalhost = (() => {
      if (!origin) return false;
      try {
        const url = new URL(origin);
        const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        return isLocal && ALLOWED_LOCAL_PORTS.includes(parseInt(url.port, 10));
      } catch {
        return false;
      }
    })();

    // Allow Vercel preview URLs — restricted to our project prefix
    const isVercelPreview = (() => {
      if (!origin) return false;
      try {
        return /^infinite-hero[a-z0-9-]*\.vercel\.app$/.test(new URL(origin).hostname);
      } catch {
        return false;
      }
    })();

    if (origin && (origins.has(origin) || isLocalhost || isVercelPreview)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

// GitHub webhook payloads can legitimately exceed the 100kb app-wide limit and
// need their exact wire bytes (not the parsed/re-serialized form) for HMAC
// signature verification, so that route installs its own raw-body parser
// (server/routes/github-webhook.ts) and must skip these global parsers entirely.
const BODY_PARSING_EXEMPT_PATHS = new Set(["/api/github/webhook"]);

function setupBodyParsing(app: express.Application) {
  const jsonParser = express.json({
    limit: "100kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  });
  const urlencodedParser = express.urlencoded({ extended: false, limit: "100kb" });

  app.use((req, res, next) => {
    if (BODY_PARSING_EXEMPT_PATHS.has(req.path)) return next();
    jsonParser(req, res, next);
  });
  app.use((req, res, next) => {
    if (BODY_PARSING_EXEMPT_PATHS.has(req.path)) return next();
    urlencodedParser(req, res, next);
  });
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || createRequestId();
    req.requestId = requestId;
    req.log = logger.child({ requestId });
    res.setHeader('x-request-id', requestId);

    const start = Date.now();
    const reqPath = req.path;

    res.on("finish", () => {
      if (!reqPath.startsWith("/api")) return;

      const duration = Date.now() - start;
      req.log!.info({ method: req.method, path: reqPath, status: res.statusCode, duration }, 'request completed');
      recordRequest(res.statusCode);

      // Threshold-based alerting is cheap and synchronous, but there's no need
      // to run it on every single request — checking every ~20th request is
      // enough resolution and works identically on Replit's long-running
      // process and Vercel's per-invocation one (no separate timer needed).
      if (getMetrics().requests.total % 20 === 0) {
        checkAlertThresholds();
      }
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  if (process.env.NODE_ENV !== "production") {
    logger.info({ baseUrl, expsUrl }, 'serving landing page');
  }

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

/** Minimal fallback rendered when the full landing-page.html template is absent. */
const FALLBACK_LANDING_HTML = [
  '<!doctype html><html lang="en"><head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>APP_NAME_PLACEHOLDER</title>',
  '<style>body{margin:0;background:#020215;color:#f1f5f9;font-family:sans-serif;',
  'display:flex;align-items:center;justify-content:center;min-height:100vh;',
  'text-align:center;padding:24px}</style>',
  '</head><body>',
  '<h1>APP_NAME_PLACEHOLDER</h1>',
  '<p>AI-powered bedtime stories for children.</p>',
  '</body></html>',
].join('');

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );

  let landingPageTemplate: string;
  try {
    landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  } catch {
    // Fallback minimal landing page if the template file is not bundled
    log("[Landing] Template file not found; using minimal fallback page");
    landingPageTemplate = FALLBACK_LANDING_HTML;
  }
  const appName = getAppName();

  log("Serving static Expo files with dynamic manifest routing");

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }

    if (req.path === "/") {
      const webIndexPath = path.resolve(process.cwd(), "static-build", "index.html");
      if (fs.existsSync(webIndexPath)) {
        // Web build is present — fall through to the express.static("static-build")
        // middleware below so the real app is served instead of the marketing page.
        return next();
      }

      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }

    next();
  });

  // Serve extracted template assets (landing/privacy CSS+JS) so the CSP can
  // drop 'unsafe-inline' for script-src/style-src.
  app.use("/static", express.static(path.resolve(process.cwd(), "server", "templates")));
  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Strip stack traces and internal details
    return err.message.replace(/\n.*/gs, '').slice(0, 200);
  }
  return 'Internal Server Error';
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const status =
      err != null && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : err != null && typeof err === 'object' && 'statusCode' in err
          ? (err as { statusCode: number }).statusCode
          : 500;

    const message = sanitizeErrorMessage(err);

    logger.error({ err, status }, 'unhandled server error');
    if (status >= 500) {
      Sentry.captureException(err);
    }

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ error: message });
  });
}

// Register process-level crash logging once. This runs in BOTH the serverless
// (Vercel) and long-running paths so unhandled rejections/exceptions always get
// a structured log instead of crashing silently. The long-running path adds its
// own drain-and-exit handler on top (see below).
let crashLoggingRegistered = false;
function registerCrashLogging() {
  if (crashLoggingRegistered) return;
  crashLoggingRegistered = true;
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "unhandledRejection");
    Sentry.captureException(reason);
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "uncaughtException");
    Sentry.captureException(err);
  });
}

export async function createApp(): Promise<express.Application> {
  const app = express();

  // Trust the single platform proxy (Vercel/Replit) so req.ip reflects the real
  // client for rate-limiting instead of the proxy address.
  app.set('trust proxy', 1);

  validateEnvironment();
  initSentry();
  registerCrashLogging();
  setupSecurityHeaders(app);
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  app.use(createLoadSheddingMiddleware());

  configureExpoAndLanding(app);

  await registerRoutes(app);

  setupErrorHandler(app);

  return app;
}

// Only start the server when running directly (not imported by Vercel)
if (!process.env.VERCEL) {
  (async () => {
    let app: express.Application;
    try {
      app = await createApp();
    } catch (err) {
      logger.error({ err }, "[Startup] Failed to initialize app. Exiting.");
      process.exit(1);
    }
    const { createServer } = await import("node:http");
    const server = createServer(app);

    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: process.platform !== "win32",
      },
      () => {
        log(`express server serving on port ${port}`);
      },
    );

    function gracefulShutdown(signal: string) {
      log(`[Shutdown] Received ${signal}, closing server...`);
      server.close(() => {
        log("[Shutdown] Server closed cleanly");
        process.exit(0);
      });
      setTimeout(() => {
        log("[Shutdown] Forcing exit after timeout");
        process.exit(1);
      }, 10_000);
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Long-running server only: createApp() already registered the structured
    // crash logging; here we additionally drain and exit on an uncaught
    // exception so a supervisor restarts a clean process. (On serverless the
    // platform isolates each invocation, so no drain handler is registered.)
    process.on("uncaughtException", () => gracefulShutdown("uncaughtException"));
  })();
}
