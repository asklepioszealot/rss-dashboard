// electron-updater wrapper — yarı-otomatik güncelleme.
// İlk check 30s sonra, sonra her saat. Download kullanıcı tetikler.
// Renderer'a 'updater:status' event'i ile durum bildirilir.
const { autoUpdater } = require('electron-updater');
const { app } = require('electron');

autoUpdater.autoDownload = false; // kullanıcı "İndir" butonuna basana kadar bekle
autoUpdater.autoInstallOnAppQuit = true;

const FIRST_CHECK_DELAY_MS = 30_000;
const PERIODIC_CHECK_MS = 60 * 60 * 1000; // saatte bir

function noop() {
  return Promise.resolve();
}

function setupUpdater(getMainWindow) {
  // Dev modu (unpackaged): autoUpdater zaten ENOENT atar, kuru no-op döndür
  if (!app.isPackaged) {
    return {
      isActive: false,
      checkForUpdates: noop,
      downloadUpdate: noop,
      quitAndInstall: () => {},
    };
  }

  const send = (payload) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('updater:status', payload);
    }
  };

  autoUpdater.on('checking-for-update', () => send({ status: 'checking' }));
  autoUpdater.on('update-available', (info) =>
    send({ status: 'available', version: info?.version })
  );
  autoUpdater.on('update-not-available', () => send({ status: 'not-available' }));
  autoUpdater.on('download-progress', (p) =>
    send({ status: 'downloading', percent: p?.percent ?? 0 })
  );
  autoUpdater.on('update-downloaded', (info) =>
    send({ status: 'downloaded', version: info?.version })
  );
  autoUpdater.on('error', (err) =>
    send({ status: 'error', message: err?.message || String(err) })
  );

  // İlk check: backend ısınsın, renderer hazır olsun
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, FIRST_CHECK_DELAY_MS);

  // Saatte bir tekrar
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, PERIODIC_CHECK_MS);

  return {
    isActive: true,
    checkForUpdates: () => autoUpdater.checkForUpdates().catch(() => {}),
    downloadUpdate: () => autoUpdater.downloadUpdate().catch(() => {}),
    quitAndInstall: () => autoUpdater.quitAndInstall(),
  };
}

module.exports = { setupUpdater };
