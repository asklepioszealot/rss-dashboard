import { useEffect, useState } from 'react';

const POLL_MS = 30_000;

function formatPrice(p) {
  if (p == null) return '—';
  return p.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

export default function Ticker({ selectedSymbols = [] }) {
  const [items, setItems] = useState([]);
  const symbolsKey = selectedSymbols.join(',');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const qs = symbolsKey ? `?symbols=${encodeURIComponent(symbolsKey)}` : '';
        const r = await fetch(`/api/finance${qs}`);
        const data = await r.json();
        if (alive) setItems(data.items || []);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [symbolsKey]);

  return (
    <div className="ticker">
      <div className="ticker-track">
        {items.map((it) => (
          <span className="ticker-item" key={it.symbol}>
            <span className="label">{it.label}</span>
            <span className="price">{formatPrice(it.price)}</span>{' '}
            <span className={`change ${it.changePct >= 0 ? 'up' : 'down'}`}>
              {it.changePct >= 0 ? '▲' : '▼'} {Math.abs(it.changePct).toFixed(2)}%
            </span>
          </span>
        ))}
        {items.length === 0 && (
          <span className="ticker-item">Borsa verileri yükleniyor…</span>
        )}
      </div>
    </div>
  );
}
