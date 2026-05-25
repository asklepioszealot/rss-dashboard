// Auto-discover: site URL'inden RSS/Atom feed URL'i bulur.
// 1) HTML çek, <link rel="alternate" type="application/(rss|atom)+xml" href="..."> parse et
// 2) Bulamazsa fallback path'leri dene (/feed, /rss, /rss.xml, /atom.xml)
import { Router } from 'express';

const router = Router();
const FALLBACK_PATHS = ['/feed', '/rss', '/rss.xml', '/atom.xml', '/feed/'];
const UA = { 'User-Agent': 'RSSDashboard/0.1 (+local)' };

function parseLinkTags(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const feeds = [];
  for (const tag of tags) {
    const rel = (tag.match(/\brel=["']([^"']+)["']/i) || [])[1];
    const type = (tag.match(/\btype=["']([^"']+)["']/i) || [])[1];
    const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
    const title = (tag.match(/\btitle=["']([^"']+)["']/i) || [])[1];
    if (rel === 'alternate' && type && /application\/(rss|atom)\+xml/i.test(type) && href) {
      feeds.push({ href, title: title || null });
    }
  }
  return feeds;
}

function absUrl(href, base) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

router.get('/', async (req, res) => {
  const url = String(req.query.url || '').trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Geçerli http(s) URL gerekli' });
  }

  const feeds = [];

  // 1. HTML çek
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const html = await r.text();
      for (const link of parseLinkTags(html)) {
        const abs = absUrl(link.href, url);
        if (abs) feeds.push({ url: abs, title: link.title, via: 'link-rel' });
      }
    }
  } catch (err) {
    console.warn(`[discover] HTML fetch failed: ${err.message}`);
  }

  // 2. Fallback paths — HTML'de bulamadıysak
  if (feeds.length === 0) {
    let origin;
    try {
      origin = new URL(url).origin;
    } catch {
      return res.json({ feeds: [] });
    }
    for (const path of FALLBACK_PATHS) {
      const candidate = `${origin}${path}`;
      try {
        const r = await fetch(candidate, {
          method: 'GET',
          headers: UA,
          signal: AbortSignal.timeout(4000),
        });
        if (r.ok) {
          const ct = r.headers.get('content-type') || '';
          // RSS/Atom döndüğünü doğrula
          if (/xml|rss|atom/i.test(ct)) {
            feeds.push({ url: candidate, title: null, via: 'fallback' });
            break;
          }
        }
      } catch {
        /* skip */
      }
    }
  }

  res.json({ feeds });
});

export default router;
