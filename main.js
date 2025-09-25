
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
let backendProcess = null;

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile(path.join(__dirname, 'frontend', 'public', 'index.html'));
}

app.whenReady().then(() => {
  // start backend using node (bundled environment must have node available)
  backendProcess = spawn(process.execPath, [path.join(__dirname, 'backend', 'server.js')], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true
  });
  backendProcess.unref();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) {
    try { process.kill(-backendProcess.pid); } catch(e){}
  }
});
