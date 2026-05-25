import { useEffect, useState } from 'react';

const POLL_MS = 30_000;

function formatPrice(p) {
  if (p == null) return '—';
  return p.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

export default function Ticker({ symbols }) {
  const [items, setItems] = useState([]);

  // {symbol → label} eşlemesi client tarafında: backend label'ı sadece sembolden türetiyor
  const labelMap = new Map((symbols || []).map((s) => [s.symbol, s.label]));
  const symbolsKey = (symbols || []).map((s) => s.symbol).join(',');

  useEffect(() => {
    if (!symbolsKey) {
      setItems([]);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/finance?symbols=${encodeURIComponent(symbolsKey)}`);
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
        {items.map((it) => {
          const label = labelMap.get(it.symbol) || it.label || it.symbol;
          return (
            <span className="ticker-item" key={it.symbol}>
              <span className="label">{label}</span>
              <span className="price">{formatPrice(it.price)}</span>{' '}
              <span className={`change ${it.changePct >= 0 ? 'up' : 'down'}`}>
                {it.changePct >= 0 ? '▲' : '▼'} {Math.abs(it.changePct).toFixed(2)}%
              </span>
            </span>
          );
        })}
        {items.length === 0 && (
          <span className="ticker-item">Borsa verileri yükleniyor…</span>
        )}
      </div>
    </div>
  );
}
