import { useEffect, useState } from 'react';

const POLL_MS = 30_000;

export default function BreakingMarquee({ breakingSources = [] }) {
  const [items, setItems] = useState([]);
  const sourcesKey = breakingSources.join(',');

  useEffect(() => {
    if (!sourcesKey) {
      setItems([]);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/rss?sources=${sourcesKey}`);
        const data = await r.json();
        if (alive) setItems((data.items || []).slice(0, 20));
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [sourcesKey]);

  const hasItems = items.length > 0;

  return (
    <div className="marquee">
      <span className="label">SON DAKİKA</span>
      <div className="marquee-track-wrap">
        <div className="marquee-track">
          {hasItems ? (
            items.map((it, i) => (
              <a
                key={it.id || i}
                href={it.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="marquee-item"
                title={it.title}
              >
                <strong>{it.sourceName}:</strong> {it.title}
              </a>
            ))
          ) : (
            <span>
              {sourcesKey
                ? 'Son dakika haberleri yükleniyor…'
                : 'Son dakika için kaynak işaretlenmedi (Ayarlar → 🔴)'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
