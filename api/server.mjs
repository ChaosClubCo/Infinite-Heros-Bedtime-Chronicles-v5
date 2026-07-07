import { createApp } from '../server_dist/index.js';

let appPromise = null;

export default async function handler(req, res) {
  if (!appPromise) {
    appPromise = createApp();
  }

  let app;
  try {
    app = await appPromise;
  } catch (error) {
    // Reset only on init failure so the next request retries initialization
    appPromise = null;
    // SECURITY: avoid leaking internal error details to clients
    // eslint-disable-next-line no-console
    console.error('Failed to initialize application', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  app(req, res);
}
