import { useEffect, useState } from 'react';
import MultiTV from './components/MultiTV.jsx';
import NewsFeed from './components/NewsFeed.jsx';
import BreakingMarquee from './components/BreakingMarquee.jsx';
import Ticker from './components/Ticker.jsx';
import Settings from './components/Settings.jsx';
import { applyTheme, DEFAULT_THEME_ID } from './themes.js';

const SETTINGS_KEY = 'rss-dashboard-settings';

const defaultSettings = {
  gridSize: 9,
  selectedSources: null,   // null = implicit "hepsi"; array = tam olarak bunlar; [] = hiçbiri
  notifySources: null,     // aynı semantik — null = default breaking set; [] = hiç bildirim
  customChannels: null,
  customSources: null,     // null = backend default; array = kullanıcı override
  customSymbols: null,     // borsa sembolleri — null = backend default; array = override
  keyword: '',
  closeBehavior: 'tray',   // 'tray' = × tepsiye iner; 'quit' = × tamamen çıkış
  theme: DEFAULT_THEME_ID, // 'classic' | 'broadcaster' | ... — themes.js
  customAccent: null,      // null = preset accent; "#hex" = override
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
    // Eski 'selectedSymbols' alanı kaldırıldı; varsa yok say (yeni: customSymbols)
    delete stored.selectedSymbols;
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
  const [symbols, setSymbols] = useState([]);

  // Mount: customSources varsa backend'e push + mirror; yoksa backend default'unu çek
  useEffect(() => {
    if (Array.isArray(settings.customSources) && settings.customSources.length > 0) {
      pushSourcesToBackend(settings.customSources).then(() =>
        setSources(settings.customSources)
      );
    } else {
      fetch('/api/sources').then((r) => r.json()).then(setSources).catch(() => {});
    }

    // Symbols: customSymbols varsa kullan, yoksa backend default'unu çek
    if (Array.isArray(settings.customSymbols) && settings.customSymbols.length > 0) {
      setSymbols(settings.customSymbols);
    } else {
      fetch('/api/finance/defaults').then((r) => r.json()).then(setSymbols).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.electron?.setNotifySources?.(settings.notifySources);
    window.electron?.setCloseBehavior?.(settings.closeBehavior);
    applyTheme(settings.theme, settings.customAccent);
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

  const handleSymbolsChange = (next) => {
    setSymbols(next);
    setSettings((s) => ({ ...s, customSymbols: next }));
  };

  const handleSymbolsReset = async () => {
    setSettings((s) => ({ ...s, customSymbols: null }));
    try {
      const r = await fetch('/api/finance/defaults');
      const data = await r.json();
      setSymbols(data);
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
      <Ticker symbols={symbols} />
      {showSettings && (
        <Settings
          settings={settings}
          sources={sources}
          symbols={symbols}
          onChange={setSettings}
          onSourcesChange={handleSourcesChange}
          onSourcesReset={handleSourcesReset}
          onSymbolsChange={handleSymbolsChange}
          onSymbolsReset={handleSymbolsReset}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
