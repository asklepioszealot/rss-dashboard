import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import rssRoute from './routes/rss.js';
import financeRoute from './routes/finance.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Express app factory. Electron main process veya standalone runner çağırır.
 * @param {object} options
 * @param {string|null} options.serveStatic - varsa bu klasörü static serve eder + SPA fallback
 */
export function createApp(options = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/sources', (_req, res) => {
    try {
      const data = JSON.parse(readFileSync(join(__dirname, 'sources.json'), 'utf8'));
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/channels', (_req, res) => {
    try {
      const data = JSON.parse(readFileSync(join(__dirname, 'channels.json'), 'utf8'));
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use('/api/rss', rssRoute);
  app.use('/api/finance', financeRoute);

  // Production build'i serve et (Electron prod modunda)
  if (options.serveStatic) {
    app.use(express.static(options.serveStatic));
    // SPA fallback — /api olmayan tüm GET'ler index.html
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(join(options.serveStatic, 'index.html'));
    });
  }

  return app;
}

/**
 * Server'ı başlatır, http.Server döner.
 */
export function startServer(port, options = {}) {
  const app = createApp(options);
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`[server] listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}
