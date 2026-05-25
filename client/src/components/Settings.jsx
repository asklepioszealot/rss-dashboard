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
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((d) => setDefaultChannels(normalize(d)))
      .catch(() => {});
    fetch('/api/sources').then((r) => r.json()).then(setSources).catch(() => {});
    window.electron?.getLoginItemSettings?.().then((v) => setAutostart(!!v));
  }, []);

  const toggleAutostart = async (next) => {
    setAutostart(next);
    await window.electron?.setLoginItemSettings?.(next);
  };

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

  const DEFAULT_NOTIFY = ['ntv', 'cumhuriyet', 'haberturk', 'cnnturk'];

  const toggleNotify = (id) => {
    const current =
      settings.notifySources == null ? DEFAULT_NOTIFY : settings.notifySources;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...settings, notifySources: next });
  };

  const isNotifyOn = (id) => {
    const list = settings.notifySources;
    if (list == null) return DEFAULT_NOTIFY.includes(id);
    return list.includes(id);
  };

  const quitApp = () => {
    if (!window.confirm('Uygulama tamamen kapansın mı?')) return;
    window.electron?.quit?.();
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
              const ok = parsed.type === 'channel' || parsed.type === 'video' || parsed.type === 'hls';
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
            Kabul: <code>UC…</code> channel ID, 11 karakter video ID, YouTube URL veya
            doğrudan <code>.m3u8</code> HLS stream URL'i. Soluk satırlar grid dışında.
          </div>
        </section>

        <section>
          <h3>RSS Kaynakları</h3>
          {sources.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>yükleniyor…</div>
          )}
          {sources.length > 0 && (
            <>
              <div className="source-actions">
                <span className="source-actions-label">Feed:</span>
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
              <div className="source-actions">
                <span className="source-actions-label">🔔 Bildirim:</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, notifySources: sources.map((s) => s.id) })}
                >
                  ✓ Hepsi
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, notifySources: [] })}
                >
                  × Hiçbiri
                </button>
              </div>
            </>
          )}
          {sources.map((s) => (
            <div key={s.id} className="source-row">
              <label className="source-feed">
                <input
                  type="checkbox"
                  checked={isSourceOn(s.id)}
                  onChange={() => toggleSource(s.id)}
                />
                {s.name}{' '}
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>· {s.category}</span>
              </label>
              <label className="source-notify" title="bu kaynaktan bildirim al">
                <input
                  type="checkbox"
                  checked={isNotifyOn(s.id)}
                  onChange={() => toggleNotify(s.id)}
                />
                🔔
              </label>
            </div>
          ))}
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
            Bildirim sütunu boş bırakılırsa varsayılan son dakika kaynakları kullanılır.
            Hepsini kapatırsanız bildirim almazsınız.
          </div>
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

        {window.electron?.isElectron && (
          <section>
            <h3>Uygulama</h3>
            <label className="app-toggle">
              <input
                type="checkbox"
                checked={autostart}
                onChange={(e) => toggleAutostart(e.target.checked)}
              />
              Windows başlangıcında otomatik aç
              <span className="app-toggle-hint">(uygulama gizli başlar, tray'de durur)</span>
            </label>
            <label className="app-toggle">
              <input
                type="checkbox"
                checked={settings.closeBehavior !== 'quit'}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    closeBehavior: e.target.checked ? 'tray' : 'quit',
                  })
                }
              />
              Kapatma (×) tuşunda tepsiye in
              <span className="app-toggle-hint">(kapalıysa × = tamamen çıkış)</span>
            </label>
            <button type="button" className="danger-btn" onClick={quitApp}>
              🚪 Uygulamayı tamamen kapat
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
