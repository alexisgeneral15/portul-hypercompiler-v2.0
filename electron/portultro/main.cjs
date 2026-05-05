
const { app, BrowserWindow } = require('electron');
// SINGLE INSTANCE LOCK
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}
let mainWindow = null;
app.on('second-instance', (event, argv, workingDirectory) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let backendProcess = null;

function getAppRootPath() {
  return path.resolve(__dirname, '..', '..');
}

function getRendererErrorPagePath() {
  return path.join(__dirname, 'window-error.html');
}

function parsePortulson(text) {
  const input = (text || '').trim();
  if (!input.startsWith('[')) return {};
  let i = 0;
  const skip = () => { while (i < input.length && /\s/.test(input[i])) i++; };
  const parseValue = () => {
    skip();
    const ch = input[i];
    if (ch === '[') return parseObject();
    if (ch === 't') { i++; return true; }
    if (ch === 'f') { i++; return false; }
    if (ch === 'n') { i++; return null; }
    if (ch === '"') {
      i++;
      let s = '';
      while (i < input.length && input[i] !== '"') { s += input[i++]; }
      i++;
      return s;
    }
    let num = '';
    while (i < input.length && /[0-9.#-]/.test(input[i])) { num += input[i++]; }
    return num.includes('.') ? Number(num) : Number(num);
  };
  const parseKey = () => {
    skip();
    let key = '';
    while (i < input.length && /[A-Za-z0-9_-]/.test(input[i])) { key += input[i++]; }
    return key;
  };
  const parseObject = () => {
    const obj = {};
    i++;
    while (i < input.length) {
      skip();
      if (input[i] === ']') { i++; break; }
      const key = parseKey();
      skip();
      if (input[i] === ':') i++;
      const value = parseValue();
      if (key) obj[key] = value;
      skip();
      if (input[i] === ',') i++;
    }
    return obj;
  };
  return parseObject();
}

function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'portultro.psj');
    const text = fs.readFileSync(configPath, 'utf8');
    return parsePortulson(text);
  } catch {
    return { app: 'PortulTro', v: '1.0.0', win: { w: 1360, h: 820 }, backend: { port: 3001 } };
  }
}

function startBackend(port) {
  if (backendProcess) return;
  const net = require('net');
  function isPortInUse(port, cb) {
    const tester = net.createServer()
      .once('error', err => (err.code === 'EADDRINUSE' ? cb(true) : cb(false)))
      .once('listening', () => tester.once('close', () => cb(false)).close())
      .listen(port);
  }

  isPortInUse(port || 3001, (inUse) => {
    if (inUse) {
      console.log('[Electron] Backend ya está corriendo en el puerto', port || 3001);
      return;
    }
    const backendEntry = path.join(getAppRootPath(), 'backend', 'src', 'index.js');
    console.log('[Electron] Starting backend (ESM):', backendEntry);
    backendProcess = spawn(process.execPath, ['--experimental-modules', backendEntry], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: String(port || 3001),
        NODE_ENV: process.env.NODE_ENV || 'production'
      }
    });
    backendProcess.on('exit', (code, signal) => {
      console.error(`[Electron] Backend process exited with code ${code}, signal ${signal}`);
      backendProcess = null;
    });
    backendProcess.on('error', (err) => {
      console.error('[Electron] Backend process failed to start:', err);
    });
  });
}

function applyEfficiencyFlags(cfg) {
  if (cfg.shell?.gpu === false) {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu');
  }
  if (cfg.shell?.ext === false) {
    app.commandLine.appendSwitch('disable-extensions');
  }
  if (cfg.shell?.net === false) {
    app.commandLine.appendSwitch('disable-background-networking');
    app.commandLine.appendSwitch('disable-sync');
    app.commandLine.appendSwitch('disable-translate');
  }
  app.commandLine.appendSwitch('disable-features', 'Translate,BackForwardCache');
}



// Declaración única de mainWindow ya está arriba
let lastWindowHadError = false;
let windowClosedUnexpectedly = false;

function createWindow(cfg) {
  // Protección extra: solo una ventana principal
  if (mainWindow && !mainWindow.isDestroyed()) {
    try { mainWindow.focus(); } catch { }
    return;
  }
  // Si hay ventanas abiertas, no crear otra
  if (BrowserWindow.getAllWindows().length > 0) {
    const wins = BrowserWindow.getAllWindows();
    mainWindow = wins[0];
    try { mainWindow.focus(); } catch { }
    return;
  }
  if (lastWindowHadError || windowClosedUnexpectedly) {
    console.error('[Electron] Not creating new window due to previous error or unexpected close.');
    return;
  }
  const winCfg = cfg.win || {};
  const shouldOpenDevTools = process.env.OPEN_DEVTOOLS === '1' || Boolean(process.env.ELECTRON_DEV_URL);
  mainWindow = new BrowserWindow({
    width: winCfg.w || 1360,
    height: winCfg.h || 820,
    minWidth: winCfg.minw || 1080,
    minHeight: winCfg.minh || 680,
    backgroundColor: winCfg.bg || '#0b1220',
    show: true,
    webPreferences: {
      contextIsolation: true,
      devTools: true, // Forzar habilitado siempre para depuración
      preload: path.join(__dirname, 'preload.cjs')
    }
  });
  if (shouldOpenDevTools) {
    mainWindow.webContents.once('did-frame-finish-load', () => {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
  }
  console.log('[Electron] Window created');

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    lastWindowHadError = true;
    console.error(`[Electron] Window failed to load: ${errorDescription} (code ${errorCode})`);
    mainWindow.loadFile(getRendererErrorPagePath());
  });

  mainWindow.on('unresponsive', () => {
    lastWindowHadError = true;
    console.error('[Electron] Window became unresponsive.');
    mainWindow.loadFile(getRendererErrorPagePath());
  });

  mainWindow.on('close', (e) => {
    console.log('[Electron] Window close event triggered');
    if (!lastWindowHadError) {
      windowClosedUnexpectedly = true;
    }
  });

  mainWindow.on('closed', () => {
    console.log('[Electron] Window closed');
    mainWindow = null;
    if (lastWindowHadError || windowClosedUnexpectedly) {
      console.error('[Electron] Window closed after error or unexpected close. No new window will be created.');
    }
  });

  const devUrl = process.env.ELECTRON_DEV_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(getAppRootPath(), 'dist', 'index.html'));
  }
}



app.whenReady().then(() => {
  const cfg = loadConfig();
  applyEfficiencyFlags(cfg);
  if (process.env.SKIP_INTERNAL_BACKEND === '1') {
    console.log('[Electron] SKIP_INTERNAL_BACKEND=1, omitiendo arranque interno de backend.');
  } else {
    startBackend(cfg.backend?.port || 3001);
  }
  createWindow(cfg);

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow(cfg);
    } else {
      mainWindow.focus();
    }
  });
});


app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  mainWindow = null;
  lastWindowHadError = false;
  windowClosedUnexpectedly = false;
  if (process.platform !== 'darwin') app.quit();
});
