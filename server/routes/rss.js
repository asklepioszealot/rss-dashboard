import { Router } from 'express';
import Parser from 'rss-parser';
import NodeCache from 'node-cache';
import { getSources, onChange } from '../sourcesState.js';

const router = Router();
const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'RSSDashboard/0.1 (+local)' },
});
export const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

// Sources değişince cache temizle (yeni URL'ler hemen fetch'lensin)
onChange(() => cache.flushAll());

async function fetchFeed(source) {
  const cached = cache.get(source.id);
  if (cached) return cached;
  try {
    const feed = await parser.parseURL(source.url);
    const items = (feed.items || []).slice(0, 30).map((it) => ({
      id: it.guid || it.link || `${source.id}-${it.title}`,
      title: it.title || '',
      link: it.link || '',
      isoDate: it.isoDate || it.pubDate || null,
      contentSnippet: it.contentSnippet || '',
      source: source.id,
      sourceName: source.name,
    }));
    cache.set(source.id, items);
    return items;
  } catch (err) {
    console.warn(`[rss] ${source.id} failed: ${err.message}`);
    return [];
  }
}

// GET /api/rss?sources=hurriyet,ntv
router.get('/', async (req, res) => {
  const all = getSources();
  const filter = req.query.sources ? String(req.query.sources).split(',').filter(Boolean) : null;
  const targets = filter ? all.filter((s) => filter.includes(s.id)) : all;
  const results = await Promise.all(targets.map(fetchFeed));
  const merged = results
    .flat()
    .sort((a, b) => new Date(b.isoDate || 0) - new Date(a.isoDate || 0));
  res.json({ count: merged.length, items: merged });
});

export default router;
