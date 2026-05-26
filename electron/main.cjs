// Electron main process — CommonJS (server ESM'ı dynamic import ile yükler)
const { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain } = require('electron');
const path = require('node:path');
const { startNotificationPoller, setNotifySources } = require('./notifications.cjs');
const { setupUpdater } = require('./updater.cjs');

const SERVER_PORT = 3737;
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

let mainWindow = null;
let tray = null;
let serverInstance = null;
let isQuitting = false;
let closeBehavior = 'tray'; // 'tray' | 'quit'
let refreshTrayMenu = null;

// Single-instance kilidi — çift açılışı engelle (autostart + manuel açış çakışması)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

async function startBackend() {
  // server/index.js ESM; dynamic import ile yükle
  const serverUrl = require('node:url').pathToFileURL(
    path.join(__dirname, '..', 'server', 'index.js')
  ).href;
  const { startServer } = await import(serverUrl);

  // Production: Vite build çıktısını da Express serve etsin
  const staticPath = isDev
    ? null
    : path.join(__dirname, '..', 'client', 'dist');

  serverInstance = await startServer(SERVER_PORT, { serveStatic: staticPath });
  console.log(`[electron] backend ready on :${SERVER_PORT} (dev=${isDev})`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // X tuşu davranışı: closeBehavior='tray' → tepsiye in; 'quit' → tamamen çık
  mainWindow.on('close', (e) => {
    if (isQuitting) return;
    if (closeBehavior === 'tray') {
      e.preventDefault();
      mainWindow.hide();
    } else {
      // 'quit' → app'i de düşür; aksi halde tray ekranda kalır,
      // tıklanınca destroyed mainWindow'a erişip hata atar
      isQuitting = true;
      app.quit();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Dış linkler tarayıcıda açılsın (haber link tıklaması)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const url = isDev
    ? 'http://localhost:5173'
    : `http://localhost:${SERVER_PORT}`;
  mainWindow.loadURL(url);
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    // Asset yoksa fallback — boş ama tray görünür kalır
    icon = nativeImage.createEmpty();
  }
  tray = new Tray(icon);
  tray.setToolTip('RSS Dashboard');

  refreshTrayMenu = () => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Aç / Göster',
        click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: 'Gizle',
        click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          mainWindow.hide();
        },
      },
      { type: 'separator' },
      {
        label: 'Windows başlangıcında çalıştır',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => {
          app.setLoginItemSettings({
            openAtLogin: item.checked,
            path: process.execPath,
            args: ['--hidden'], // başlangıçta gizli aç
          });
          refreshTrayMenu(); // checked state'i yansıt
        },
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(menu);
  };

  refreshTrayMenu();

  // Sol tık: pencere toggle (mainWindow destroyed ise no-op)
  tray.on('click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

async function bootstrap() {
  try {
    await startBackend();
  } catch (err) {
    console.error('[electron] backend boot failed:', err);
  }

  createWindow();
  createTray();
  startNotificationPoller(SERVER_PORT, () => mainWindow);

  ipcMain.handle('app:quit', () => {
    isQuitting = true;
    app.quit();
  });
  ipcMain.handle('notify:set-sources', (_e, ids) => {
    setNotifySources(ids);
  });
  ipcMain.handle('app:get-login', () => app.getLoginItemSettings().openAtLogin);
  ipcMain.handle('app:set-login', (_e, open) => {
    app.setLoginItemSettings({
      openAtLogin: !!open,
      path: process.execPath,
      args: ['--hidden'],
    });
    refreshTrayMenu?.(); // tray checkbox state'i de senkron
  });
  ipcMain.handle('app:set-close-behavior', (_e, mode) => {
    closeBehavior = mode === 'quit' ? 'quit' : 'tray';
  });

  // electron-updater — yarı-otomatik
  const updater = setupUpdater(() => mainWindow);
  ipcMain.handle('updater:check', () => updater.checkForUpdates());
  ipcMain.handle('updater:download', () => updater.downloadUpdate());
  ipcMain.handle('updater:quit-install', () => {
    isQuitting = true;
    updater.quitAndInstall();
  });
  ipcMain.handle('updater:is-active', () => updater.isActive);

  // --hidden flag ile başladıysa pencereyi gösterme (autostart için)
  if (process.argv.includes('--hidden')) {
    mainWindow.hide();
  }
}

app.whenReady().then(bootstrap);

// Tüm pencereler kapansa bile uygulamayı yaşat (tray'de durur)
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
    // sadece tray varsa yaşat; tray yoksa quit
    if (!tray) app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  try {
    serverInstance?.close();
  } catch {
    /* ignore */
  }
  try {
    tray?.destroy();
    tray = null;
  } catch {
    /* ignore */
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
