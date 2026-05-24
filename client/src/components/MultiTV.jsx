import { useEffect, useState } from 'react';
import ChannelTile from './ChannelTile.jsx';

// Kanal sayısı → grid kolon sayısı
const COL_MAP = {
  4: 2,
  6: 3,
  9: 3,
  10: 4,
  13: 4,
  16: 4,
  18: 6,
  21: 7,
  25: 5,
};

export default function MultiTV({ gridSize = 9, customChannels = null }) {
  const [defaults, setDefaults] = useState([]);

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then(setDefaults)
      .catch(() => setDefaults([]));
  }, []);

  const channels = customChannels && customChannels.length ? customChannels : defaults;
  const cols = COL_MAP[gridSize] || Math.ceil(Math.sqrt(gridSize));
  const tiles = Array.from({ length: gridSize }, (_, i) => channels[i] || null);

  return (
    <div className="multitv" style={{ '--cols': cols }}>
      {tiles.map((ch, i) => (
        <ChannelTile key={ch?.id || `empty-${i}`} index={i + 1} channel={ch} />
      ))}
    </div>
  );
}
