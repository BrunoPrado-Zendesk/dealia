import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initDatabase } from './main/database';
import { registerIpcHandlers } from './main/ipc-handlers';
import { startScheduler } from './main/scheduler';

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Development: load from Vite dev server
    const devServerUrl = 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
  } else {
    // Production: load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/main_window/index.html'));
  }
};

app.on('ready', () => {
  initDatabase();
  registerIpcHandlers();
  startScheduler();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
