import { Router } from 'express';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 30, checkperiod: 15 });

const DEFAULT_SYMBOLS = [
  { symbol: 'USDTRY=X', label: 'USD/TRY' },
  { symbol: 'EURTRY=X', label: 'EUR/TRY' },
  { symbol: 'GC=F', label: 'ALTIN' },
  { symbol: 'XU100.IS', label: 'BIST 100' },
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: 'BZ=F', label: 'BRENT' },
  { symbol: 'BTC-USD', label: 'BTC' },
];

async function fetchQuote(symbol) {
  const key = `q:${symbol}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 RSSDashboard/0.1' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('no result');
    const meta = result.meta || {};
    const price = meta.regularMarketPrice ?? null;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const changePct = price != null && prev ? ((price - prev) / prev) * 100 : 0;
    const data = { symbol, price, prev, changePct };
    cache.set(key, data);
    return data;
  } catch (err) {
    console.warn(`[finance] ${symbol} failed: ${err.message}`);
    return null;
  }
}

// GET /api/finance/defaults — varsayılan sembol seti (client init için)
router.get('/defaults', (_req, res) => {
  res.json(DEFAULT_SYMBOLS);
});

// GET /api/finance?symbols=USDTRY=X,EURTRY=X
router.get('/', async (req, res) => {
  const list = req.query.symbols
    ? String(req.query.symbols)
        .split(',')
        .filter(Boolean)
        .map((s) => ({ symbol: s, label: s }))
    : DEFAULT_SYMBOLS;
  const out = await Promise.all(
    list.map(async ({ symbol, label }) => {
      const q = await fetchQuote(symbol);
      return q ? { ...q, label } : { symbol, label, price: null, prev: null, changePct: 0 };
    })
  );
  res.json({ items: out });
});

export default router;
