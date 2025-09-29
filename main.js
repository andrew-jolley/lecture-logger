const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');
const os = require('os');

let mainWindow;
let splashWindow;

// UI Cache configuration
const LOCAL_UI_CACHE_DIR = path.join(app.getPath('cache'), 'LectureLogger-UI');

// Python runtime configuration
function getEmbeddedPythonPath() {
  const platform = os.platform();
  const arch = os.arch();
  
  // Map Node.js arch to our naming convention
  const archMap = {
    'x64': 'x64',
    'arm64': 'arm64',
    'ia32': 'ia32'
  };
  
  const mappedArch = archMap[arch] || 'x64';
  
  // Try different potential locations for Python runtime
  const possiblePaths = [
    // Development location (npm start)
    path.join(__dirname, 'python-runtime', `${platform}-${mappedArch}`)
  ];
  
  // Add packaged app paths only if process.resourcesPath is available (Electron context)
  if (process.resourcesPath) {
    possiblePaths.push(
      // Packaged app location: Contents/python-runtime (from Resources/app.asar)
      path.join(process.resourcesPath, '..', 'python-runtime', `${platform}-${mappedArch}`),
      // Alternative: Direct path from app bundle
      path.join(path.dirname(process.resourcesPath), 'python-runtime', `${platform}-${mappedArch}`),
      // Fallback: Unpacked in Resources
      path.join(process.resourcesPath, 'python-runtime', `${platform}-${mappedArch}`)
    );
  }
  
  let pythonExe;
  let runtimeDir;
  
  for (const tryPath of possiblePaths) {
    console.log(`Checking Python runtime at: ${tryPath}`);
    
    // Log to debug file
    try {
      const debugPath = path.join(require('os').homedir(), 'lecture-logger-debug.log');
      require('fs').appendFileSync(debugPath, `Checking: ${tryPath} - Exists: ${fs.existsSync(tryPath)}\n`);
    } catch (e) {}
    
    if (platform === 'win32') {
      pythonExe = path.join(tryPath, 'python.exe');
      if (!fs.existsSync(pythonExe)) {
        pythonExe = path.join(tryPath, 'python.bat');
      }
    } else {
      pythonExe = path.join(tryPath, 'bin', 'python3');
    }
    
    console.log(`Python executable would be: ${pythonExe}`);
    
    if (fs.existsSync(pythonExe)) {
      runtimeDir = tryPath;
      console.log(`Found working Python at: ${pythonExe}`);
      break;
    }
  }
  
  // Check if embedded Python exists and is executable
  if (runtimeDir && fs.existsSync(pythonExe)) {
    try {
      // Check if file is executable (non-Windows)
      if (platform !== 'win32') {
        const stats = fs.statSync(pythonExe);
        if (!(stats.mode & parseInt('111', 8))) {
          console.log(`Making Python executable: ${pythonExe}`);
          fs.chmodSync(pythonExe, '755');
        }
      }
      
      console.log(`Using embedded Python: ${pythonExe}`);
      return pythonExe;
    } catch (error) {
      console.error(`Error accessing Python executable: ${error.message}`);
    }
  }
  
  // Fallback to system Python
  console.log('Embedded Python not found, falling back to system python3');
  return 'python3';
}

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

function createSplashWindow() {
  const path = require('path');
  const iconPath = process.platform === 'win32' 
    ? path.join(__dirname, 'lec_log_win.ico')
    : path.join(__dirname, 'lec_log_mac.icns');
    
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    backgroundColor: '#667eea',
    resizable: false,
    title: 'Lecture Logger', // Fix for macOS Mission Control display
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false,
    roundedCorners: true
  });

  // Create main window immediately but keep it hidden
  if (!mainWindow) {
    createWindow();
  }

  // Create splash HTML content
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
        }
        body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 15px;
          background: inherit;
          z-index: -1;
        }
        .splash-container {
          text-align: center;
          color: white;
          z-index: 1;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 25px;
          text-shadow: 0 3px 6px rgba(0,0,0,0.4);
          letter-spacing: -0.5px;
        }
        .spinner {
          width: 45px;
          height: 45px;
          border: 4px solid rgba(255,255,255,0.2);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-text {
          font-size: 16px;
          opacity: 0.95;
          font-weight: 500;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div class="splash-container">
        <div class="logo">📚 Lecture Logger</div>
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
    
    // Try to set rounded corners on Windows
    if (process.platform === 'win32') {
      try {
        const { exec } = require('child_process');
        // Use Windows DWM API to enable rounded corners (Windows 11)
        splashWindow.webContents.executeJavaScript(`
          if (window.navigator.userAgent.includes('Windows NT 10')) {
            document.body.style.borderRadius = '15px';
            document.body.style.overflow = 'hidden';
          }
        `);
      } catch (error) {
        console.log('Could not apply rounded corners:', error.message);
      }
    }
  });

  splashWindow.on('closed', () => {
    console.log('Splash window closed');
    splashWindow = null;
  });

  // Close splash after 7 seconds and show main window with modals
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      console.log('Closing splash window after 7 seconds');
      splashWindow.close();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        // On Windows, force focus and bring to front to fix input bug
        if (process.platform === 'win32') {
          setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.focus();
              mainWindow.setAlwaysOnTop(true);
              mainWindow.setAlwaysOnTop(false);
            }
          }, 200);
        }
        // Signal renderer that splash is done and modals can now show
        setTimeout(() => {
          mainWindow.webContents.executeJavaScript('window.splashComplete = true; if (window.onSplashComplete) window.onSplashComplete();');
        }, 300);
      }
    }
  }, 7000);
}

function createWindow() {
  const path = require('path');
  const iconPath = process.platform === 'win32' 
    ? path.join(__dirname, 'lec_log_win.ico')
    : path.join(__dirname, 'lec_log_mac.icns');
    
  mainWindow = new BrowserWindow({
    width: 900,
    height: 850,
    icon: iconPath,
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

  // Don't show main window until app signals it's ready
  mainWindow.once('ready-to-show', () => {
    console.log('Main window ready, but keeping hidden until app initialization complete');
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
        { 
          label: 'About Lecture Logger',
          click: () => {
            if (mainWindow && mainWindow.webContents) {
              mainWindow.webContents.executeJavaScript('document.getElementById("infoBtn").click()');
            }
          }
        },
        { type: 'separator' },
        { 
          label: 'Check for Updates...',
          click: () => {
            if (mainWindow && mainWindow.webContents) {
              mainWindow.webContents.executeJavaScript(`
                if (typeof checkForUpdates === 'function') {
                  checkForUpdates(true);
                } else {
                  console.log('checkForUpdates function not available yet');
                  alert('Please wait for the app to fully load before checking for updates.');
                }
              `);
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
  createSplashWindow();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashWindow();
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    // Ensure all processes are cleaned up before quitting
    process.exit(0);
  }
});

// Handle app termination more gracefully
app.on('before-quit', (event) => {
  console.log('App is about to quit, cleaning up...');
  
  // Force close any lingering processes
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
  }
});

// Handle installer-triggered shutdowns
app.on('window-all-closed', () => {
  console.log('All windows closed, quitting application...');
  // Always quit on Windows when all windows are closed (important for installers)
  if (process.platform === 'win32') {
    app.quit();
  }
});

// Handle unexpected shutdowns
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  app.quit();
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  app.quit();
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
  
  console.log('Starting update download:', filename);
  
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
          console.log('Download completed:', filename);
          console.log('File exists:', fs.existsSync(filePath));
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log('File size:', stats.size, 'bytes');
          }
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

// IPC handler to open folder containing a file
ipcMain.handle('open-folder', async (event, filePath) => {
  try {
    const folderPath = path.dirname(filePath);
    console.log('Opening folder:', folderPath);
    
    const result = await shell.openPath(folderPath);
    
    if (result !== '') {
      console.error('shell.openPath failed with result:', result);
      return { success: false, error: result };
    }
    
    console.log('Successfully opened folder, closing app in 2 seconds...');
    
    // Close the app after a short delay to ensure folder opens
    setTimeout(() => {
      app.quit();
    }, 2000);
    
    return { success: true };
  } catch (error) {
    console.error('Error opening folder:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler to signal app is ready and show main window
ipcMain.handle('app-ready', async () => {
  console.log('🚀 App ready signal received');
  
  return new Promise((resolve) => {
    // Show main window first
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('✅ Showing main window...');
      mainWindow.show();
      mainWindow.focus();
    }
    
    // Close splash window with fade effect
    if (splashWindow && !splashWindow.isDestroyed()) {
      console.log('🔄 Closing splash window...');
      
      // Try fade effect, but don't let it block the process
      splashWindow.webContents.executeJavaScript(`
        document.body.style.transition = 'opacity 0.3s ease-out';
        document.body.style.opacity = '0';
      `).catch(() => {
        console.log('⚠️ Fade effect failed, closing splash directly');
      });
      
      // Close splash after short delay regardless of fade
      setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
          console.log('❌ Closing splash window now');
          splashWindow.close();
        }
        resolve(true);
      }, 300);
    } else {
      resolve(true);
    }
  });
});

// IPC handler to open installer file directly
ipcMain.handle('open-installer', async (event, filePath) => {
  try {
    console.log('Attempting to open installer at:', filePath);
    
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return { success: false, error: `File not found: ${filePath}` };
    }
    
    console.log('File exists, attempting to unblock and open...');
    
    // Try to unblock the file first (removes Windows "Mark of the Web")
    const { exec } = require('child_process');
    const unblockResult = await new Promise((resolve) => {
      exec(`powershell -Command "Unblock-File -Path '${filePath}'"`, (error, stdout, stderr) => {
        if (error) {
          console.log('Could not unblock file (this is normal for some files):', error.message);
        } else {
          console.log('File unblocked successfully');
        }
        resolve(!error);
      });
    });
    
    // On Windows, open the folder containing the installer instead of running it
    if (process.platform === 'win32') {
      const folderPath = path.dirname(filePath);
      console.log('Opening folder on Windows:', folderPath);
      const result = await shell.openPath(folderPath);
      
      if (result !== '') {
        console.error('shell.openPath failed with result:', result);
        return { success: false, error: result };
      }
      
      console.log('Successfully opened Downloads folder, closing app in 2 seconds...');
    } else {
      // On macOS/Linux, open the installer directly
      const result = await shell.openPath(filePath);
      console.log('shell.openPath returned:', result);
      
      // shell.openPath returns an empty string on success, error message on failure
      if (result !== '') {
        console.error('shell.openPath failed with result:', result);
        return { success: false, error: result };
      }
      
      console.log('Successfully opened installer, closing app in 2 seconds...');
    }
    
    // Close the app after a short delay to ensure folder/installer opens
    setTimeout(() => {
      app.quit();
    }, 2000);
    
    return { success: true };
  } catch (error) {
    console.error('Error opening installer:', error);
    return { success: false, error: error.message };
  }
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

// Python Integration Handlers
const { spawn } = require('child_process');

// IPC handler to execute Python bridge commands
ipcMain.handle('python-bridge', async (event, command, data = null) => {
  return new Promise((resolve) => {
    // Get the Python executable path and derive script path from it
    const pythonExePath = getEmbeddedPythonPath();
    
    let pythonScriptPath;
    if (pythonExePath !== 'python3') {
      // Determine script path based on platform and python executable location
      let runtimeDir;
      
      if (os.platform() === 'win32') {
        // On Windows, python.exe is directly in the runtime directory
        runtimeDir = path.dirname(pythonExePath);
      } else {
        // On macOS/Linux, python3 is in bin/ subdirectory
        runtimeDir = path.dirname(path.dirname(pythonExePath)); // Remove /bin/python3 to get runtime dir
      }
      
      pythonScriptPath = path.join(runtimeDir, 'electron_bridge.py');
    } else {
      // Development fallback
      pythonScriptPath = path.join(__dirname, 'python', 'electron_bridge.py');
    }
    
    console.log('Python script path:', pythonScriptPath);
    console.log('Python executable path:', pythonExePath);
    console.log('Platform:', os.platform());
    
    // Log the Python script path to debug file
    try {
      const debugPath = path.join(os.homedir(), 'lecture-logger-debug.log');
      fs.appendFileSync(debugPath, `Platform: ${os.platform()}\n`);
      fs.appendFileSync(debugPath, `Python executable path: ${pythonExePath}\n`);
      fs.appendFileSync(debugPath, `Python script path: ${pythonScriptPath}\n`);
      fs.appendFileSync(debugPath, `Script exists: ${fs.existsSync(pythonScriptPath)}\n\n`);
    } catch (e) {
      console.log('Could not write script path debug:', e.message);
    }
    
    // Build command arguments
    const args = [pythonScriptPath, command];
    if (data) {
      args.push(JSON.stringify(data));
    }
    
    console.log('Executing Python command:', command, data ? 'with data' : '');
    console.log('App paths - __dirname:', __dirname);
    console.log('App paths - process.resourcesPath:', process.resourcesPath || 'undefined');
    console.log('App paths - process.execPath:', process.execPath);
    
    // Determine the best working directory
    let workingDir = __dirname;
    
    // In packaged apps, __dirname is inside app.asar and not accessible
    // Use the app's main directory instead
    if (process.resourcesPath && __dirname.includes('app.asar')) {
      // Use the app bundle's main directory (one level up from Resources)
      workingDir = path.dirname(process.resourcesPath);
    }

    // Write debug info to file for troubleshooting
    try {
      const debugInfo = `
=== Python Bridge Debug - ${new Date().toISOString()} ===
Command: ${command}
Working Directory: ${workingDir}
__dirname: ${__dirname}
process.resourcesPath: ${process.resourcesPath || 'undefined'}
process.execPath: ${process.execPath}
Platform: ${os.platform()}
Arch: ${os.arch()}
`;
      const debugPath = path.join(os.homedir(), 'lecture-logger-debug.log');
      fs.appendFileSync(debugPath, debugInfo);
    } catch (e) {
      console.log('Could not write debug log:', e.message);
    }
    
    const pythonPath = getEmbeddedPythonPath();
    console.log('Using Python path:', pythonPath);
    
    // Log the selected Python path
    try {
      const debugPath = path.join(os.homedir(), 'lecture-logger-debug.log');
      fs.appendFileSync(debugPath, `Selected Python path: ${pythonPath}\n\n`);
    } catch (e) {
      console.log('Could not write Python path debug:', e.message);
    }
    
    // Verify the Python path exists and log details
    if (pythonPath !== 'python3') {
      try {
        const stats = fs.statSync(pythonPath);
        console.log('Python file stats:', {
          exists: true,
          size: stats.size,
          mode: stats.mode.toString(8),
          isFile: stats.isFile()
        });
      } catch (error) {
        console.error('Python file check failed:', error.message);
      }
    }
    
    const pythonProcess = spawn(pythonExePath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: workingDir
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      console.log('Python process exit code:', code);
      
      if (code === 0 && stdout.trim()) {
        try {
          const result = JSON.parse(stdout.trim());
          resolve({ success: true, data: result });
        } catch (e) {
          resolve({ 
            success: false, 
            error: 'Failed to parse Python response', 
            stdout, 
            stderr 
          });
        }
      } else {
        resolve({ 
          success: false, 
          error: stderr || 'Python process failed', 
          code, 
          stdout, 
          stderr 
        });
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Python process error:', error);
      
      // Log detailed error information
      try {
        const debugPath = path.join(os.homedir(), 'lecture-logger-debug.log');
        fs.appendFileSync(debugPath, `Python process error: ${error.message}\n`);
        fs.appendFileSync(debugPath, `Error code: ${error.code}\n`);
        fs.appendFileSync(debugPath, `Python path: ${pythonExePath}\n`);
        fs.appendFileSync(debugPath, `Script path: ${pythonScriptPath}\n`);
        fs.appendFileSync(debugPath, `Working dir: ${workingDir}\n`);
        fs.appendFileSync(debugPath, `Args: ${JSON.stringify(args)}\n\n`);
      } catch (e) {
        console.log('Could not write error debug:', e.message);
      }
      
      resolve({ 
        success: false, 
        error: `Failed to start Python process: ${error.message} (${error.code})` 
      });
    });
  });
});

// IPC handler to save settings for Python bridge
ipcMain.handle('save-python-settings', async (event, settings) => {
  try {
    // Determine the correct settings path
    let settingsPath;
    const debugLog = [];
    
    if (process.resourcesPath && __dirname.includes('app.asar')) {
      // Built app: first check if user has existing development settings
      const devSettingsPath = '/Users/andrewjolley/lecture-logger/python/electron_settings.json';
      debugLog.push(`Checking for dev settings at: ${devSettingsPath}`);
      
      if (fs.existsSync(devSettingsPath)) {
        // Use existing development settings location
        settingsPath = devSettingsPath;
        debugLog.push(`Using existing dev settings`);
      } else {
        // Save to app bundle location
        const appDir = path.dirname(process.resourcesPath);
        settingsPath = path.join(appDir, 'python', 'electron_settings.json');
        debugLog.push(`Using app bundle settings path`);
      }
    } else {
      // Development: save to the main python directory
      settingsPath = path.join(__dirname, 'python', 'electron_settings.json');
      debugLog.push(`Using development settings path`);
    }
    
    debugLog.push(`Final settings path: ${settingsPath}`);
    debugLog.push(`Settings to save: ${JSON.stringify(settings, null, 2)}`);
    
    // Ensure directory exists
    const settingsDir = path.dirname(settingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
      debugLog.push(`Created settings directory: ${settingsDir}`);
    }
    
    // Write settings file
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('Python settings saved:', settingsPath);
    debugLog.push('Settings file written successfully');
    
    // Verify the file was written correctly
    if (fs.existsSync(settingsPath)) {
      const savedContent = fs.readFileSync(settingsPath, 'utf8');
      const parsedContent = JSON.parse(savedContent);
      debugLog.push(`Verification: File exists and contains excelPath: ${parsedContent.excelPath}`);
    } else {
      debugLog.push('ERROR: Settings file does not exist after writing');
    }
    
    // Also log to debug file
    try {
      const debugPath = path.join(os.homedir(), 'lecture-logger-debug.log');
      const timestamp = new Date().toISOString();
      fs.appendFileSync(debugPath, `\n=== Python Settings Save - ${timestamp} ===\n`);
      debugLog.forEach(line => fs.appendFileSync(debugPath, `${line}\n`));
      fs.appendFileSync(debugPath, `=====================================\n\n`);
    } catch (e) {
      console.warn('Could not write to debug log:', e.message);
    }
    
    return { success: true, path: settingsPath };
  } catch (error) {
    console.error('Error saving Python settings:', error);
    
    // Log error to debug file
    try {
      const debugPath = path.join(os.homedir(), 'lecture-logger-debug.log');
      const timestamp = new Date().toISOString();
      fs.appendFileSync(debugPath, `\n=== Python Settings Save ERROR - ${timestamp} ===\n`);
      fs.appendFileSync(debugPath, `Error: ${error.message}\n`);
      fs.appendFileSync(debugPath, `Stack: ${error.stack}\n`);
      fs.appendFileSync(debugPath, `Settings attempted: ${JSON.stringify(settings, null, 2)}\n`);
      fs.appendFileSync(debugPath, `=====================================\n\n`);
    } catch (e) {}
    
    return { success: false, error: error.message };
  }
});