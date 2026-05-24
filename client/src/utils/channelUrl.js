// Kanal "kaynağı" için esnek parser.
// Kabul edilen formatlar:
//   - Channel ID: "UCxxxxxxxxxxxxxxxxxxxxxx" (UC + 22 karakter)
//   - Video ID: 11 karakter alfanumerik
//   - @handle: "@handlename" (embed desteklenmiyor — uyarı)
//   - https://www.youtube.com/channel/UC...
//   - https://www.youtube.com/watch?v=VIDEOID
//   - https://youtu.be/VIDEOID
//   - https://www.youtube.com/embed/live_stream?channel=UC...
//   - https://www.youtube.com/embed/VIDEOID
//   - https://www.youtube.com/@handle  (embed desteklenmiyor)

export function parseChannelSource(input) {
  if (!input || typeof input !== 'string') {
    return { type: 'invalid', value: null, error: 'Boş kaynak' };
  }
  const s = input.trim();
  if (!s) return { type: 'invalid', value: null, error: 'Boş kaynak' };

  // HLS stream (.m3u8) — şimdilik tanı ama oynatma yok
  if (/\.m3u8(\?|$)/i.test(s)) {
    return {
      type: 'hls',
      value: s,
      error: 'HLS (m3u8) desteği yakında — şimdilik sadece YouTube',
    };
  }

  // URL ise parse et
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);

      // /channel/UC...
      const channelMatch = u.pathname.match(/\/channel\/(UC[\w-]+)/);
      if (channelMatch) return { type: 'channel', value: channelMatch[1] };

      // youtube.com/live/VIDEOID (yeni canlı yayın URL formatı)
      const liveVideoMatch = u.pathname.match(/\/live\/([\w-]{11})/);
      if (liveVideoMatch) return { type: 'video', value: liveVideoMatch[1] };

      // youtu.be/VIDEOID
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.replace(/^\//, '');
        if (/^[\w-]{11}$/.test(id)) return { type: 'video', value: id };
      }

      // /watch?v=VIDEOID
      const v = u.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return { type: 'video', value: v };

      // /embed/live_stream?channel=UC...
      const liveCh = u.searchParams.get('channel');
      if (liveCh && /^UC[\w-]+$/.test(liveCh)) {
        return { type: 'channel', value: liveCh };
      }

      // /embed/VIDEOID
      const embedMatch = u.pathname.match(/\/embed\/([\w-]{11})$/);
      if (embedMatch) return { type: 'video', value: embedMatch[1] };

      // /@handle
      const handleMatch = u.pathname.match(/\/@([\w.-]+)/);
      if (handleMatch) {
        return {
          type: 'handle',
          value: handleMatch[1],
          error: '@handle embed desteklenmiyor — kanal sayfasından channel ID (UC...) al',
        };
      }

      return { type: 'invalid', value: null, error: 'YouTube URL tanınmadı' };
    } catch {
      return { type: 'invalid', value: null, error: 'Geçersiz URL' };
    }
  }

  // Düz channel ID (UC + 22 karakter ≈ 24 toplam)
  if (/^UC[\w-]{22}$/.test(s)) return { type: 'channel', value: s };

  // @handle (URL değil)
  if (s.startsWith('@')) {
    return {
      type: 'handle',
      value: s.slice(1),
      error: '@handle embed desteklenmiyor — channel ID (UC...) gerekli',
    };
  }

  // Düz video ID (11 karakter)
  if (/^[\w-]{11}$/.test(s)) return { type: 'video', value: s };

  return { type: 'invalid', value: null, error: 'Tanınmayan format' };
}

export function buildEmbedUrl(source) {
  const parsed = parseChannelSource(source);
  if (parsed.type === 'channel') {
    return `https://www.youtube.com/embed/live_stream?channel=${parsed.value}&autoplay=1&mute=1`;
  }
  if (parsed.type === 'video') {
    return `https://www.youtube.com/embed/${parsed.value}?autoplay=1&mute=1`;
  }
  return null; // handle veya invalid
}
