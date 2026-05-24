// Renderer'a sınırlı API expose etmek için preload bridge.
// Şimdilik sadece platform bilgisi; ileride bildirim/IPC eklenecek.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,
});
