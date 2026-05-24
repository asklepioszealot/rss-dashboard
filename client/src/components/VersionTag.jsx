import { useState } from 'react';

const CURRENT_VERSION = '0.1.1';
const REPO = 'asklepioszealot/rss-dashboard';

function parseVer(v) {
  return String(v || '').replace(/^v/, '').split('.').map((n) => Number(n) || 0);
}

function isNewer(remote, local) {
  const a = parseVer(remote);
  const b = parseVer(local);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export default function VersionTag() {
  const [state, setState] = useState({ status: 'idle', latest: null, error: null });

  const check = async () => {
    setState({ status: 'checking', latest: null, error: null });
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
      if (r.status === 404) {
        setState({ status: 'no-release', latest: null, error: null });
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const tag = String(data.tag_name || '').replace(/^v/, '');
      setState({ status: 'ok', latest: tag, error: null });
    } catch (err) {
      setState({ status: 'error', latest: null, error: err.message });
    }
  };

  const updateAvailable = state.status === 'ok' && isNewer(state.latest, CURRENT_VERSION);

  return (
    <div className="version-tag">
      <div className="version-row">
        Kurulu: <strong>v{CURRENT_VERSION}</strong>
        {state.status === 'ok' && <> · GitHub: v{state.latest}</>}
        {state.status === 'no-release' && <> · GitHub'da henüz release yok</>}
      </div>
      {updateAvailable && (
        <a
          href={`https://github.com/${REPO}/releases/latest`}
          target="_blank"
          rel="noopener noreferrer"
          className="version-update"
        >
          ⬇ Yeni sürüm var (v{state.latest}) — indir
        </a>
      )}
      <div className="version-actions">
        <button type="button" onClick={check} disabled={state.status === 'checking'}>
          {state.status === 'checking' ? 'kontrol ediliyor…' : '🔄 Güncellemeyi kontrol et'}
        </button>
        <a
          href={`https://github.com/${REPO}`}
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
    </div>
  );
}
