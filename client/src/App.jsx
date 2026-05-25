import { useEffect, useState } from 'react';
import MultiTV from './components/MultiTV.jsx';
import NewsFeed from './components/NewsFeed.jsx';
import BreakingMarquee from './components/BreakingMarquee.jsx';
import Ticker from './components/Ticker.jsx';
import Settings from './components/Settings.jsx';

const SETTINGS_KEY = 'rss-dashboard-settings';

const defaultSettings = {
  gridSize: 9,
  selectedSources: null,   // null = implicit "hepsi"; array = tam olarak bunlar; [] = hiçbiri
  notifySources: null,     // aynı semantik — null = default breaking set; [] = hiç bildirim
  selectedSymbols: null,
  customChannels: null,
  customSources: null,     // null = backend default; array = kullanıcı override
  keyword: '',
  closeBehavior: 'tray',   // 'tray' = × tepsiye iner; 'quit' = × tamamen çıkış
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const stored = JSON.parse(raw);
    // Migration: eski semantikte [] = "hepsi" idi → yeni null
    if (Array.isArray(stored.selectedSources) && stored.selectedSources.length === 0) {
      stored.selectedSources = null;
    }
    if (Array.isArray(stored.selectedSymbols) && stored.selectedSymbols.length === 0) {
      stored.selectedSymbols = null;
    }
    return { ...defaultSettings, ...stored };
  } catch {
    return defaultSettings;
  }
}

async function pushSourcesToBackend(arr) {
  try {
    await fetch('/api/sources/runtime', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arr),
    });
  } catch {
    /* offline — sonra retry'a gerek yok, sayfa yenilenince tekrar push'lanır */
  }
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [sources, setSources] = useState([]);

  // Mount: customSources varsa backend'e push + mirror; yoksa backend default'unu çek
  useEffect(() => {
    if (Array.isArray(settings.customSources) && settings.customSources.length > 0) {
      pushSourcesToBackend(settings.customSources).then(() =>
        setSources(settings.customSources)
      );
    } else {
      fetch('/api/sources').then((r) => r.json()).then(setSources).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.electron?.setNotifySources?.(settings.notifySources);
    window.electron?.setCloseBehavior?.(settings.closeBehavior);
  }, [settings]);

  const handleSourcesChange = (next) => {
    setSources(next);
    setSettings((s) => ({ ...s, customSources: next }));
    pushSourcesToBackend(next);
  };

  const handleSourcesReset = async () => {
    setSettings((s) => ({ ...s, customSources: null }));
    try {
      await fetch('/api/sources/runtime', { method: 'DELETE' });
      const r = await fetch('/api/sources');
      const data = await r.json();
      setSources(data);
    } catch {
      /* ignore */
    }
  };

  const breakingIds = sources.filter((s) => s.breaking).map((s) => s.id);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">📡 RSS DASHBOARD</div>
        <button className="settings-btn" onClick={() => setShowSettings((v) => !v)}>
          ⚙ AYARLAR
        </button>
      </header>
      <BreakingMarquee breakingSources={breakingIds} />
      <main className="main">
        <section className="left">
          <MultiTV
            gridSize={settings.gridSize}
            customChannels={settings.customChannels}
          />
        </section>
        <section className="right">
          <NewsFeed
            selectedSources={settings.selectedSources}
            keyword={settings.keyword}
            onKeywordChange={(k) => setSettings({ ...settings, keyword: k })}
          />
        </section>
      </main>
      <Ticker selectedSymbols={settings.selectedSymbols} />
      {showSettings && (
        <Settings
          settings={settings}
          sources={sources}
          onChange={setSettings}
          onSourcesChange={handleSourcesChange}
          onSourcesReset={handleSourcesReset}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
