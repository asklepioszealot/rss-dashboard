import { buildEmbedUrl, parseChannelSource } from '../utils/channelUrl.js';
import HlsPlayer from './HlsPlayer.jsx';

export default function ChannelTile({ index, channel }) {
  if (!channel) {
    return (
      <div className="tile">
        <div className="tile-label">YT #{index}</div>
        <div className="tile-empty">— boş slot —</div>
      </div>
    );
  }

  // Geriye uyumluluk: eski channels.json `channelId` field'ı kullanıyordu
  const source = channel.source || channel.channelId || '';
  const parsed = parseChannelSource(source);

  if (parsed.type === 'hls') {
    return (
      <div className="tile">
        <div className="tile-label">📡 #{index} · {channel.name}</div>
        <HlsPlayer url={parsed.value} name={channel.name} />
      </div>
    );
  }

  const src = buildEmbedUrl(source);

  if (!src) {
    return (
      <div className="tile">
        <div className="tile-label">YT #{index} · {channel.name || '?'}</div>
        <div className="tile-empty" style={{ flexDirection: 'column', padding: 8, textAlign: 'center' }}>
          <div>⚠ {parsed.error || 'geçersiz kaynak'}</div>
          <div style={{ fontSize: 10, marginTop: 6, opacity: 0.7, wordBreak: 'break-all' }}>
            {source || '(boş)'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tile">
      <div className="tile-label">YT #{index} · {channel.name}</div>
      <iframe
        src={src}
        title={channel.name}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
