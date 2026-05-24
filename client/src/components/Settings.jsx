import { useEffect, useState } from 'react';
import { parseChannelSource } from '../utils/channelUrl.js';
import VersionTag from './VersionTag.jsx';

const GRID_OPTIONS = [4, 6, 9, 10, 13, 16, 18, 21, 25];

function makeId() {
  return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalize(list) {
  return (list || []).map((c) => ({
    id: c.id || makeId(),
    name: c.name || '',
    source: c.source || c.channelId || '',
  }));
}

export default function Settings({ settings, onChange, onClose }) {
  const [defaultChannels, setDefaultChannels] = useState([]);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((d) => setDefaultChannels(normalize(d)))
      .catch(() => {});
    fetch('/api/sources').then((r) => r.json()).then(setSources).catch(() => {});
  }, []);

  const channels = settings.customChannels
    ? normalize(settings.customChannels)
    : defaultChannels;

  const commitChannels = (next) => {
    onChange({ ...settings, customChannels: next });
  };

  const updateChannel = (idx, patch) => {
    const next = channels.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    commitChannels(next);
  };

  const removeChannel = (idx) => {
    commitChannels(channels.filter((_, i) => i !== idx));
  };

  const moveChannel = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= channels.length) return;
    const next = [...channels];
    [next[idx], next[target]] = [next[target], next[idx]];
    commitChannels(next);
  };

  const addChannel = () => {
    commitChannels([...channels, { id: makeId(), name: '', source: '' }]);
  };

  const resetChannels = () => {
    onChange({ ...settings, customChannels: null });
  };

  const toggleSource = (id) => {
    const allIds = sources.map((s) => s.id);
    const current = settings.selectedSources == null ? allIds : settings.selectedSources;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...settings, selectedSources: next });
  };

  const isSourceOn = (id) => {
    const list = settings.selectedSources;
    if (list == null) return true;
    return list.includes(id);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <button className="settings-close" onClick={onClose}>×</button>
        <h2>📺 Multi TV · Ayarlar</h2>

        <section>
          <h3>Kanal Sayısı</h3>
          <div className="size-chips">
            {GRID_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className={`size-chip ${settings.gridSize === n ? 'active' : ''}`}
                onClick={() => onChange({ ...settings, gridSize: n })}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            İlk {settings.gridSize} kanal grid'e yerleşir. Sırayı aşağıdan değiştir.
          </div>
        </section>

        <section>
          <h3>Kanalları Değiştir</h3>
          <div className="channel-editor">
            {channels.map((c, idx) => {
              const parsed = parseChannelSource(c.source);
              const ok = parsed.type === 'channel' || parsed.type === 'video';
              const inGrid = idx < settings.gridSize;
              return (
                <div
                  className="channel-row"
                  key={c.id}
                  style={{ opacity: inGrid ? 1 : 0.45 }}
                >
                  <div className="ch-move">
                    <button
                      type="button"
                      onClick={() => moveChannel(idx, -1)}
                      disabled={idx === 0}
                      title="yukarı"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveChannel(idx, +1)}
                      disabled={idx === channels.length - 1}
                      title="aşağı"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    type="text"
                    className="ch-name"
                    placeholder="ad"
                    value={c.name}
                    onChange={(e) => updateChannel(idx, { name: e.target.value })}
                  />
                  <input
                    type="text"
                    className={`ch-source ${ok ? 'valid' : c.source ? 'invalid' : ''}`}
                    placeholder="channel ID, video ID veya YouTube URL"
                    value={c.source}
                    onChange={(e) => updateChannel(idx, { source: e.target.value })}
                    title={parsed.error || `${parsed.type}: ${parsed.value}`}
                  />
                  <button
                    type="button"
                    className="ch-del"
                    onClick={() => removeChannel(idx)}
                    title="sil"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <div className="channel-actions">
            <button type="button" onClick={addChannel}>+ Yeni Kanal Ekle</button>
            <button type="button" onClick={resetChannels} title="varsayılan listeyi geri yükle">
              ↺ Sıfırla
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
            Kabul: <code>UC…</code> channel ID, 11 karakter video ID veya tam YouTube URL.
            Soluk satırlar grid dışında. m3u8 desteği yakında.
          </div>
        </section>

        <section>
          <h3>RSS Kaynakları</h3>
          {sources.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>yükleniyor…</div>
          )}
          {sources.length > 0 && (
            <div className="source-actions">
              <button
                type="button"
                onClick={() => onChange({ ...settings, selectedSources: null })}
              >
                ✓ Hepsi
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...settings, selectedSources: [] })}
              >
                × Hiçbiri
              </button>
            </div>
          )}
          {sources.map((s) => (
            <label key={s.id}>
              <input
                type="checkbox"
                checked={isSourceOn(s.id)}
                onChange={() => toggleSource(s.id)}
              />
              {s.name}{' '}
              <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>· {s.category}</span>
            </label>
          ))}
        </section>

        <section>
          <h3>Borsa Sembolleri</h3>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
            v1'de varsayılan set: USD/TRY, EUR/TRY, ALTIN, BIST 100, S&amp;P 500, BRENT, BTC.
            Özelleştirme bir sonraki sürümde.
          </p>
        </section>

        <section>
          <h3>Sürüm</h3>
          <VersionTag />
        </section>
      </div>
    </div>
  );
}
