// Native Windows bildirim — Electron main process'inde polling yapar,
// son dakika kaynaklarında yeni item tespit edince Notification atar.
const { Notification, shell } = require('electron');

const BREAKING_SOURCES = 'ntv,cumhuriyet,haberturk,cnnturk';
const POLL_MS = 60_000;
const MAX_NOTIFY_PER_POLL = 3;
const GUID_HISTORY_LIMIT = 200;

let knownGuids = new Set();
let firstPoll = true;
let timer = null;

async function pollOnce(port, getMainWindow) {
  try {
    const r = await fetch(
      `http://localhost:${port}/api/rss?sources=${BREAKING_SOURCES}`
    );
    if (!r.ok) return;
    const data = await r.json();
    const items = (data.items || []).slice(0, 15);

    // İlk poll'da hiçbir bildirim atma — baseline kur
    if (firstPoll) {
      items.forEach((it) => knownGuids.add(it.id));
      firstPoll = false;
      console.log(`[notifications] baseline: ${knownGuids.size} item`);
      return;
    }

    const newItems = items.filter((it) => !knownGuids.has(it.id));
    newItems.forEach((it) => knownGuids.add(it.id));

    if (newItems.length === 0) return;
    console.log(`[notifications] ${newItems.length} new item(s)`);

    newItems.slice(0, MAX_NOTIFY_PER_POLL).forEach((it) => {
      if (!Notification.isSupported()) return;
      const n = new Notification({
        title: `🔴 ${it.sourceName || 'SON DAKİKA'}`,
        body: it.title || '',
        silent: false,
        urgency: 'critical',
      });
      n.on('click', () => {
        const win = getMainWindow();
        if (it.link) {
          shell.openExternal(it.link);
        } else if (win) {
          win.show();
          win.focus();
        }
      });
      n.show();
    });

    // History trim — Set sonsuz büyümesin
    if (knownGuids.size > GUID_HISTORY_LIMIT) {
      const arr = [...knownGuids];
      knownGuids = new Set(arr.slice(-Math.floor(GUID_HISTORY_LIMIT * 0.75)));
    }
  } catch (err) {
    console.warn('[notifications] poll failed:', err.message);
  }
}

function startNotificationPoller(port, getMainWindow) {
  if (timer) return;
  // İlk poll'u biraz geciktir — backend ısınsın
  setTimeout(() => pollOnce(port, getMainWindow), 5_000);
  timer = setInterval(() => pollOnce(port, getMainWindow), POLL_MS);
  console.log(`[notifications] poller started (${POLL_MS / 1000}s interval)`);
}

function stopNotificationPoller() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startNotificationPoller, stopNotificationPoller };
