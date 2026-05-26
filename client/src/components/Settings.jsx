import { useEffect, useState } from 'react';
import { parseChannelSource } from '../utils/channelUrl.js';
import { THEMES } from '../themes.js';
import VersionTag from './VersionTag.jsx';

const GRID_OPTIONS = [4, 6, 9, 16, 18, 21, 25];

function makeId(prefix = 'ch') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeChannels(list) {
  return (list || []).map((c) => ({
    id: c.id || makeId('ch'),
    name: c.name || '',
    source: c.source || c.channelId || '',
  }));
}

function isValidUrl(s) {
  return /^https?:\/\/.+/i.test(String(s || '').trim());
}

export default function Settings({
  settings,
  sources,
  symbols,
  onChange,
  onSourcesChange,
  onSourcesReset,
  onSymbolsChange,
  onSymbolsReset,
  onClose,
}) {
  const [defaultChannels, setDefaultChannels] = useState([]);
  const [autostart, setAutostart] = useState(false);
  const [discoverUrl, setDiscoverUrl] = useState('');
  const [discoverState, setDiscoverState] = useState({ status: 'idle', feeds: [], error: null });

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((d) => setDefaultChannels(normalizeChannels(d)))
      .catch(() => {});
    window.electron?.getLoginItemSettings?.().then((v) => setAutostart(!!v));
  }, []);

  const toggleAutostart = async (next) => {
    setAutostart(next);
    await window.electron?.setLoginItemSettings?.(next);
  };

  // --- Channels ---
  const channels = settings.customChannels
    ? normalizeChannels(settings.customChannels)
    : defaultChannels;

  const commitChannels = (next) => onChange({ ...settings, customChannels: next });
  const updateChannel = (idx, patch) =>
    commitChannels(channels.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const removeChannel = (idx) => commitChannels(channels.filter((_, i) => i !== idx));
  const moveChannel = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= channels.length) return;
    const next = [...channels];
    [next[idx], next[target]] = [next[target], next[idx]];
    commitChannels(next);
  };
  const addChannel = () =>
    commitChannels([...channels, { id: makeId('ch'), name: '', source: '' }]);
  const resetChannels = () => onChange({ ...settings, customChannels: null });

  // --- Sources (editor + breaking/feed/notify toggles) ---
  const updateSource = (idx, patch) =>
    onSourcesChange(sources.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const removeSource = (idx) => onSourcesChange(sources.filter((_, i) => i !== idx));
  const moveSource = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= sources.length) return;
    const next = [...sources];
    [next[idx], next[target]] = [next[target], next[idx]];
    onSourcesChange(next);
  };
  const addSource = (preset = {}) => {
    onSourcesChange([
      ...sources,
      {
        id: makeId('src'),
        name: preset.name || '',
        url: preset.url || '',
        breaking: false,
      },
    ]);
  };

  // Feed filter (NewsFeed gösterimi)
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

  // Notify filter (Electron native notification)
  const defaultNotifyIds = sources.filter((s) => s.breaking).map((s) => s.id);
  const toggleNotify = (id) => {
    const current = settings.notifySources == null ? defaultNotifyIds : settings.notifySources;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...settings, notifySources: next });
  };
  const isNotifyOn = (id) => {
    const list = settings.notifySources;
    if (list == null) return defaultNotifyIds.includes(id);
    return list.includes(id);
  };

  // --- Auto-discover ---
  const handleDiscover = async () => {
    const u = discoverUrl.trim();
    if (!isValidUrl(u)) {
      setDiscoverState({ status: 'error', feeds: [], error: 'http(s)://... bekleniyor' });
      return;
    }
    setDiscoverState({ status: 'loading', feeds: [], error: null });
    try {
      const r = await fetch(`/api/discover?url=${encodeURIComponent(u)}`);
      const data = await r.json();
      if (!r.ok) {
        setDiscoverState({ status: 'error', feeds: [], error: data.error || `HTTP ${r.status}` });
        return;
      }
      setDiscoverState({ status: 'done', feeds: data.feeds || [], error: null });
    } catch (err) {
      setDiscoverState({ status: 'error', feeds: [], error: err.message });
    }
  };

  const addFromDiscover = (feed) => {
    let host = '';
    try { host = new URL(feed.url).hostname.replace(/^www\./, ''); } catch { /* skip */ }
    addSource({ name: feed.title || host || '', url: feed.url });
    setDiscoverState({ status: 'idle', feeds: [], error: null });
    setDiscoverUrl('');
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
                    <button type="button" onClick={() => moveChannel(idx, -1)} disabled={idx === 0} title="yukarı">▲</button>
                    <button type="button" onClick={() => moveChannel(idx, +1)} disabled={idx === channels.length - 1} title="aşağı">▼</button>
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
                  <button type="button" className="ch-del" onClick={() => removeChannel(idx)} title="sil">×</button>
                </div>
              );
            })}
          </div>
          <div className="channel-actions">
            <button type="button" onClick={addChannel}>+ Yeni Kanal Ekle</button>
            <button type="button" onClick={resetChannels} title="varsayılan listeyi geri yükle">↺ Sıfırla</button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
            Kabul: <code>UC…</code> channel ID, 11 karakter video ID, YouTube URL veya
            doğrudan <code>.m3u8</code> HLS stream URL'i. Soluk satırlar grid dışında.
          </div>
        </section>

        <section>
          <h3>RSS Kaynakları</h3>

          <div className="source-discover">
            <input
              type="text"
              placeholder="Site URL'i (örn. https://www.bbc.com) → otomatik feed bul"
              value={discoverUrl}
              onChange={(e) => setDiscoverUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDiscover(); }}
            />
            <button
              type="button"
              onClick={handleDiscover}
              disabled={discoverState.status === 'loading'}
            >
              {discoverState.status === 'loading' ? '…' : 'Bul'}
            </button>
          </div>
          {discoverState.status === 'done' && discoverState.feeds.length === 0 && (
            <div className="source-discover-msg">⚠ Feed bulunamadı</div>
          )}
          {discoverState.status === 'error' && (
            <div className="source-discover-msg error">⚠ {discoverState.error}</div>
          )}
          {discoverState.status === 'done' && discoverState.feeds.length > 0 && (
            <div className="source-discover-results">
              {discoverState.feeds.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  className="source-discover-feed"
                  onClick={() => addFromDiscover(f)}
                  title={f.url}
                >
                  + {f.title || f.url}
                </button>
              ))}
            </div>
          )}

          <div className="source-editor">
            <div className="source-row source-row-header">
              <span style={{ width: 32 }}></span>
              <span title="son dakika (üst şeritte göster)" style={{ width: 24, textAlign: 'center' }}>🔴</span>
              <span style={{ flex: '1 1 90px' }}>ad</span>
              <span style={{ flex: '2 1 180px' }}>RSS URL</span>
              <span title="feed'de göster" style={{ width: 22, textAlign: 'center' }}>✓</span>
              <span title="bildirim al" style={{ width: 22, textAlign: 'center' }}>🔔</span>
              <span style={{ width: 22 }}></span>
            </div>
            {sources.length === 0 && (
              <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: '4px 0' }}>
                yükleniyor…
              </div>
            )}
            {sources.map((s, idx) => {
              const urlOk = isValidUrl(s.url);
              return (
                <div className="source-row" key={s.id}>
                  <div className="ch-move">
                    <button type="button" onClick={() => moveSource(idx, -1)} disabled={idx === 0} title="yukarı">▲</button>
                    <button type="button" onClick={() => moveSource(idx, +1)} disabled={idx === sources.length - 1} title="aşağı">▼</button>
                  </div>
                  <button
                    type="button"
                    className={`breaking-toggle ${s.breaking ? 'on' : ''}`}
                    onClick={() => updateSource(idx, { breaking: !s.breaking })}
                    title="son dakika (marquee'de göster)"
                  >
                    🔴
                  </button>
                  <input
                    type="text"
                    className="src-name"
                    placeholder="ad"
                    value={s.name}
                    onChange={(e) => updateSource(idx, { name: e.target.value })}
                  />
                  <input
                    type="text"
                    className={`src-url ${urlOk ? 'valid' : s.url ? 'invalid' : ''}`}
                    placeholder="https://…/rss"
                    value={s.url}
                    onChange={(e) => updateSource(idx, { url: e.target.value })}
                  />
                  <input
                    type="checkbox"
                    className="src-check"
                    checked={isSourceOn(s.id)}
                    onChange={() => toggleSource(s.id)}
                    title="feed'de göster"
                  />
                  <input
                    type="checkbox"
                    className="src-check"
                    checked={isNotifyOn(s.id)}
                    onChange={() => toggleNotify(s.id)}
                    title="bildirim al"
                  />
                  <button type="button" className="ch-del" onClick={() => removeSource(idx)} title="sil">×</button>
                </div>
              );
            })}
          </div>
          <div className="channel-actions">
            <button type="button" onClick={() => addSource()}>+ Yeni Kaynak Ekle</button>
            <button type="button" onClick={onSourcesReset} title="varsayılan listeyi geri yükle">↺ Sıfırla</button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
            🔴 işaretliler üst şeritte "son dakika" olarak akar. ✓ = haber feed'inde görünür.
            🔔 = işletim sistemi bildirimi gelir. Bildirim boşsa varsayılan 🔴 set kullanılır.
          </div>
        </section>

        <section>
          <h3>Borsa Sembolleri</h3>
          <div className="source-editor">
            <div className="source-row source-row-header">
              <span style={{ width: 32 }}></span>
              <span style={{ flex: '1 1 90px' }}>etiket</span>
              <span style={{ flex: '2 1 180px' }}>Yahoo sembolü</span>
              <span style={{ width: 22 }}></span>
            </div>
            {symbols.length === 0 && (
              <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: '4px 0' }}>
                yükleniyor…
              </div>
            )}
            {symbols.map((s, idx) => (
              <div className="source-row" key={`${s.symbol}-${idx}`}>
                <div className="ch-move">
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === 0) return;
                      const next = [...symbols];
                      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
                      onSymbolsChange(next);
                    }}
                    disabled={idx === 0}
                    title="yukarı"
                  >▲</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === symbols.length - 1) return;
                      const next = [...symbols];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      onSymbolsChange(next);
                    }}
                    disabled={idx === symbols.length - 1}
                    title="aşağı"
                  >▼</button>
                </div>
                <input
                  type="text"
                  className="src-name"
                  placeholder="etiket (örn. USD/TRY)"
                  value={s.label}
                  onChange={(e) =>
                    onSymbolsChange(symbols.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                  }
                />
                <input
                  type="text"
                  className={`src-url ${s.symbol ? 'valid' : 'invalid'}`}
                  placeholder="USDTRY=X, ^GSPC, BTC-USD…"
                  value={s.symbol}
                  onChange={(e) =>
                    onSymbolsChange(symbols.map((x, i) => (i === idx ? { ...x, symbol: e.target.value } : x)))
                  }
                />
                <button
                  type="button"
                  className="ch-del"
                  onClick={() => onSymbolsChange(symbols.filter((_, i) => i !== idx))}
                  title="sil"
                >×</button>
              </div>
            ))}
          </div>
          <div className="channel-actions">
            <button
              type="button"
              onClick={() => onSymbolsChange([...symbols, { label: '', symbol: '' }])}
            >+ Yeni Sembol Ekle</button>
            <button
              type="button"
              onClick={onSymbolsReset}
              title="varsayılan listeyi geri yükle"
            >↺ Sıfırla</button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
            Yahoo Finance sembol formatı: pariteler <code>USDTRY=X</code>, endeksler{' '}
            <code>^GSPC</code> / <code>XU100.IS</code>, futures <code>GC=F</code>, kripto{' '}
            <code>BTC-USD</code>. <a
              href="https://finance.yahoo.com/lookup"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >finance.yahoo.com/lookup</a> sembol aramak için.
          </div>
        </section>

        <section>
          <h3>🎨 Görünüm</h3>
          <div className="theme-chips">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-chip ${settings.theme === t.id ? 'active' : ''}`}
                style={{ '--theme-accent': t.vars['--accent'] }}
                onClick={() => onChange({ ...settings, theme: t.id, customAccent: null })}
                title={t.name}
              >
                <span className="theme-chip-dot" />
                <span className="theme-chip-name">{t.name}</span>
              </button>
            ))}
          </div>

          <div className="color-picker-row">
            <span className="color-picker-label">Vurgu rengi:</span>
            <input
              type="color"
              className="color-picker"
              value={settings.customAccent || THEMES.find((t) => t.id === settings.theme)?.vars['--accent'] || '#ffb800'}
              onChange={(e) => onChange({ ...settings, customAccent: e.target.value })}
              title="vurgu rengini özelleştir"
            />
            <code className="color-picker-value">
              {settings.customAccent || THEMES.find((t) => t.id === settings.theme)?.vars['--accent']}
            </code>
            {settings.customAccent && (
              <button
                type="button"
                className="color-picker-reset"
                onClick={() => onChange({ ...settings, customAccent: null })}
                title="preset rengine dön"
              >
                ↺ Sıfırla
              </button>
            )}
          </div>

          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
            Preset değiştirince özel renk sıfırlanır. Font ve marquee/ticker ince
            ayarları sonraki sürümlerde.
          </div>
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
