const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desk', {
  moveBy: (dx, dy) => ipcRenderer.send('move-by', dx, dy),
  ignoreMouse: on => ipcRenderer.send('ignore-mouse', on),
  resize: s => ipcRenderer.send('resize', s),
  hide: () => ipcRenderer.send('hide'),
  onCmd: fn => ipcRenderer.on('cmd', (_e, c) => fn(c))
});
