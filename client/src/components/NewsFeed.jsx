import { useEffect, useMemo, useState } from 'react';
import NewsCard from './NewsCard.jsx';

const POLL_MS = 60_000;

export default function NewsFeed({ selectedSources, keyword = '', onKeywordChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // null = implicit hepsi; array = explicit set; [] = hiçbiri
  const useFilter = selectedSources != null;
  const sourcesKey = useFilter ? selectedSources.join(',') : null;
  const skipFetch = useFilter && selectedSources.length === 0;

  useEffect(() => {
    if (skipFetch) {
      setItems([]);
      setLoading(false);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const qs = sourcesKey ? `?sources=${encodeURIComponent(sourcesKey)}` : '';
        const r = await fetch(`/api/rss${qs}`);
        const data = await r.json();
        if (alive) setItems(data.items || []);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [sourcesKey, skipFetch]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return items;
    return items.filter(
      (it) =>
        (it.title || '').toLowerCase().includes(k) ||
        (it.contentSnippet || '').toLowerCase().includes(k)
    );
  }, [items, keyword]);

  return (
    <div className="feed">
      <div className="feed-header">
        <span className="title">📰 HABERLER</span>
        <input
          className="feed-search"
          type="text"
          placeholder="Haberlerde ara…"
          value={keyword}
          onChange={(e) => onKeywordChange && onKeywordChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && onKeywordChange) {
              onKeywordChange('');
              e.target.blur();
            }
          }}
        />
        <span className="meta">{loading ? '…' : filtered.length}</span>
      </div>
      <div className="feed-list">
        {filtered.map((it) => (
          <NewsCard key={it.id} item={it} />
        ))}
        {!loading && filtered.length === 0 && (
          <div className="feed-empty">
            {skipFetch ? 'Hiçbir kaynak seçili değil.' : 'Haber bulunamadı.'}
          </div>
        )}
      </div>
    </div>
  );
}
