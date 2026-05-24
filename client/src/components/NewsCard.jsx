function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diffSec = (Date.now() - d.getTime()) / 1000;
  if (diffSec < 60) return 'şimdi';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}d`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}sa`;
  return d.toLocaleDateString('tr-TR');
}

export default function NewsCard({ item }) {
  return (
    <a
      className="news-card"
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="source-row">
        <span className="source">{item.sourceName}</span>
        <span className="time">{formatTime(item.isoDate)}</span>
      </div>
      <div className="news-title">{item.title}</div>
    </a>
  );
}
