import { useEffect, useState } from 'react';
import pkg from '../../package.json';

const CURRENT_VERSION = pkg.version;
const REPO_URL = 'https://github.com/asklepioszealot/rss-dashboard';

export default function VersionTag() {
  const [state, setState] = useState({ status: 'idle', version: null, percent: 0, error: null });
  const [updaterActive, setUpdaterActive] = useState(false);

  useEffect(() => {
    window.electron?.isUpdaterActive?.().then((v) => setUpdaterActive(!!v));
    const off = window.electron?.onUpdateStatus?.((payload) => {
      setState((prev) => ({ ...prev, ...payload, error: payload.message || null }));
    });
    return () => { off?.(); };
  }, []);

  const check = () => {
    setState({ status: 'checking', version: null, percent: 0, error: null });
    window.electron?.checkForUpdates?.();
  };
  const download = () => window.electron?.downloadUpdate?.();
  const install = () => window.electron?.quitAndInstall?.();

  const isAvailable = state.status === 'available';
  const isDownloading = state.status === 'downloading';
  const isDownloaded = state.status === 'downloaded';
  const isChecking = state.status === 'checking';

  return (
    <div className="version-tag">
      <div className="version-row">
        Kurulu: <strong>v{CURRENT_VERSION}</strong>
        {isAvailable && <> · Yeni: <strong>v{state.version}</strong></>}
        {isDownloaded && <> · İndirildi: <strong>v{state.version}</strong></>}
        {state.status === 'not-available' && <> · En son sürüm</>}
      </div>

      {isAvailable && (
        <button type="button" className="version-action primary" onClick={download}>
          ⬇ İndir ve Yükle (v{state.version})
        </button>
      )}

      {isDownloading && (
        <div className="version-progress">
          <div className="version-progress-bar" style={{ width: `${state.percent}%` }} />
          <span className="version-progress-label">
            İndiriliyor… {Math.round(state.percent)}%
          </span>
        </div>
      )}

      {isDownloaded && (
        <button type="button" className="version-action primary" onClick={install}>
          🔄 Yeniden Başlat ve Kur
        </button>
      )}

      <div className="version-actions">
        <button
          type="button"
          onClick={check}
          disabled={isChecking || isDownloading}
        >
          {isChecking ? 'kontrol ediliyor…' : '🔄 Güncellemeyi kontrol et'}
        </button>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="version-link"
        >
          GitHub →
        </a>
      </div>

      {state.status === 'error' && (
        <div className="version-error">⚠ {state.error}</div>
      )}

      {!updaterActive && window.electron?.isElectron && (
        <div className="version-note">
          Geliştirme modunda otomatik güncelleme devre dışı.
        </div>
      )}

      <div className="version-credit">by <strong>Ahmet Kara</strong></div>
    </div>
  );
}
