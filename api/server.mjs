import { createApp } from '../server_dist/index.js';

let appPromise = null;

export default async function handler(req, res) {
  try {
    if (!appPromise) {
      appPromise = createApp();
    }

    const app = await appPromise;
    app(req, res);
  } catch (error) {
    // Reset so the next request can retry initialization
    appPromise = null;
    // SECURITY: avoid leaking internal error details to clients
    // eslint-disable-next-line no-console
    console.error('Failed to initialize application', error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}
