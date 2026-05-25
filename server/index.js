import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import rssRoute from './routes/rss.js';
import financeRoute from './routes/finance.js';
import discoverRoute from './routes/discover.js';
import { getSources, setSources, resetSources } from './sourcesState.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Express app factory. Electron main process veya standalone runner çağırır.
 * @param {object} options
 * @param {string|null} options.serveStatic - varsa bu klasörü static serve eder + SPA fallback
 */
export function createApp(options = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Runtime sources — getSources state'i client PUT ile değiştirilebilir
  app.get('/api/sources', (_req, res) => {
    res.json(getSources());
  });

  app.put('/api/sources/runtime', (req, res) => {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'array gerekli' });
    }
    try {
      setSources(req.body);
      res.json({ ok: true, count: req.body.length });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/sources/runtime', (_req, res) => {
    resetSources();
    res.json({ ok: true, count: getSources().length });
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
  app.use('/api/discover', discoverRoute);

  // Production build'i serve et (Electron prod modunda)
  if (options.serveStatic) {
    app.use(express.static(options.serveStatic));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(join(options.serveStatic, 'index.html'));
    });
  }

  return app;
}

export function startServer(port, options = {}) {
  const app = createApp(options);
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`[server] listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}
