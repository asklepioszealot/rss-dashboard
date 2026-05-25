// Renderer'a sınırlı API expose etmek için preload bridge.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,
  quit: () => ipcRenderer.invoke('app:quit'),
  setNotifySources: (ids) => ipcRenderer.invoke('notify:set-sources', ids),
});
