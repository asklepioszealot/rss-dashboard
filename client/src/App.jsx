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
  selectedSymbols: null,
  customChannels: null,
  keyword: '',
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

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">📡 RSS DASHBOARD</div>
        <button className="settings-btn" onClick={() => setShowSettings((v) => !v)}>
          ⚙ AYARLAR
        </button>
      </header>
      <BreakingMarquee />
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
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
