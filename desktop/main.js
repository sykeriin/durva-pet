const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');

let win, tray, scale = 3;
const dims = s => ({ w: Math.max(300, 32 * s + 190), h: 48 * s + 210 });

function create() {
  const wa = screen.getPrimaryDisplay().workArea, d = dims(scale);
  win = new BrowserWindow({
    width: d.w, height: d.h, x: wa.x + wa.width - d.w - 40, y: wa.y + wa.height - d.h,
    transparent: true, frame: false, resizable: false, hasShadow: false, alwaysOnTop: true,
    skipTaskbar: true, focusable: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'app/index.html'));
  win.once('ready-to-show', () => win.show());
  win.setIgnoreMouseEvents(true, { forward: true });
}

function clamp(b) {
  const wa = screen.getDisplayMatching(b).workArea;
  b.x = Math.max(wa.x - b.width / 2 + 60, Math.min(wa.x + wa.width - b.width / 2 - 60, b.x));
  b.y = Math.max(wa.y - 20, Math.min(wa.y + wa.height - b.height + 8, b.y));
  return b;
}

app.whenReady().then(() => {
  create();
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'app/icon.png')).resize({ width: 24, height: 24 }));
  tray.setToolTip('Durva Pet');
  const send = (ch, ...a) => win && win.webContents.send(ch, ...a);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show / hide', click: () => (win.isVisible() ? win.hide() : win.show()) },
    { label: 'Start pomodoro (25 / 5)', click: () => { win.show(); send('cmd', { name: 'timer', kind: 'pomodoro', minutes: 25 }); } },
    { label: 'Stopwatch', click: () => { win.show(); send('cmd', { name: 'timer', kind: 'stopwatch', minutes: 0 }); } },
    { label: 'Stop timer', click: () => send('cmd', { name: 'stop' }) },
    { type: 'separator' },
    ...[['Lock in!', 'lockin'], ['Chai', 'tea'], ['Coffee', 'coffee'], ['Water', 'water'], ['Flirt', 'flirt'], ['Steal a line', 'steal'], ['Spidey mode', 'spider'], ['Hang around', 'hang'], ['Look away', 'lookaway'], ['Step out', 'offscreen'], ['Dance', 'dance']]
      .map(([label, act]) => ({ label, click: () => { win.show(); send('cmd', { name: 'act', act }); } })),
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]));
  tray.on('click', () => (win.isVisible() ? win.hide() : win.show()));
});

ipcMain.on('move-by', (_e, dx, dy) => { if (!win) return; const b = win.getBounds(); win.setBounds(clamp({ ...b, x: Math.round(b.x + dx), y: Math.round(b.y + dy) })); });
ipcMain.on('ignore-mouse', (_e, on) => win && win.setIgnoreMouseEvents(on, { forward: true }));
ipcMain.on('resize', (_e, s) => {
  if (!win) return; scale = s; const b = win.getBounds(), d = dims(s), cx = b.x + b.width / 2, bottom = b.y + b.height;
  win.setBounds(clamp({ x: Math.round(cx - d.w / 2), y: bottom - d.h, width: d.w, height: d.h }));
});
ipcMain.on('hide', () => win && win.hide());
ipcMain.on('quit', () => app.quit());

app.on('window-all-closed', () => {});
