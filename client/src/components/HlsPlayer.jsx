import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ url, name }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setError(false);

    // Safari/iOS native HLS
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      const onErr = () => setError(true);
      video.addEventListener('error', onErr);
      return () => video.removeEventListener('error', onErr);
    }

    // Chromium/Electron → hls.js
    if (!Hls.isSupported()) {
      setError(true);
      return;
    }

    const hls = new Hls({ liveSyncDuration: 3 });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) setError(true);
    });

    return () => hls.destroy();
  }, [url]);

  if (error) {
    return (
      <div className="tile-empty" style={{ flexDirection: 'column', padding: 8, textAlign: 'center' }}>
        <div>⚠ Yayın yüklenemedi</div>
        <div style={{ fontSize: 10, marginTop: 6, opacity: 0.7, wordBreak: 'break-all' }}>
          {url}
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      controls
      title={name}
    />
  );
}
