import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { isAuthEnabled } from "./auth";
import { logger, createRequestId } from "./logger";
import { recordRequest, getMetrics } from "./metrics";
import { checkAlertThresholds } from "./alerting";
import { createLoadSheddingMiddleware } from "./load-shedding";
import { attachRealtimeWebSocketServer, closeAllRealtimeConnections } from "./realtime/ws-server";
import * as fs from "fs";
import * as path from "path";

const log = logger.info.bind(logger);

function validateEnvironment() {
  const providerConfigs: Array<{
    keyVar: string;
    urlVar?: string;
    name: string;
    supportsImage: boolean;
  }> = [
    { keyVar: "GEMINI_API_KEY", name: "Gemini", supportsImage: true },
    { keyVar: "OPENAI_API_KEY", name: "OpenAI", supportsImage: true },
    { keyVar: "ANTHROPIC_API_KEY", urlVar: "ANTHROPIC_BASE_URL", name: "Anthropic Claude", supportsImage: false },
    { keyVar: "OPENROUTER_API_KEY", urlVar: "OPENROUTER_BASE_URL", name: "OpenRouter (xAI, Mistral, Cohere, Meta Llama)", supportsImage: false },
  ];

  let textProviders = 0;
  let imageProviders = 0;

  for (const { keyVar, urlVar, name, supportsImage } of providerConfigs) {
    const hasKey = !!process.env[keyVar]?.trim();
    const hasUrl = urlVar ? !!process.env[urlVar]?.trim() : false;
    if (hasKey) {
      textProviders++;
      if (supportsImage) imageProviders++;
      if (hasUrl && urlVar) {
        log(`[Env] INFO: ${name} custom base URL configured (${urlVar})`);
      }
    } else if (hasUrl && urlVar) {
      log(`[Env] WARNING: ${name} base URL is set but ${keyVar} is missing`);
    }
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    log("[Env] INFO: ELEVENLABS_API_KEY is not set — TTS narration will be unavailable");
  }
  if (!process.env.OPENAI_API_KEY) {
    log("[Env] INFO: OPENAI_API_KEY is not set — video generation (Sora) will be unavailable");
  }

  if (textProviders === 0) {
    log("[Env] WARNING: No text AI providers configured — story generation will fail");
  }
  if (imageProviders === 0) {
    log("[Env] WARNING: No image AI providers configured — avatar/scene generation will fail");
  }

  if (!isAuthEnabled()) {
    log("[Env] WARNING: Supabase server auth is not configured — authentication is DISABLED (dev mode)");
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
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https:; font-src 'self' https://fonts.gstatic.com https:;");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    origins.add("https://bedtime-chronicles.com");
    origins.add("https://www.bedtime-chronicles.com");

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

    if (origin && (origins.has(origin) || isLocalhost)) {
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
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
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

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ error: message });
  });
}

export async function createApp(): Promise<express.Application> {
  const app = express();

  // Long-running Node deployments may have one trusted proxy hop. A Cloudflare
  // Worker adapter must normalize client identity at its own boundary instead of
  // trusting arbitrary public forwarding headers.
  app.set('trust proxy', 1);

  validateEnvironment();
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

// Start the long-running Node adapter when this module is executed outside tests.
if (process.env.NODE_ENV !== "test") {
  (async () => {
    const app = await createApp();
    const { createServer } = await import("node:http");
    const server = createServer(app);
    attachRealtimeWebSocketServer(server);

    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`express server serving on port ${port}`);
      },
    );

    function gracefulShutdown(signal: string) {
      log(`[Shutdown] Received ${signal}, closing server...`);
      // server.close() alone waits for connections to end on their own, but a
      // WebSocket upgrade hijacks its socket out of the HTTP server's normal
      // connection tracking — an open realtime session would otherwise hold
      // shutdown open until the force-exit timeout below on every deploy.
      closeAllRealtimeConnections();
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
  })();
}
