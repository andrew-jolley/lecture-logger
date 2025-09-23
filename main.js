const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');
const os = require('os');

let mainWindow;

// UI Cache configuration
const LOCAL_UI_CACHE_DIR = path.join(app.getPath('cache'), 'LectureLogger-UI');

// Function to check if cached UI files should be used
function shouldUseCachedUI() {
  // In development mode, always use bundled files
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode detected - using bundled UI files');
    return false;
  }
  
  // Check if this might be first launch of new binary by checking version file
  try {
    const packageJson = require('./package.json');
    const binaryVersionFile = path.join(os.homedir(), 'Documents', '.lecture-logger-version');
    
    if (fs.existsSync(binaryVersionFile)) {
      const lastSeenVersion = fs.readFileSync(binaryVersionFile, 'utf8').trim();
      if (lastSeenVersion !== packageJson.version) {
        console.log('First launch of new binary version - using bundled UI files');
        return false;
      }
    } else {
      console.log('No previous binary version recorded - using bundled UI files');
      return false;
    }
  } catch (error) {
    console.log('Error checking binary version - using bundled UI files:', error.message);
    return false;
  }
  
  const cachedIndexPath = path.join(LOCAL_UI_CACHE_DIR, 'index.html');
  const cachedRendererPath = path.join(LOCAL_UI_CACHE_DIR, 'renderer.js');
  const versionFilePath = path.join(LOCAL_UI_CACHE_DIR, 'ui-version.txt');
  
  console.log('Checking cached UI files:');
  console.log('- Cache directory:', LOCAL_UI_CACHE_DIR);
  console.log('- index.html exists:', fs.existsSync(cachedIndexPath));
  console.log('- renderer.js exists:', fs.existsSync(cachedRendererPath));
  console.log('- ui-version.txt exists:', fs.existsSync(versionFilePath));
  
  // Check if all required cached files exist
  const allFilesExist = fs.existsSync(cachedIndexPath) && 
                       fs.existsSync(cachedRendererPath) && 
                       fs.existsSync(versionFilePath);
  
  if (allFilesExist) {
    try {
      // Read and compare versions
      const cachedVersion = fs.readFileSync(versionFilePath, 'utf8').trim();
      console.log('- Cached UI version:', cachedVersion);
      
      // Check if cached version is newer than what we expect to be bundled
      // For now, if cached files exist and version file is readable, use them
      console.log('✅ Using cached UI files');
      return true;
    } catch (error) {
      console.log('❌ Error reading cached version file:', error.message);
      return false;
    }
  } else {
    console.log('❌ Not all cached files exist - using bundled files');
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // This helps with built apps
    },
    show: false, // Don't show until ready
    autoHideMenuBar: process.platform === 'win32', // Hide menu bar on Windows
    menuBarVisible: process.platform !== 'win32' // Show menu bar only on macOS/Linux
  });

  // Show window when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load cached UI files if available, otherwise use bundled files
  if (shouldUseCachedUI()) {
    const cachedIndexPath = path.join(LOCAL_UI_CACHE_DIR, 'index.html');
    console.log('Loading cached UI files from:', cachedIndexPath);
    mainWindow.loadFile(cachedIndexPath);
  } else {
    console.log('Loading bundled UI files');
    mainWindow.loadFile('index.html');
  }

  // Optional: Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Set up the application menu
  createMenu();
}

// Create application menu
function createMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // macOS app menu
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { 
          label: 'Check for Updates...',
          click: () => {
            if (mainWindow && mainWindow.webContents) {
              mainWindow.webContents.executeJavaScript('checkForUpdates(true)');
            }
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'actualSize' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    // Help menu
    {
      role: 'help',
      submenu: [
        ...(!isMac ? [
          { 
            label: 'Check for Updates...',
            click: () => {
              if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.executeJavaScript('checkForUpdates(true)');
              }
            }
          },
          { type: 'separator' }
        ] : []),
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/andrew-jolley/lecture-logger')
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Download file function
async function downloadFile(url, filename) {
  const downloadsPath = path.join(os.homedir(), 'Downloads');
  const filePath = path.join(downloadsPath, filename);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        return downloadFile(response.headers.location, filename).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// IPC handler for update downloads with progress
ipcMain.handle('download-update', async (event, url, filename) => {
  const downloadsPath = path.join(os.homedir(), 'Downloads');
  const filePath = path.join(downloadsPath, filename);
  
  // Helper function to handle the actual download with redirect support
  const downloadWithRedirects = (downloadUrl, attempt = 1) => {
    return new Promise((resolve, reject) => {
      if (attempt > 5) {
        reject(new Error('Too many redirects'));
        return;
      }
      
      const file = fs.createWriteStream(filePath);
      let totalBytes = 0;
      let downloadedBytes = 0;
      
      https.get(downloadUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          fs.unlink(filePath, () => {});
          // Recursively call this function with the redirect URL
          return downloadWithRedirects(response.headers.location, attempt + 1)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(filePath, () => {});
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        totalBytes = parseInt(response.headers['content-length'], 10) || 0;
        
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          
          if (totalBytes > 0) {
            const progress = Math.round((downloadedBytes / totalBytes) * 100);
            const mbDownloaded = (downloadedBytes / 1024 / 1024).toFixed(1);
            const mbTotal = (totalBytes / 1024 / 1024).toFixed(1);
            
            // Send progress update to renderer
            event.sender.send('update-download-progress', {
              progress,
              downloadedBytes,
              totalBytes,
              status: `Downloaded ${mbDownloaded} MB of ${mbTotal} MB`
            });
          } else {
            // If we don't know total size, show downloading status
            const mbDownloaded = (downloadedBytes / 1024 / 1024).toFixed(1);
            event.sender.send('update-download-progress', {
              progress: -1, // Indeterminate progress
              downloadedBytes,
              totalBytes: 0,
              status: `Downloaded ${mbDownloaded} MB...`
            });
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          event.sender.send('update-download-complete', { filePath, filename });
          resolve(filePath);
        });
        
        file.on('error', (err) => {
          fs.unlink(filePath, () => {});
          event.sender.send('update-download-error', { error: err.message });
          reject(err);
        });
        
      }).on('error', (err) => {
        file.close();
        fs.unlink(filePath, () => {});
        event.sender.send('update-download-error', { error: err.message });
        reject(err);
      });
    });
  };
  
  // Start the download with redirect support
  return downloadWithRedirects(url);
});

// IPC handler to open Downloads folder and close app
ipcMain.handle('open-downloads-and-close', async () => {
  const downloadsPath = path.join(os.homedir(), 'Downloads');
  await shell.openPath(downloadsPath);
  
  // Close the app after a short delay to ensure folder opens
  setTimeout(() => {
    app.quit();
  }, 500);
  
  return true;
});

// IPC handler to restart the app (for UI updates)
ipcMain.handle('restart-app', async () => {
  // Relaunch the app and exit current instance
  app.relaunch();
  app.exit();
  return true;
});

// IPC handler to get cache directory path
ipcMain.handle('get-cache-dir', async () => {
  return LOCAL_UI_CACHE_DIR;
});

// IPC handler to delete UI cache
ipcMain.handle('delete-ui-cache', async () => {
  try {
    if (fs.existsSync(LOCAL_UI_CACHE_DIR)) {
      // Remove the entire cache directory
      fs.rmSync(LOCAL_UI_CACHE_DIR, { recursive: true, force: true });
      console.log('UI cache deleted:', LOCAL_UI_CACHE_DIR);
      return { success: true, message: 'UI cache deleted successfully' };
    } else {
      return { success: true, message: 'Cache directory does not exist' };
    }
  } catch (error) {
    console.error('Error deleting UI cache:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler to check if UI files are cached or bundled
ipcMain.handle('get-ui-source', async () => {
  return shouldUseCachedUI() ? 'cached' : 'bundled';
});