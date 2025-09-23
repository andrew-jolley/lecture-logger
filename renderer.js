// ===== UI VERSION IDENTIFIER =====
// This constant identifies the version of this UI file
// It should be updated whenever this file is modified for OTA updates
const THIS_UI_VERSION = '1.6.7';
// ===================================

// Excel functionality removed - keeping for UI compatibility
// const Excel = require('exceljs');
const fs = require('fs');
const path = require('path');
const os = require('os'); // For cross-platform home directory
const { ipcRenderer, shell } = require('electron');

// Settings management
let appSettings = {
  excelPath: '',
  startingRow: 125,
  verboseLogging: false,
  autoUpdateCheck: true,
  enableOTA: true, // Enable OTA UI updates
  testVersion: '' // For testing update system
};

// Version management and release notes
const packageJson = require('./package.json');
const { title } = require('process');
const currentVersion = packageJson.version;

// Release notes
const releaseNotes = {
    "2.5.3": {
        title: "Revolutionary UI OTA Update System & Enhanced User Experience",
        notes: [
          "🎨 **NEW: Over-The-Air UI Updates** - Interface automatically updates without reinstalling the app",
          "📱 **Self-Identifying UI System** - Seamless version tracking with embedded UI version constants",
          "🔄 **Automatic Update Checking** - Intelligent startup scanning for both app and UI updates",
          "💾 **Smart Caching System** - Local UI cache with automatic download and version management",
          "🔔 **Subtle Refresh Notifications** - Non-intrusive update prompts with one-click app restart",
          "🎯 **Enhanced About Modal** - Larger title with comprehensive acknowledgements and system info",
          "📋 **Improved Release Notes** - All versions displayed with newest first, older in collapsible accordion",
          "🛠️ **Advanced Developer Tools** - Complete UI management with cache clearing and update testing",
          "⚡ **Startup Auto-Updates** - Configurable automatic UI update checking on app launch",
          "🎪 **Consistent UI Versioning** - HTML meta tags and JavaScript constants ensure version integrity",
          "🔧 **Robust Error Handling** - Graceful fallbacks when GitHub CDN or cache operations fail",
          "✨ **Enhanced Visual Feedback** - Improved success/error alerts with better styling and timing"
        ]
    },
    "2.4.1": {
        title: "Minor Bug Fixes & Improvements",
        notes: [
          "🐛 Fixed issue with Excel file not saving correctly",
          "🔧 Improved error handling for file operations"
        ]
    },
    "2.4.0": {
    title: "GitHub Integration & Update System Overhaul",
    notes: [
      "🔗 Updated update checker to use GitHub raw files instead of Gist",
      "🔍 Added comprehensive debug modal for GitHub integration testing",
      "🛠️ Fixed URL parsing to properly capture complete download URLs",
      "📝 Enhanced release notes formatting with preserved line breaks",
      "✅ Added robust error handling for update modal DOM elements",
      "🎯 Improved update modal with platform-specific download detection",
      "🔧 Enhanced debug functionality with detailed error reporting",
      "📋 Fixed 'View Release Notes' button functionality in About modal",
      "🚀 Added fallback alert system when modals fail to load",
      "🐛 Resolved 'Cannot set properties of null' update checking errors"
    ]
  },
  "2.3.2": {
    title: "Build Number Integration & UI Enhancements",
    notes: [
      "🔢 Added build number tracking for better version management",
      "📋 Added 'View Release Notes' button in About modal",
      "🍎 Enhanced macOS About window with version and build info",
      "⚡ Improved modal sequencing (Settings → Release Notes)",
      "🔧 Better build configuration for production releases",
      "🐛 Fixed modal interaction issues and timing"
    ]
  },
  "2.3.0": {
    title: "Your New Feature Title",
    notes: [
      "🆕 New feature description",
      "🔧 Improvement description",
      "🐛 Bug fix description"
    ]
  },
    "2.2.1": {
    title: "Enhanced Release Management & Build Support",
    notes: [
      "🎉 Release notes now appear on first-time installation",
      "🔧 Improved modal functionality for built applications",
      "📦 Enhanced build configuration for cross-platform support",
      "⚙️ Better settings management and modal interactions",
      "🐛 Fixed modal display issues in production builds"
    ]
  },
  "2.0.0": {
    title: "Major Update - Enhanced UI & Features",
    notes: [
      "🎨 Redesigned UI",
      "⚙️ Added settings management for custom Excel paths",
      "📅 Updated date format to dd/mm/yyyy",
      "📊 Academic year format changed to yy/yy",
      "🔧 Added developer settings button",
      "ℹ️ Enhanced About modal with build info",
      "🐛 Bug fixes & performance improvements"
    ]
  },
  "1.0.0": {
    title: "Initial Release",
    notes: [
      "📚 Basic lecture logging",
      "📊 Excel export",
      "🎯 Knowledge, Skills & Behaviours mapping",
      "📋 Form validation"
    ]
  }
};

// Enhanced alert functions for better user feedback
function showSuccessAlert(message, details = '') {
  const alertHtml = `
    <div style="
      position: fixed; 
      top: 20px; 
      right: 20px; 
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white; 
      padding: 20px 25px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
      z-index: 10000;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 2px solid rgba(255, 255, 255, 0.2);
    " id="successAlert">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 24px; margin-right: 12px;">✅</span>
        <strong style="font-size: 16px;">Success!</strong>
      </div>
      <div style="font-size: 14px; line-height: 1.4; margin-bottom: ${details ? '8px' : '0'};">
        ${message}
      </div>
      ${details ? `<div style="font-size: 12px; opacity: 0.9; font-style: italic;">${details}</div>` : ''}
    </div>
  `;
  
  // Remove existing alerts
  const existing = document.getElementById('successAlert');
  if (existing) existing.remove();
  
  // Add new alert
  document.body.insertAdjacentHTML('beforeend', alertHtml);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    const alert = document.getElementById('successAlert');
    if (alert) {
      alert.style.opacity = '0';
      alert.style.transform = 'translateX(100%)';
      alert.style.transition = 'all 0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }
  }, 4000);
}

function showErrorAlert(message, details = '') {
  const alertHtml = `
    <div style="
      position: fixed; 
      top: 20px; 
      right: 20px; 
      background: linear-gradient(135deg, #dc3545, #e74c3c);
      color: white; 
      padding: 20px 25px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
      z-index: 10000;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 2px solid rgba(255, 255, 255, 0.2);
    " id="errorAlert">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 24px; margin-right: 12px;">❌</span>
        <strong style="font-size: 16px;">Error!</strong>
      </div>
      <div style="font-size: 14px; line-height: 1.4; margin-bottom: ${details ? '8px' : '0'};">
        ${message}
      </div>
      ${details ? `<div style="font-size: 12px; opacity: 0.9; font-style: italic;">${details}</div>` : ''}
    </div>
  `;
  
  // Remove existing alerts
  const existing = document.getElementById('errorAlert');
  if (existing) existing.remove();
  
  // Add new alert
  document.body.insertAdjacentHTML('beforeend', alertHtml);
  
  // Auto-remove after 6 seconds (longer for errors)
  setTimeout(() => {
    const alert = document.getElementById('errorAlert');
    if (alert) {
      alert.style.opacity = '0';
      alert.style.transform = 'translateX(100%)';
      alert.style.transition = 'all 0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }
  }, 6000);
}

// Cross-platform default Excel path (Documents folder)
const defaultFilePath = path.join(os.homedir(), 'Documents', 'OTJ log v4 Broadcast _ Media Systems Engineer.xlsx');

// Update checking constants
const UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/andrew-jolley/lecture-logger/refs/heads/main/version.txt';

// UI OTA Update system
const UI_VERSION_URL = 'https://raw.githubusercontent.com/andrew-jolley/lecture-logger/refs/heads/main/ui-version.txt';
const UI_FILES_BASE_URL = 'https://raw.githubusercontent.com/andrew-jolley/lecture-logger/refs/heads/main/ui/';
let LOCAL_UI_CACHE_DIR = null; // Will be set via IPC at startup

// Binary version tracking for first launch detection
const BINARY_VERSION_FILE = path.join(os.homedir(), 'Documents', '.lecture-logger-version');
let isFirstLaunchOfBinary = false; // Will be determined at startup

// OTA status tracking for developer tools
let otaStatus = {
  state: 'idle', // 'idle', 'checking', 'downloading', 'ready', 'installed', 'failed'
  message: 'No OTA activity',
  version: null,
  error: null
};

// Temporary storage for pending OTA files (not yet committed to cache)
let pendingOTAFiles = {
  version: null,
  files: null, // Will store the downloaded file contents
  validated: false
};

// Initialize cache directory at startup
async function initializeCacheDir() {
  if (!LOCAL_UI_CACHE_DIR) {
    LOCAL_UI_CACHE_DIR = await ipcRenderer.invoke('get-cache-dir');
  }
  return LOCAL_UI_CACHE_DIR;
}

// Check if this is the first launch of a new binary version
function checkBinaryVersionFirstLaunch() {
  try {
    const currentBinaryVersion = packageJson.version;
    let lastSeenVersion = null;
    
    // Read last seen binary version
    if (fs.existsSync(BINARY_VERSION_FILE)) {
      lastSeenVersion = fs.readFileSync(BINARY_VERSION_FILE, 'utf8').trim();
    }
    
    // Determine if this is first launch of new binary
    isFirstLaunchOfBinary = !lastSeenVersion || lastSeenVersion !== currentBinaryVersion;
    
    if (isFirstLaunchOfBinary) {
      console.log(`First launch of binary version ${currentBinaryVersion} (previous: ${lastSeenVersion || 'none'})`);
      
      // Handle cache based on OTA setting
      if (appSettings.enableOTA) {
        // Empty cache directory but keep it
        if (LOCAL_UI_CACHE_DIR && fs.existsSync(LOCAL_UI_CACHE_DIR)) {
          console.log('Emptying UI cache directory for new binary version...');
          const files = fs.readdirSync(LOCAL_UI_CACHE_DIR);
          for (const file of files) {
            fs.unlinkSync(path.join(LOCAL_UI_CACHE_DIR, file));
          }
        }
      } else {
        // Delete entire cache directory
        if (LOCAL_UI_CACHE_DIR && fs.existsSync(LOCAL_UI_CACHE_DIR)) {
          console.log('Deleting UI cache directory (OTA disabled)...');
          fs.rmSync(LOCAL_UI_CACHE_DIR, { recursive: true, force: true });
        }
      }
      
      // Update the stored binary version
      fs.writeFileSync(BINARY_VERSION_FILE, currentBinaryVersion, 'utf8');
    }
    
    return isFirstLaunchOfBinary;
  } catch (error) {
    console.error('Error checking binary version first launch:', error);
    return false;
  }
}

// Delete UI cache directory
async function deleteUICache() {
  try {
    const result = await ipcRenderer.invoke('delete-ui-cache');
    if (result.success) {
      logBasic('info', 'UI cache deleted', { message: result.message });
      console.log('UI cache deleted successfully');
      return { success: true, message: result.message };
    } else {
      logVerbose('warn', 'Failed to delete UI cache', { error: result.error });
      console.warn('Failed to delete UI cache:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    logVerbose('error', 'Error deleting UI cache', { error: error.message });
    console.error('Error deleting UI cache:', error);
    return { success: false, error: error.message };
  }
}

// Update checking function
async function checkForUpdates(manualCheck = false, useTestVersion = false) {
  // Use test version if available and requested, otherwise use current version
  const versionToCheck = (useTestVersion && appSettings.testVersion) ? appSettings.testVersion : currentVersion;
  
  logVerbose('info', 'Checking for updates', { 
    manual: manualCheck, 
    testMode: useTestVersion && appSettings.testVersion,
    versionToCheck 
  });
  
  try {
    const response = await fetch(UPDATE_CHECK_URL);
    const text = await response.text();
    
    logVerbose('debug', 'Update check response received', { responseLength: text.length });
    
    const lines = text.trim().split('\n');
    let latestVersion = '';
    let releaseNotes = '';
    let macLink = '';
    let winLink = '';
    let collectingReleaseNotes = false;
    
    // Parse the file format
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Latest_Version:')) {
        latestVersion = trimmedLine.substring('Latest_Version:'.length).trim();
        collectingReleaseNotes = false;
      } else if (trimmedLine.startsWith('Download_Link_Mac:')) {
        macLink = trimmedLine.substring('Download_Link_Mac:'.length).trim();
        collectingReleaseNotes = false;
      } else if (trimmedLine.startsWith('Download_Link_Win:')) {
        winLink = trimmedLine.substring('Download_Link_Win:'.length).trim();
        collectingReleaseNotes = false;
      } else if (trimmedLine === 'Release_Notes:') {
        collectingReleaseNotes = true;
        releaseNotes = ''; // Reset release notes
      } else if (collectingReleaseNotes && trimmedLine.length > 0) {
        // Collect all lines after Release_Notes: as release notes, preserving formatting
        releaseNotes += (releaseNotes ? '\n' : '') + trimmedLine;
      }
    }
    
    if (!latestVersion) {
      throw new Error('Latest version not found in response');
    }
    
    logVerbose('debug', 'Parsed update information', { 
      latestVersion, 
      versionToCheck, 
      macLink: macLink || 'none', 
      winLink: winLink || 'none',
      releaseNotesLength: releaseNotes.length,
      testMode: useTestVersion && appSettings.testVersion
    });
    
    if (isNewerVersion(latestVersion, versionToCheck)) {
      logBasic('info', 'New version available', { latestVersion, versionToCheck, testMode: useTestVersion && appSettings.testVersion });
      showUpdateModal(latestVersion, releaseNotes, macLink, winLink);
    } else {
      logVerbose('info', 'No updates available', { latestVersion, versionToCheck, testMode: useTestVersion && appSettings.testVersion });
      if (manualCheck) {
        const testModeMsg = (useTestVersion && appSettings.testVersion) ? ` (Testing with version ${versionToCheck})` : '';
        alert(`You're running the latest version (${versionToCheck})!${testModeMsg}`);
      }
    }
  } catch (error) {
    logBasic('error', 'Failed to check for updates', { error: error.message });
    if (manualCheck) {
      alert(`Failed to check for updates: ${error.message}`);
    }
  }
}

// Version comparison function
function isNewerVersion(latest, current) {
  console.log('isNewerVersion called with:', { latest, current });
  
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);
  
  console.log('Version parts:', { latestParts, currentParts });
  
  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const latestPart = latestParts[i] || 0;
    const currentPart = currentParts[i] || 0;
    
    console.log(`Comparing part ${i}: latest=${latestPart}, current=${currentPart}`);
    
    if (latestPart > currentPart) {
      console.log('Latest is newer - returning true');
      return true;
    }
    if (latestPart < currentPart) {
      console.log('Current is newer - returning false');
      return false;
    }
  }
  
  console.log('Versions are equal - returning false');
  return false;
}

// UI Version checking and caching system
async function checkUIVersion() {
  try {
    // In development mode or if OTA is disabled, skip OTA updates and use bundled files
    if (process.env.NODE_ENV === 'development') {
      logBasic('info', 'Development mode detected - skipping UI OTA check');
      otaStatus.state = 'idle';
      otaStatus.message = 'Development mode - OTA disabled';
      return;
    }
    
    if (!appSettings.enableOTA) {
      logBasic('info', 'OTA updates disabled in settings - using bundled UI files');
      otaStatus.state = 'idle';
      otaStatus.message = 'OTA disabled in settings';
      return;
    }
    
    otaStatus.state = 'checking';
    otaStatus.message = 'Checking for UI updates...';
    
    logVerbose('info', 'Checking for UI updates');
    
    // Ensure cache directory is initialized and exists
    await initializeCacheDir();
    if (!fs.existsSync(LOCAL_UI_CACHE_DIR)) {
      fs.mkdirSync(LOCAL_UI_CACHE_DIR, { recursive: true });
    }

    // Check current UI version
    const response = await fetch(UI_VERSION_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const latestUIVersion = (await response.text()).trim();
    const currentUIVersion = getCurrentUIVersion();

    logVerbose('info', 'UI version check complete', { 
      current: currentUIVersion, 
      latest: latestUIVersion 
    });

    if (isNewerVersion(latestUIVersion, currentUIVersion)) {
      logBasic('info', 'New UI version available', { 
        current: currentUIVersion, 
        latest: latestUIVersion 
      });
      
      try {
        // Download and validate files - only show notification if validation passes
        await downloadUIFiles(latestUIVersion);
        
        // Validation passed - OTA is ready
        otaStatus.state = 'ready';
        otaStatus.message = `UI version ${latestUIVersion} validated and ready`;
        
        return { updated: true, version: latestUIVersion };
      } catch (downloadError) {
        logBasic('warn', 'UI files download/validation failed', { error: downloadError.message });
        
        // Don't show user notification for validation failures
        otaStatus.state = 'failed';
        otaStatus.message = downloadError.message;
        otaStatus.error = downloadError.message;
        
        return { 
          updated: false, 
          version: currentUIVersion, 
          error: `Update available (v${latestUIVersion}) but download/validation failed: ${downloadError.message}`,
          silent: true // Don't show user notification
        };
      }
    } else {
      otaStatus.state = 'idle';
      otaStatus.message = 'No UI updates available';
    }

    return { updated: false, version: currentUIVersion };

  } catch (error) {
    logBasic('error', 'UI version check failed', { error: error.message });
    otaStatus.state = 'failed';
    otaStatus.message = `Version check failed: ${error.message}`;
    otaStatus.error = error.message;
    return { 
      updated: false, 
      version: getCurrentUIVersion(), 
      error: `UI update check failed: ${error.message}` 
    };
  }
}

// Download and cache UI files
async function downloadUIFiles(expectedVersion) {
  try {
    otaStatus.state = 'downloading';
    otaStatus.message = `Downloading UI version ${expectedVersion}...`;
    otaStatus.version = expectedVersion;
    otaStatus.error = null;
    
    await initializeCacheDir();
    
    const filesToDownload = [
      { name: 'index.html', url: `${UI_FILES_BASE_URL}index.html` },
      { name: 'renderer.js', url: `${UI_FILES_BASE_URL}renderer.js` },
      { name: 'package.json', url: `${UI_FILES_BASE_URL}package.json` }
    ];
    
    const downloadedFiles = {};
    
    // Download all files first
    for (const file of filesToDownload) {
      try {
        logVerbose('info', `Downloading UI file: ${file.name}`);
        
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} for ${file.name}`);
        }
        
        downloadedFiles[file.name] = await response.text();
        logVerbose('info', `UI file downloaded: ${file.name}`);
        
      } catch (fileError) {
        const errorMsg = `Failed to download UI file: ${file.name} - ${fileError.message}`;
        logBasic('error', errorMsg);
        otaStatus.state = 'failed';
        otaStatus.message = errorMsg;
        otaStatus.error = fileError.message;
        throw new Error(errorMsg);
      }
    }
    
    // Validate versions in downloaded files BEFORE caching
    const validationErrors = [];
    
    // Check HTML meta tag
    const htmlContent = downloadedFiles['index.html'];
    const htmlVersionMatch = htmlContent.match(/<meta\s+name="ui-version"\s+content="([^"]+)"/);
    const htmlVersion = htmlVersionMatch ? htmlVersionMatch[1] : null;
    if (!htmlVersion || htmlVersion !== expectedVersion) {
      validationErrors.push(`HTML version mismatch: expected ${expectedVersion}, got ${htmlVersion || 'none'}`);
    }
    
    // Check JS constant
    const jsContent = downloadedFiles['renderer.js'];
    const jsVersionMatch = jsContent.match(/THIS_UI_VERSION\s*=\s*['"]([^'"]+)['"]/);
    const jsVersion = jsVersionMatch ? jsVersionMatch[1] : null;
    if (!jsVersion || jsVersion !== expectedVersion) {
      validationErrors.push(`JS version mismatch: expected ${expectedVersion}, got ${jsVersion || 'none'}`);
    }
    
    // Check package.json uiVersion
    try {
      const packageContent = JSON.parse(downloadedFiles['package.json']);
      const packageVersion = packageContent.uiVersion;
      if (!packageVersion || packageVersion !== expectedVersion) {
        validationErrors.push(`Package.json version mismatch: expected ${expectedVersion}, got ${packageVersion || 'none'}`);
      }
    } catch (parseError) {
      validationErrors.push(`Failed to parse package.json: ${parseError.message}`);
    }
    
    // If validation failed, don't cache and throw error
    if (validationErrors.length > 0) {
      const errorMsg = `Version validation failed: ${validationErrors.join('; ')}`;
      logBasic('error', 'OTA version validation failed', { 
        expectedVersion, 
        htmlVersion, 
        jsVersion, 
        errors: validationErrors 
      });
      otaStatus.state = 'failed';
      otaStatus.message = 'Version validation failed';
      otaStatus.error = errorMsg;
      throw new Error(errorMsg);
    }
    
    // Validation passed - store files temporarily until user approval
    pendingOTAFiles.files = downloadedFiles;
    pendingOTAFiles.version = expectedVersion;
    pendingOTAFiles.htmlVersion = htmlVersion;
    pendingOTAFiles.jsVersion = jsVersion;
    
    logBasic('info', 'UI files downloaded and validated, waiting for user approval', { 
      version: expectedVersion,
      htmlVersion,
      jsVersion
    });
    
    // Show notification to user
    showOTANotification();
    
    otaStatus.state = 'ready';
    otaStatus.message = `UI version ${expectedVersion} ready to install`;
    
  } catch (error) {
    logBasic('error', 'Failed to download UI files', { error: error.message });
    if (otaStatus.state !== 'failed') {
      otaStatus.state = 'failed';
      otaStatus.message = error.message;
      otaStatus.error = error.message;
    }
    throw error;
  }
}

// Get current UI version (from cache or bundled)
function getCurrentUIVersion() {
  // Return the version constant from this running UI file
  // This is the most reliable way to know what version is actually running
  return THIS_UI_VERSION;
}

function verifyUIVersionConsistency() {
  // Verify that HTML and JS versions match
  const htmlVersion = document.querySelector('meta[name="ui-version"]')?.content;
  if (htmlVersion && htmlVersion !== THIS_UI_VERSION) {
    logBasic('warn', 'UI version mismatch detected', { 
      jsVersion: THIS_UI_VERSION, 
      htmlVersion: htmlVersion 
    });
  }
  return htmlVersion === THIS_UI_VERSION;
}

// Load UI files (cached or bundled)
function loadUIFiles() {
  try {
    const cachedIndexPath = path.join(LOCAL_UI_CACHE_DIR, 'index.html');
    const cachedRendererPath = path.join(LOCAL_UI_CACHE_DIR, 'renderer.js');
    
    // Check if cached files exist and are newer
    if (fs.existsSync(cachedIndexPath) && fs.existsSync(cachedRendererPath)) {
      const currentUIVersion = getCurrentUIVersion();
      
      if (isNewerVersion(currentUIVersion, THIS_UI_VERSION)) {
        logBasic('info', 'Loading cached UI files', { version: currentUIVersion });
        
        // Note: In Electron, we can't dynamically replace the loaded HTML/JS
        // This would require a restart or iframe approach
        // For now, we just track the version and notify
        
        return {
          hasUpdate: true,
          version: currentUIVersion,
          message: 'Updated UI files are cached. Restart app to use latest UI.'
        };
      }
    }
    
    logVerbose('info', 'Using bundled UI files', { version: THIS_UI_VERSION });
    return {
      hasUpdate: false,
      version: THIS_UI_VERSION,
      message: 'Using bundled UI files'
    };
    
  } catch (error) {
    logBasic('error', 'Error loading UI files', { error: error.message });
    return {
      hasUpdate: false,
      version: THIS_UI_VERSION,
      message: 'Using bundled UI files (fallback)'
    };
  }
}

// Show update modal
function showUpdateModal(version, releaseNotes, macLink, winLink) {
  try {
    // First, close any other open modals
    const allModals = document.querySelectorAll('.modal.show');
    allModals.forEach(modal => {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance && modal.id !== 'updateModal') {
        modalInstance.hide();
      }
    });
    
    // Remove any lingering backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    const newVersionElement = document.getElementById('newVersionNumber');
    const updateNotesElement = document.getElementById('updateReleaseNotes');
    const progressContainer = document.getElementById('updateProgressContainer');
    
    if (!newVersionElement || !updateNotesElement) {
      // Fallback to simple alert if modal elements don't exist
      const message = `New version ${version} is available!\n\nRelease Notes:\n${releaseNotes}`;
      alert(message);
      return;
    }
    
    // Reset the modal UI to initial state
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
    
    const downloadButton = document.querySelector('#updateModal .btn-primary');
    const closeButton = document.querySelector('#updateModal .btn-close');
    const maybeButton = document.querySelector('#updateModal .btn-secondary');
    
    if (downloadButton && closeButton && maybeButton) {
      downloadButton.disabled = false;
      closeButton.disabled = false;
      maybeButton.disabled = false;
      downloadButton.textContent = 'Download Update';
      downloadButton.className = 'btn btn-primary'; // Reset to original classes
    }
    
    // Reset progress bar
    const progressBar = document.getElementById('updateProgressBar');
    if (progressBar) {
      progressBar.style.width = '0%';
      progressBar.setAttribute('aria-valuenow', 0);
      progressBar.textContent = '0%';
      progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
    }
    
    newVersionElement.textContent = `Version ${version}`;
    updateNotesElement.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${releaseNotes}</pre>`;
    
    // Store download links for later use
    window.updateDownloadLinks = {
      mac: macLink,
      win: winLink
    };
    
    // Show the update modal
    const updateModal = new bootstrap.Modal(document.getElementById('updateModal'));
    updateModal.show();
    
    logBasic('info', 'Update modal displayed', { version });
  } catch (error) {
    logBasic('error', 'Failed to show update modal', { error: error.message });
    // Fallback to alert
    alert(`New version ${version} is available!\n\nRelease Notes:\n${releaseNotes}`);
  }
}

// Function to handle download update button click
async function downloadUpdate() {
  const links = window.updateDownloadLinks;
  if (!links) {
    alert('Download links not available');
    return;
  }
  
  const isMac = navigator.platform.toLowerCase().includes('mac');
  const downloadUrl = isMac ? links.mac : links.win;
  
  if (!downloadUrl || downloadUrl === 'Not found') {
    alert('Download link not available for your platform');
    return;
  }
  
  // Extract filename from URL
  const urlParts = downloadUrl.split('/');
  let filename = urlParts[urlParts.length - 1];
  
  // If filename doesn't have an extension, add appropriate one
  if (!filename.includes('.')) {
    filename = isMac ? 'LectureLogger.dmg' : 'LectureLoggerSetup.exe';
  }
  
  // Show progress UI
  const progressContainer = document.getElementById('updateProgressContainer');
  const downloadButton = document.querySelector('#updateModal .btn-primary');
  const closeButton = document.querySelector('#updateModal .btn-close');
  const maybeButton = document.querySelector('#updateModal .btn-secondary');
  
  if (progressContainer) {
    progressContainer.style.display = 'block';
    downloadButton.disabled = true;
    closeButton.disabled = true;
    maybeButton.disabled = true;
    downloadButton.textContent = 'Downloading...';
  }
  
  try {
    // Start the download via IPC
    await ipcRenderer.invoke('download-update', downloadUrl, filename);
  } catch (error) {
    console.error('Download failed:', error);
    showErrorAlert('Download failed', error.message);
    
    // Reset UI on error
    if (progressContainer) {
      progressContainer.style.display = 'none';
      downloadButton.disabled = false;
      closeButton.disabled = false;
      maybeButton.disabled = false;
      downloadButton.textContent = 'Download Update';
    }
  }
}

// IPC event listeners for download progress
ipcRenderer.on('update-download-progress', (event, data) => {
  const progressBar = document.getElementById('updateProgressBar');
  const progressText = document.getElementById('updateProgressText');
  
  if (progressBar && progressText) {
    if (data.progress >= 0) {
      // Determinate progress
      progressBar.style.width = `${data.progress}%`;
      progressBar.setAttribute('aria-valuenow', data.progress);
      progressBar.textContent = `${data.progress}%`;
      progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
    } else {
      // Indeterminate progress
      progressBar.style.width = '100%';
      progressBar.classList.add('progress-bar-striped', 'progress-bar-animated');
      progressBar.textContent = 'Downloading...';
    }
    progressText.textContent = data.status;
  }
});

ipcRenderer.on('update-download-complete', (event, data) => {
  const progressBar = document.getElementById('updateProgressBar');
  const progressText = document.getElementById('updateProgressText');
  const downloadButton = document.querySelector('#updateModal .btn-primary');
  const closeButton = document.querySelector('#updateModal .btn-close');
  const maybeButton = document.querySelector('#updateModal .btn-secondary');
  
  // Update progress to 100%
  if (progressBar && progressText) {
    progressBar.style.width = '100%';
    progressBar.setAttribute('aria-valuenow', 100);
    progressBar.textContent = '100%';
    progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
    progressBar.classList.add('bg-success');
    progressText.textContent = `✅ Download complete: ${data.filename}`;
  }
  
  // Show success message
  showSuccessAlert('Update downloaded successfully!', `File saved to Downloads: ${data.filename}`);
  
  // Re-enable buttons and change text
  if (downloadButton && closeButton && maybeButton) {
    downloadButton.disabled = false;
    closeButton.disabled = false;
    maybeButton.disabled = false;
    
    // Determine platform-specific button text
    const isMac = process.platform === 'darwin';
    const buttonText = isMac ? 'Open Installer (DMG)' : 'Open Installer (EXE)';
    downloadButton.textContent = buttonText;
    downloadButton.classList.remove('btn-primary');
    downloadButton.classList.add('btn-success');
    
    // Update click handler to open installer directly
    downloadButton.onclick = async () => {
      const result = await ipcRenderer.invoke('open-installer', data.filePath);
      if (result.success) {
        showSuccessAlert('Installer opened!', 'Please follow the installation instructions.');
      } else {
        showErrorAlert('Failed to open installer', result.error);
      }
    };
  }
  
  // Remove auto-close modal - let user manually close it
});

ipcRenderer.on('update-download-error', (event, data) => {
  const progressContainer = document.getElementById('updateProgressContainer');
  const downloadButton = document.querySelector('#updateModal .btn-primary');
  const closeButton = document.querySelector('#updateModal .btn-close');
  const maybeButton = document.querySelector('#updateModal .btn-secondary');
  
  // Show error message
  showErrorAlert('Download failed', data.error);
  
  // Reset UI
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }
  
  if (downloadButton && closeButton && maybeButton) {
    downloadButton.disabled = false;
    closeButton.disabled = false;
    maybeButton.disabled = false;
    downloadButton.textContent = 'Retry Download';
  }
});

// Debug function to fetch and display GitHub Gist information
async function fetchGistDebugInfo() {
  try {
    // Check if debug modal elements exist
    const debugElements = [
      'debugCurrentVersion', 'debugGistUrl', 'debugRawResponse', 
      'debugLatestVersion', 'debugIsNewer', 'debugReleaseNotes',
      'debugMacLink', 'debugWinLink'
    ];
    
    for (const elementId of debugElements) {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Debug element not found: ${elementId}`);
      }
    }
    
    // Show current version and URL
    document.getElementById('debugCurrentVersion').textContent = currentVersion;
    document.getElementById('debugGistUrl').textContent = UPDATE_CHECK_URL;
    
    // Clear previous data
    document.getElementById('debugRawResponse').textContent = 'Fetching...';
    document.getElementById('debugLatestVersion').textContent = 'Loading...';
    document.getElementById('debugIsNewer').textContent = 'Loading...';
    document.getElementById('debugReleaseNotes').textContent = 'Loading...';
    
    // Show the modal
    const gistDebugModal = new bootstrap.Modal(document.getElementById('gistDebugModal'));
    gistDebugModal.show();
    
    // Fetch the data
    const response = await fetch(UPDATE_CHECK_URL);
    const rawText = await response.text();
    
    // Display raw response
    document.getElementById('debugRawResponse').textContent = rawText;
    
    // Parse the response (same logic as checkForUpdates)
    const lines = rawText.trim().split('\n');
    let latestVersion = '';
    let releaseNotes = '';
    let macLink = '';
    let winLink = '';
    let collectingReleaseNotes = false;
    
    // Parse the file format
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Latest_Version:')) {
        latestVersion = trimmedLine.substring('Latest_Version:'.length).trim();
        collectingReleaseNotes = false;
      } else if (trimmedLine.startsWith('Download_Link_Mac:')) {
        macLink = trimmedLine.substring('Download_Link_Mac:'.length).trim();
        collectingReleaseNotes = false;
      } else if (trimmedLine.startsWith('Download_Link_Win:')) {
        winLink = trimmedLine.substring('Download_Link_Win:'.length).trim();
        collectingReleaseNotes = false;
      } else if (trimmedLine === 'Release_Notes:') {
        collectingReleaseNotes = true;
        releaseNotes = ''; // Reset release notes
      } else if (collectingReleaseNotes && trimmedLine.length > 0) {
        // Collect all lines after Release_Notes: as release notes, preserving formatting
        releaseNotes += (releaseNotes ? '\n' : '') + trimmedLine;
      }
    }
    
    // Display parsed information
    document.getElementById('debugLatestVersion').textContent = latestVersion || 'Not found';
    
    const isNewer = latestVersion ? isNewerVersion(latestVersion, currentVersion) : false;
    const isNewerBadge = document.getElementById('debugIsNewer');
    isNewerBadge.textContent = latestVersion ? (isNewer ? 'YES' : 'NO') : 'ERROR';
    isNewerBadge.className = `badge ${isNewer ? 'bg-success' : (latestVersion ? 'bg-secondary' : 'bg-danger')}`;
    
    // Display release notes with preserved formatting
    const releaseNotesEl = document.getElementById('debugReleaseNotes');
    if (releaseNotes) {
      // Use innerHTML to preserve line breaks
      releaseNotesEl.innerHTML = releaseNotes.replace(/\n/g, '<br>');
    } else {
      releaseNotesEl.textContent = 'No release notes found';
    }
    
    // Update download links
    const macLinkEl = document.getElementById('debugMacLink');
    const winLinkEl = document.getElementById('debugWinLink');
    
    if (macLink) {
      macLinkEl.href = macLink;
      macLinkEl.textContent = macLink;
      macLinkEl.style.display = 'inline';
    } else {
      macLinkEl.textContent = 'Not found';
      macLinkEl.style.display = 'inline';
      macLinkEl.removeAttribute('href');
    }
    
    if (winLink) {
      winLinkEl.href = winLink;
      winLinkEl.textContent = winLink;
      winLinkEl.style.display = 'inline';
    } else {
      winLinkEl.textContent = 'Not found';
      winLinkEl.style.display = 'inline';
      winLinkEl.removeAttribute('href');
    }
    
    logBasic('info', 'GitHub debug info fetched', { 
      latestVersion: latestVersion || 'none', 
      isNewer, 
      releaseNotesLength: releaseNotes.length,
      macLink: macLink || 'none',
      winLink: winLink || 'none'
    });
    
  } catch (error) {
    console.error('Debug function error:', error);
    
    // Try to show error in modal if it exists, otherwise use alert
    const errorElement = document.getElementById('debugRawResponse');
    if (errorElement) {
      errorElement.textContent = `Error: ${error.message}`;
      const gistDebugModal = new bootstrap.Modal(document.getElementById('gistDebugModal'));
      gistDebugModal.show();
    } else {
      alert(`Debug Error: ${error.message}`);
    }
    
    logBasic('error', 'Failed to fetch GitHub debug info', { error: error.message });
  }
}

// Debug function to fetch and display UI System information
async function fetchUIDebugInfo() {
  const debugContent = document.getElementById('uiDebugContent');
  const cacheStatus = document.getElementById('uiCacheStatus');
  const rawDataContent = document.getElementById('uiRawData');
  
  // Status summary elements
  const otaCurrentState = document.getElementById('otaCurrentState');
  const otaCurrentVersion = document.getElementById('otaCurrentVersion');
  const otaEnabledStatus = document.getElementById('otaEnabledStatus');
  const cacheDirectoryStatus = document.getElementById('cacheDirectoryStatus');
  const cachedVersionStatus = document.getElementById('cachedVersionStatus');
  const cacheFilesStatus = document.getElementById('cacheFilesStatus');
  
  if (!debugContent || !cacheStatus || !rawDataContent) {
    console.error('UI Debug elements not found');
    return;
  }
  
  const timestamp = new Date().toLocaleString();
  
  // Update status summary cards
  if (otaCurrentState) {
    otaCurrentState.textContent = otaStatus.state || 'Unknown';
    otaCurrentState.className = `badge ${getStatusBadgeClass(otaStatus.state)}`;
  }
  if (otaCurrentVersion) {
    otaCurrentVersion.textContent = otaStatus.version || getCurrentUIVersion() || 'N/A';
  }
  if (otaEnabledStatus) {
    otaEnabledStatus.textContent = appSettings.enableOTA ? '✅ Enabled' : '❌ Disabled';
  }
  
  // Generate detailed network diagnostics
  let debugInfo = `╔═══════════════════════════════════════════════════════════╗\n`;
  debugInfo += `║              UI OTA NETWORK DIAGNOSTICS                  ║\n`;
  debugInfo += `║              Generated: ${timestamp.padEnd(25)} ║\n`;
  debugInfo += `╚═══════════════════════════════════════════════════════════╝\n\n`;
  
  try {
    debugInfo += `┌─ NETWORK CONNECTIVITY TEST ─────────────────────────────┐\n`;
    debugInfo += `│ Testing UI version endpoint...                          │\n`;
    debugInfo += `└─────────────────────────────────────────────────────────┘\n`;
    debugInfo += `🌐 Endpoint: ${UI_VERSION_URL}\n`;
    
    const response = await fetch(UI_VERSION_URL);
    debugInfo += `📊 Status: ${response.status} ${response.statusText}\n`;
    debugInfo += `⏱️  Response Time: ${Date.now() - performance.now()}ms (approx)\n`;
    debugInfo += `📋 Headers:\n`;
    
    for (const [key, value] of response.headers.entries()) {
      debugInfo += `   ${key}: ${value}\n`;
    }
    
    if (response.ok) {
      const uiVersionText = await response.text();
      const remoteVersion = uiVersionText.trim();
      const currentVersion = getCurrentUIVersion();
      const isNewer = isNewerVersion(remoteVersion, currentVersion);
      
      debugInfo += `\n┌─ VERSION ANALYSIS ──────────────────────────────────────┐\n`;
      debugInfo += `│ Remote Version: ${remoteVersion.padEnd(42)} │\n`;
      debugInfo += `│ Current Version: ${currentVersion.padEnd(41)} │\n`;
      debugInfo += `│ Bundled Version: ${THIS_UI_VERSION.padEnd(41)} │\n`;
      debugInfo += `│ Binary Version: ${packageJson.version.padEnd(42)} │\n`;
      debugInfo += `│ Update Available: ${(isNewer ? 'YES' : 'NO').padEnd(39)} │\n`;
      debugInfo += `│ First Launch: ${(isFirstLaunchOfBinary ? 'YES' : 'NO').padEnd(43)} │\n`;
      debugInfo += `└─────────────────────────────────────────────────────────┘\n\n`;
      
      rawDataContent.textContent = `Remote Version Response:\n${uiVersionText}\n\nResponse Headers:\n${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`;
    } else {
      debugInfo += `\n❌ VERSION CHECK FAILED\n`;
      debugInfo += `   Unable to retrieve remote version information\n\n`;
      rawDataContent.textContent = `Error: ${response.status} ${response.statusText}`;
    }
    
    // Test UI file endpoints
    debugInfo += `┌─ FILE ENDPOINT TESTING ─────────────────────────────────┐\n`;
    
    const uiFiles = [
      { name: 'index.html', url: `${UI_FILES_BASE_URL}index.html` },
      { name: 'renderer.js', url: `${UI_FILES_BASE_URL}renderer.js` },
      { name: 'package.json', url: `${UI_FILES_BASE_URL}package.json` }
    ];
    
    for (const file of uiFiles) {
      try {
        debugInfo += `├─ Testing: ${file.name.padEnd(45)} │\n`;
        const testResponse = await fetch(file.url, { method: 'HEAD' });
        debugInfo += `│  Status: ${testResponse.status} ${testResponse.statusText.padEnd(35)} │\n`;
        debugInfo += `│  Accessible: ${(testResponse.ok ? '✅ YES' : '❌ NO').padEnd(38)} │\n`;
        
        if (testResponse.ok) {
          const contentLength = testResponse.headers.get('content-length');
          if (contentLength) {
            const sizeKB = (parseInt(contentLength) / 1024).toFixed(1);
            debugInfo += `│  Size: ${(sizeKB + ' KB').padEnd(43)} │\n`;
          }
          const lastModified = testResponse.headers.get('last-modified');
          if (lastModified) {
            debugInfo += `│  Modified: ${lastModified.padEnd(39)} │\n`;
          }
        }
        debugInfo += `├─────────────────────────────────────────────────────────┤\n`;
      } catch (error) {
        debugInfo += `│  Error: ${error.message.padEnd(42)} │\n`;
        debugInfo += `├─────────────────────────────────────────────────────────┤\n`;
      }
    }
    debugInfo += `└─────────────────────────────────────────────────────────┘\n\n`;
    
  } catch (error) {
    debugInfo += `❌ NETWORK ERROR:\n`;
    debugInfo += `   ${error.message}\n`;
    debugInfo += `   Stack: ${error.stack}\n\n`;
    rawDataContent.textContent = `Network Error: ${error.message}`;
  }
  
  // Add OTA Status Information
  debugInfo += `┌─ OTA SYSTEM STATUS ─────────────────────────────────────┐\n`;
  debugInfo += `│ State: ${otaStatus.state.padEnd(47)} │\n`;
  debugInfo += `│ Message: ${(otaStatus.message || 'None').padEnd(45)} │\n`;
  debugInfo += `│ Version: ${(otaStatus.version || 'N/A').padEnd(45)} │\n`;
  debugInfo += `│ Error: ${(otaStatus.error || 'None').padEnd(47)} │\n`;
  debugInfo += `│ OTA Enabled: ${(appSettings.enableOTA ? 'Yes' : 'No').padEnd(41)} │\n`;
  debugInfo += `│ Pending Files: ${(pendingOTAFiles.files ? 'Yes' : 'No').padEnd(39)} │\n`;
  debugInfo += `└─────────────────────────────────────────────────────────┘\n`;
  
  debugContent.textContent = debugInfo;
  
  // Add OTA Status Information
  debugInfo += `\n🔄 OTA Status Information:\n`;
  debugInfo += `   State: ${otaStatus.state}\n`;
  debugInfo += `   Message: ${otaStatus.message}\n`;
  debugInfo += `   Version: ${otaStatus.version || 'N/A'}\n`;
  debugInfo += `   Error: ${otaStatus.error || 'None'}\n`;
  debugInfo += `   Binary Version: ${packageJson.version}\n`;
  debugInfo += `   First Launch: ${isFirstLaunchOfBinary ? 'Yes' : 'No'}\n`;
  debugInfo += `   OTA Enabled: ${appSettings.enableOTA ? 'Yes' : 'No'}\n\n`;
  
  // Check local cache status
  let cacheInfo = `=== Local Cache Status ===\n\n`;
  cacheInfo += `📁 Cache Directory: ${LOCAL_UI_CACHE_DIR}\n`;
  
  try {
    if (fs.existsSync(LOCAL_UI_CACHE_DIR)) {
      cacheInfo += `✅ Cache directory exists\n`;
      
      const versionFile = path.join(LOCAL_UI_CACHE_DIR, 'ui-version.txt');
      if (fs.existsSync(versionFile)) {
        const cachedVersion = fs.readFileSync(versionFile, 'utf8').trim();
        cacheInfo += `📋 Cached version: ${cachedVersion}\n`;
      } else {
        cacheInfo += `❌ No cached version file\n`;
      }
      
      const requiredFiles = ['index.html', 'renderer.js', 'ui-version.txt'];
      cacheInfo += `\n📄 Required cached files:\n`;
      
      for (const file of requiredFiles) {
        const filePath = path.join(LOCAL_UI_CACHE_DIR, file);
        const exists = fs.existsSync(filePath);
        cacheInfo += `   ${file}: ${exists ? '✅' : '❌'} ${exists ? 'EXISTS' : 'MISSING'}\n`;
        
        if (exists) {
          try {
            const stats = fs.statSync(filePath);
            cacheInfo += `      Size: ${(stats.size / 1024).toFixed(1)} KB\n`;
            cacheInfo += `      Modified: ${stats.mtime.toLocaleString()}\n`;
            
            // For HTML and JS files, check if they contain version info
            if (file === 'index.html' && stats.size > 0) {
              const content = fs.readFileSync(filePath, 'utf8');
              const metaVersion = content.match(/content="([^"]+)"/)?.[1];
              if (metaVersion) {
                cacheInfo += `      HTML version: ${metaVersion}\n`;
              }
            }
            
            if (file === 'renderer.js' && stats.size > 0) {
              const content = fs.readFileSync(filePath, 'utf8');
              const jsVersion = content.match(/THIS_UI_VERSION = '([^']+)'/)?.[1];
              if (jsVersion) {
                cacheInfo += `      JS version: ${jsVersion}\n`;
              }
            }
          } catch (fileError) {
            cacheInfo += `      Error reading: ${fileError.message}\n`;
          }
        }
      }
      
      const files = fs.readdirSync(LOCAL_UI_CACHE_DIR);
      cacheInfo += `\n� All files in cache: ${files.join(', ')}\n`;
      
      for (const file of files) {
        const filePath = path.join(LOCAL_UI_CACHE_DIR, file);
        const stats = fs.statSync(filePath);
        cacheInfo += `   ${file}: ${(stats.size / 1024).toFixed(1)} KB, modified: ${stats.mtime.toLocaleString()}\n`;
      }
    } else {
      cacheInfo += `❌ Cache directory does not exist\n`;
    }
  } catch (error) {
    cacheInfo += `❌ Cache check error: ${error.message}\n`;
  }
  
  debugContent.textContent = debugInfo;
  cacheStatus.textContent = cacheInfo;
  logVerbose('info', 'UI debug info refreshed');
  
  // Open the UI debug modal
  try {
    const uiDebugModal = document.getElementById('uiDebugModal');
    if (uiDebugModal) {
      const modal = new bootstrap.Modal(uiDebugModal);
      modal.show();
    } else {
      console.error('UI Debug modal element not found');
      alert('UI Debug modal not found');
    }
  } catch (error) {
    console.error('Error opening UI debug modal:', error);
    alert('Error opening UI debug modal: ' + error.message);
  }
}

// Ensure Documents folder exists
const docsDir = path.dirname(defaultFilePath);
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Logging system
const logDir = path.join(os.homedir(), 'Documents', 'LectureLogger-Logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFilePath = path.join(logDir, 'log.txt');

// Basic logging function (only when verbose logging is enabled)
function log(level, message, data = null) {
  if (!appSettings.verboseLogging) return; // Only log when verbose logging is enabled
  
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}\n`;
  
  try {
    fs.appendFileSync(logFilePath, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Verbose logging function (only when enabled)
function logVerbose(level, message, data = null) {
  if (appSettings.verboseLogging) {
    log(level, message, data);
  }
}

// Basic logging function (only when verbose logging is enabled)
function logBasic(level, message, data = null) {
  if (appSettings.verboseLogging) {
    log(level, message, data);
  }
}

// Log file rotation when verbose logging is disabled
function rotateLogFile() {
  if (fs.existsSync(logFilePath)) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const archivedLogPath = path.join(logDir, `log(${date}).txt`);
    
    try {
      // If archived file already exists, append a number
      let counter = 1;
      let finalArchivedPath = archivedLogPath;
      while (fs.existsSync(finalArchivedPath)) {
        finalArchivedPath = path.join(logDir, `log(${date})-${counter}.txt`);
        counter++;
      }
      
      fs.renameSync(logFilePath, finalArchivedPath);
      logBasic('info', `Log file rotated to: ${finalArchivedPath}`);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }
}

// Map of module codes → knowledge codes
const moduleKnowledgeMap = {
  "N/A": "N/A",
  "DIG4143": "K1, K2, K8, S2",
  "CMP4286": "K4, K5, S3",
  "ENG4098": "K6, S2",
  "ENG5139": "K1, K6",
  "CMP5346": "K4, K5, S1, S3",
  "CMP5347": "S2",
  "CMP5345": "K4, K5, S1, S3",
  "CMP5348": "K3, S2",
  "DIG5130": "K2",
  "DIG6204": "K1, K2, K3, K8",
  "CMP6195": "K4, K5, S1, S3",
  "DIG6209": "K1",
  "DIG6202": "K2, K8, S1, S2, S3",
  "DIG6203": "K7, K8, B1, B2"
};

// Module selection updates KS&B field
document.getElementById('module').addEventListener('change', function() {
  const selectedModule = this.value;
  const knowledgeField = document.getElementById('knowledge');
  const mappedKnowledge = moduleKnowledgeMap[selectedModule] || '';
  knowledgeField.value = mappedKnowledge;
  
  logVerbose('debug', 'Module selection changed', { module: selectedModule, knowledge: mappedKnowledge });
});

// Handle conditional display of outside working hours field
document.getElementById('completed').addEventListener('change', function() {
  const withinWorkingHours = this.value;
  const outsideField = document.getElementById('outsideWorkingHoursField');
  const outsideSelect = document.getElementById('assessment');
  const saveButtonContainer = document.getElementById('saveButtonContainer');
  
  if (withinWorkingHours === 'No') {
    // Show the outside working hours field
    outsideField.style.display = 'block';
    outsideSelect.value = 'Yes'; // Default to Yes when shown
    // Change button to right-aligned in a 6-column layout
    saveButtonContainer.className = 'col-md-6 d-flex align-items-end justify-content-end';
    logVerbose('debug', 'Outside working hours field shown');
  } else {
    // Hide the outside working hours field
    outsideField.style.display = 'none';
    outsideSelect.value = 'Not Applicable'; // Set to Not Applicable when hidden
    // Change button to center-aligned across full width
    saveButtonContainer.className = 'col-12 d-flex justify-content-center';
    logVerbose('debug', 'Outside working hours field hidden');
  }
});

// Lecture form submission - dummy version (no Excel functionality)
document.getElementById('lecture-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  logVerbose('info', 'Form submission started (dummy mode)');

  // Keep file path for UI compatibility
  const currentFilePath = appSettings.excelPath || defaultFilePath;

  // Collect form data but don't save to Excel
  const date = document.getElementById('date').value;
  const location = document.getElementById('location').value;
  const type = document.getElementById('type').value;
  const module = document.getElementById('module').value;
  const summary = document.getElementById('summary').value;
  const description = document.getElementById('description').value;
  const next = document.getElementById('next').value;
  const length = document.getElementById('length').value;
  const completed = document.getElementById('completed').value;
  
  // Handle outside working hours logic
  let assessment;
  if (completed === 'Yes') {
    assessment = 'Not Applicable';
  } else {
    assessment = document.getElementById('assessment').value;
  }

  // Format date dd/mm/yyyy
  const d = new Date(date);
  const formattedDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

  // Academic year yy/yy
  const academicYear = (d.getMonth()+1 >= 9)
    ? `${d.getFullYear().toString().slice(-2)}/${(d.getFullYear()+1).toString().slice(-2)}`
    : `${(d.getFullYear()-1).toString().slice(-2)}/${d.getFullYear().toString().slice(-2)}`;

  const knowledgeCode = moduleKnowledgeMap[module] || "AUTO";

  // Store form data as variables (not saved to Excel)
  const formData = {
    date: formattedDate,
    academicYear,
    location,
    type,
    module,
    summary,
    description,
    knowledgeCode,
    next,
    length: Number(length),
    completed,
    assessment,
    filePath: currentFilePath
  };
  
  logBasic('info', 'Lecture entry collected (dummy mode)', formData);
  logVerbose('debug', 'Form data processed (dummy mode)', formData);

  // Show success notification (dummy)
  const fileName = path.basename(currentFilePath);
  showSuccessAlert(
    `Lecture entry collected successfully!`,
    `Data saved as variables (Excel functionality disabled)`
  );
  
  // Clear the form for next entry
  document.getElementById('lecture-form').reset();
  document.getElementById('date').valueAsDate = new Date();
});

// Load settings from localStorage or show setup modal
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem('lectureLoggerSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Validate that essential settings exist
      if (parsedSettings && typeof parsedSettings === 'object') {
        appSettings = { ...appSettings, ...parsedSettings };
        
        // Only log if verbose logging is enabled
        if (appSettings.verboseLogging) {
          logBasic('info', 'Settings loaded successfully', { verboseLogging: appSettings.verboseLogging });
        }
        return true; // Settings exist and are valid
      }
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
    // Clear corrupted settings
    localStorage.removeItem('lectureLoggerSettings');
  }
  
  // Only log if verbose logging is enabled (though it won't be on first run)
  return false; // First run or corrupted settings
}

// Save settings to localStorage
async function saveSettings(excelPath, startingRow, verboseLogging, autoUpdateCheck, enableOTA, testVersion = '') {
  const wasVerboseLogging = appSettings.verboseLogging;
  const wasOTAEnabled = appSettings.enableOTA;
  
  appSettings = {
    excelPath: excelPath,
    startingRow: parseInt(startingRow),
    verboseLogging: verboseLogging,
    autoUpdateCheck: autoUpdateCheck,
    enableOTA: enableOTA,
    testVersion: testVersion
  };
  
  localStorage.setItem('lectureLoggerSettings', JSON.stringify(appSettings));
  
  // Handle OTA toggle - delete cache when disabled
  if (wasOTAEnabled && !enableOTA) {
    // OTA was enabled, now disabled - delete cache
    console.log('OTA disabled - deleting UI cache...');
    const deleteResult = await deleteUICache();
    if (deleteResult.success) {
      showSuccessAlert('OTA Updates Disabled', 'UI cache has been cleared');
    } else {
      showErrorAlert('Cache Cleanup Warning', 'Could not delete UI cache: ' + deleteResult.error);
    }
  } else if (!wasOTAEnabled && enableOTA) {
    // OTA was disabled, now enabled
    console.log('OTA enabled - cache will be created when needed');
    showSuccessAlert('OTA Updates Enabled', 'UI updates will now be cached automatically');
  }
  
  // Handle verbose logging toggle
  if (wasVerboseLogging && !verboseLogging) {
    // Was enabled, now disabled - rotate log file (but don't log about it since logging is now off)
    rotateLogFile();
  } else if (!wasVerboseLogging && verboseLogging) {
    // Was disabled, now enabled - start logging
    logBasic('info', 'Verbose logging enabled');
  }
  
  // Only log if verbose logging is still enabled
  if (verboseLogging) {
    logBasic('info', 'Settings saved successfully', appSettings);
  }
}

// Check version and show release notes if updated
let pendingReleaseNotes = false;

function checkVersionAndShowReleaseNotes() {
  const savedVersion = localStorage.getItem('lectureLoggerVersion');
  const savedBuildNumber = localStorage.getItem('lectureLoggerBuildNumber');
  const currentBuildNumber = packageJson.buildNumber;
  
  // Check if this is a binary update (app version or build number changed)
  const isBinaryUpdate = savedVersion && savedBuildNumber && 
    (savedVersion !== currentVersion || savedBuildNumber !== currentBuildNumber);
  
  // Only show release notes if this is truly a version change (not just missing localStorage)
  if (savedVersion && savedVersion !== currentVersion) {
    // Version has actually changed
    localStorage.setItem('lectureLoggerVersion', currentVersion);
    localStorage.setItem('lectureLoggerBuildNumber', currentBuildNumber);
    
    // Mark that we need to show release notes
    pendingReleaseNotes = true;
    
    // Only show immediately if settings aren't needed
    const savedSettings = localStorage.getItem('lectureLoggerSettings');
    if (savedSettings) {
      // Settings exist, check for updates first to show full update modal if available
      setTimeout(() => {
        checkForUpdates(false).then(() => {
          // If no update was found, show release notes for current version
          if (pendingReleaseNotes) {
            showReleaseNotes();
            pendingReleaseNotes = false;
          }
          // If an update was found, the update modal will show automatically
        }).catch(() => {
          // If update check fails, still show release notes
          if (pendingReleaseNotes) {
            showReleaseNotes();
            pendingReleaseNotes = false;
          }
        });
      }, 1000);
    }
    // If no settings, release notes will show after initial setup
  } else if (!savedVersion) {
    // First run - just set version without showing release notes
    localStorage.setItem('lectureLoggerVersion', currentVersion);
    localStorage.setItem('lectureLoggerBuildNumber', currentBuildNumber);
  } else if (savedBuildNumber !== currentBuildNumber) {
    // Only build number changed (not version) - still a binary update
    localStorage.setItem('lectureLoggerBuildNumber', currentBuildNumber);
  }
}

// Show release notes modal
function showReleaseNotes() {
  try {
    // Check if elements exist
    const releaseVersionEl = document.getElementById('releaseVersion');
    const notesContentEl = document.getElementById('releaseNotesContent');
    const releaseModalEl = document.getElementById('releaseNotesModal');
    
    if (!releaseVersionEl || !notesContentEl || !releaseModalEl) {
      alert('Release notes modal elements not found');
      return;
    }
    
    // Get all release notes sorted by version (newest first)
    const sortedVersions = Object.keys(releaseNotes).sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aNum = aParts[i] || 0;
        const bNum = bParts[i] || 0;
        if (aNum !== bNum) return bNum - aNum; // Descending order
      }
      return 0;
    });
    
    if (sortedVersions.length === 0) {
      alert('No release notes available');
      return;
    }
    
    // Set the modal title to show all releases
    releaseVersionEl.textContent = `Release Notes - All Versions`;
    
    let notesHtml = '';
    
    // Show the newest version first (current version)
    const newestVersion = sortedVersions[0];
    const newestNotes = releaseNotes[newestVersion];
    
    notesHtml += `
      <div class="mb-4">
        <h5 class="text-primary">Version ${newestVersion} - ${newestNotes.title}</h5>
        <ul class="list-unstyled ms-3">
          ${newestNotes.notes.map(note => `<li class="mb-1">${note}</li>`).join('')}
        </ul>
      </div>
    `;
    
    // Add older versions in a collapsible section if there are more
    if (sortedVersions.length > 1) {
      notesHtml += `
        <div class="accordion" id="olderReleasesAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header" id="olderReleasesHeading">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#olderReleasesCollapse" aria-expanded="false" aria-controls="olderReleasesCollapse">
                Previous Releases (${sortedVersions.length - 1})
              </button>
            </h2>
            <div id="olderReleasesCollapse" class="accordion-collapse collapse" aria-labelledby="olderReleasesHeading" data-bs-parent="#olderReleasesAccordion">
              <div class="accordion-body">
      `;
      
      // Add all older versions
      for (let i = 1; i < sortedVersions.length; i++) {
        const version = sortedVersions[i];
        const versionNotes = releaseNotes[version];
        
        notesHtml += `
          <div class="mb-3 ${i < sortedVersions.length - 1 ? 'border-bottom pb-3' : ''}">
            <h6 class="text-secondary">Version ${version} - ${versionNotes.title}</h6>
            <ul class="list-unstyled ms-3">
              ${versionNotes.notes.map(note => `<li class="mb-1 small">${note}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      notesHtml += `
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    notesContentEl.innerHTML = notesHtml;
    
    const releaseModal = new bootstrap.Modal(releaseModalEl);
    releaseModal.show();
    
    logBasic('info', 'Release notes modal displayed', { totalVersions: sortedVersions.length });
  } catch (error) {
    console.error('Error in showReleaseNotes:', error);
    alert(`Error showing release notes: ${error.message}`);
  }
}

// OTA notification functions - global scope
function showOTANotification() {
  const notification = document.getElementById('uiUpdateNotification');
  if (notification) {
    notification.style.display = 'block';
    notification.classList.add('show');
    
    logBasic('info', 'Showing OTA notification to user for approval');
    
    // No auto-hide - user must make a choice
  }
}

// Helper function for status badge classes
function getStatusBadgeClass(state) {
  switch (state) {
    case 'checking': return 'bg-info';
    case 'downloading': return 'bg-warning';
    case 'ready': return 'bg-success';
    case 'failed': return 'bg-danger';
    case 'disabled': return 'bg-secondary';
    default: return 'bg-secondary';
  }
}

// Show settings modal on first run
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize cache directory first
  await initializeCacheDir();
  
  // Check binary version and handle first launch
  checkBinaryVersionFirstLaunch();
  
  // Initialize UI system
  const uiStatus = loadUIFiles();
  logVerbose('info', 'UI system initialized', uiStatus);
  
  // Verify UI version consistency
  verifyUIVersionConsistency();
  
  // Check for UI updates in background (skip in development mode)
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (appSettings.autoUpdateCheck && !isDevelopment) {
    setTimeout(async () => {
      try {
        const uiUpdateResult = await checkUIVersion();
        if (uiUpdateResult.updated && !uiUpdateResult.silent) {
          logBasic('info', 'UI updated in background', uiUpdateResult);
          
          // Show subtle refresh notification only if validation passed
          showOTANotification();
        } else if (uiUpdateResult.silent) {
          logBasic('info', 'UI update available but validation failed - not showing notification', uiUpdateResult);
        }
      } catch (error) {
        logVerbose('warn', 'Background UI update check failed', { error: error.message });
      }
    }, 3000); // Check after 3 seconds
  } else if (isDevelopment) {
    console.log('Development mode - skipping UI update checks');
  }
  // Only log if verbose logging is enabled (check after loading settings)
  
  if (!loadSettings()) {
    // Ensure Bootstrap is loaded before creating modal
    if (typeof bootstrap !== 'undefined') {
      try {
        const initialSetupModal = new bootstrap.Modal(document.getElementById('initialSetupModal'));
        initialSetupModal.show();
        logVerbose('info', 'Initial setup modal shown for first run');
      } catch (error) {
        console.error('Error showing initial setup modal:', error);
        // Fallback: Show an alert if modal fails
        alert('Welcome to Lecture Logger! Please configure your Excel file path in Settings (⚙️ button).');
      }
    } else {
      console.error('Bootstrap not loaded when trying to show initial setup modal');
      // Fallback: Show an alert if Bootstrap is not available
      alert('Welcome to Lecture Logger! Please configure your Excel file path in Settings (⚙️ button).');
    }
    // Don't log on first run since verbose logging won't be enabled yet
  }
  
  // Check version and show release notes if updated
  checkVersionAndShowReleaseNotes();
  
  // Header click handling for developer access - attach to the h3 title specifically
  let clickCount = 0;
  let clickTimer = null;
  
  // Create a more specific click handler that works on the title text
  const headerTitle = document.querySelector('#headerBar h3');
  if (headerTitle) {
    headerTitle.style.cursor = 'default';
    headerTitle.addEventListener('click', function(event) {
      clickCount++;
      console.log('Header title clicked, count:', clickCount);
      
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      
      clickTimer = setTimeout(() => {
        console.log('Timer fired, final count:', clickCount);
        if (clickCount === 4) {
          console.log('Showing developer access modal');
          // Show developer access modal
          showDeveloperAccessModal();
        }
        clickCount = 0;
      }, 500); // Reset after 500ms
    });
  }
  
  // Also keep the original header click handler as backup
  document.getElementById('headerBar').addEventListener('click', function(event) {
    // Only count clicks if not on buttons
    if (event.target.id !== 'devSettingsBtn' && event.target.id !== 'infoBtn') {
      clickCount++;
      console.log('Header clicked, count:', clickCount);
      
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      
      clickTimer = setTimeout(() => {
        console.log('Timer fired, final count:', clickCount);
        if (clickCount === 4) {
          console.log('Showing developer access modal');
          // Show developer access modal
          showDeveloperAccessModal();
        }
        clickCount = 0;
      }, 500); // Reset after 500ms
    }
  });
  
  // Dev button to trigger settings modal - moved inside DOMContentLoaded to ensure element exists
  const devSettingsBtn = document.getElementById('devSettingsBtn');
  if (devSettingsBtn) {
    devSettingsBtn.addEventListener('click', function(event) {
      event.stopPropagation(); // Prevent header click counting
      logBasic('info', 'Settings button clicked');
      
      try {
        // Populate current settings in the modal
        const excelPathEl = document.getElementById('excelPath');
        const startingRowEl = document.getElementById('startingRow');
        const verboseLoggingEl = document.getElementById('verboseLogging');
        const autoUpdateCheckEl = document.getElementById('autoUpdateCheck');
        const enableOTAToggleEl = document.getElementById('enableOTAToggle');
        
        if (excelPathEl) excelPathEl.value = appSettings.excelPath || '';
        if (startingRowEl) startingRowEl.value = appSettings.startingRow || 125;
        if (verboseLoggingEl) verboseLoggingEl.checked = appSettings.verboseLogging || false;
        if (autoUpdateCheckEl) autoUpdateCheckEl.checked = appSettings.autoUpdateCheck !== false; // Default to true
        if (enableOTAToggleEl) enableOTAToggleEl.checked = appSettings.enableOTA !== false; // Default to true
        
        const settingsModalEl = document.getElementById('settingsModal');
        if (settingsModalEl) {
          if (typeof bootstrap !== 'undefined') {
            const settingsModal = new bootstrap.Modal(settingsModalEl);
            settingsModal.show();
            logVerbose('info', 'Settings modal opened via dev button');
          } else {
            console.error('Bootstrap not loaded');
            alert('Bootstrap library not loaded - cannot show modal');
          }
        } else {
          console.error('Settings modal element not found');
          alert('Settings modal not found in DOM');
        }
      } catch (error) {
        console.error('Error opening settings modal:', error);
        alert('Error opening settings: ' + error.message);
      }
    });
  } else {
    console.error('Dev settings button not found');
  }
  
  // Initial setup file browser functionality
  document.getElementById('initialBrowseFileBtn').addEventListener('click', function() {
    document.getElementById('initialFileInput').click();
  });
  
  // Initial setup file input change handler
  document.getElementById('initialFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const errorDiv = document.getElementById('initialFilePathError');
    const pathInput = document.getElementById('initialExcelPath');
    
    if (file) {
      const filePath = file.path;
      
      // Validate that it's an .xlsx file
      if (!filePath.toLowerCase().endsWith('.xlsx')) {
        pathInput.value = '';
        alert('❌ Invalid File Type\n\nOnly Excel (.xlsx) files are supported. Please select a valid Excel file.');
        return;
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        pathInput.value = '';
        errorDiv.textContent = 'Selected file does not exist.';
        errorDiv.style.display = 'block';
        pathInput.classList.add('is-invalid');
        return;
      }
      
      // Valid file
      pathInput.value = filePath;
      errorDiv.style.display = 'none';
      pathInput.classList.remove('is-invalid');
      pathInput.classList.add('is-valid');
    }
  });
  
  // Settings file browser functionality
  document.getElementById('browseFileBtn').addEventListener('click', function() {
    document.getElementById('fileInput').click();
  });
  
  // Settings file input change handler
  document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const errorDiv = document.getElementById('filePathError');
    const pathInput = document.getElementById('excelPath');
    
    if (file) {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        pathInput.value = '';
        alert('❌ Invalid File Type\n\nOnly Excel (.xlsx) files are supported. Please select a valid Excel file.');
        logBasic('warning', 'Invalid file type selected', { fileName: file.name });
        return;
      }
      
      // Clear any previous errors
      errorDiv.style.display = 'none';
      pathInput.classList.remove('is-invalid');
      pathInput.classList.add('is-valid');
      
      // Set the file path
      pathInput.value = file.path;
      
      logBasic('info', 'Valid Excel file selected', { fileName: file.name, path: file.path });
    }
  });
  
  // Clear validation styling when user types
  document.getElementById('excelPath').addEventListener('input', function() {
    const errorDiv = document.getElementById('filePathError');
    this.classList.remove('is-invalid', 'is-valid');
    errorDiv.style.display = 'none';
  });
  
  // Help button to open GitHub issues page
  document.getElementById('helpBtn').addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent header click counting
    logBasic('info', 'Help button clicked');
    
    // Open GitHub issues page in external browser
    shell.openExternal('https://github.com/andrew-jolley/lecture-logger/issues/new');
  });
  
  // Info button to show About modal - moved inside DOMContentLoaded
  const infoBtn = document.getElementById('infoBtn');
  if (infoBtn) {
    infoBtn.addEventListener('click', async function(event) {
      event.stopPropagation(); // Prevent header click counting
      logBasic('info', 'Info button clicked');
      
      try {
        // Load version and build info from package.json
        const buildDate = new Date().toLocaleDateString('en-GB');
        const electronVersion = process.versions.electron;
        const buildNumber = packageJson.buildNumber || 'dev';
        const uiVersion = getCurrentUIVersion();
        const uiStatus = loadUIFiles();
        
        // Update about modal with current versions
        const aboutModalEl = document.getElementById('aboutModal');
        if (aboutModalEl) {
          if (typeof bootstrap !== 'undefined') {
            const aboutModal = new bootstrap.Modal(aboutModalEl);
            
            // Get UI source type (cached or bundled)
            const uiSource = await ipcRenderer.invoke('get-ui-source');
            const uiSourceLabel = uiSource === 'cached' ? 'cached' : 'bundled';
            
            // Update version info in about modal
            const versionInfo = document.querySelector('#aboutModal .modal-body');
            if (versionInfo) {
              // Update the HTML content with the previous larger style format plus acknowledgements
              versionInfo.innerHTML = `
                <div class="text-center mb-3">
                  <h4 class="text-primary">📚 Lecture Logger</h4>
                  <p class="text-muted">Version ${currentVersion} (${buildNumber})</p>
                  <p class="text-muted">UI Version: ${uiVersion} ${uiStatus.hasUpdate ? '(Updated - restart to apply)' : `(${uiSourceLabel})`}</p>
                  <p class="text-muted">Electron ${electronVersion} • Built ${buildDate}</p>
                </div>
                <hr>
                <div class="mb-3">
                  <p class="mb-2"><strong>🎓 Acknowledgements:</strong></p>
                  <p class="small text-muted mb-1">Built with Electron framework for cross-platform compatibility</p>
                  <p class="small text-muted mb-1">Bootstrap for modern UI components and responsive design</p>
                  <p class="small text-muted mb-1">ExcelJS library for spreadsheet integration functionality</p>
                  <p class="small text-muted mb-0">GitHub for version control, hosting, and OTA update distribution</p>
                </div>
              `;
            }
            
            aboutModal.show();
            logVerbose('info', 'About modal opened via info button');
          } else {
            throw new Error('Bootstrap not loaded');
          }
        } else {
          throw new Error('About modal element not found');
        }
      } catch (error) {
        console.error('Error opening about modal:', error);
        alert('Error opening About: ' + error.message);
      }
    });
  } else {
    console.error('Info button not found');
  }
  
  // View Release Notes button in About modal - moved inside DOMContentLoaded
  const viewReleaseNotesBtn = document.getElementById('viewReleaseNotesBtn');
  if (viewReleaseNotesBtn) {
    viewReleaseNotesBtn.addEventListener('click', function() {
      // Close the About modal first
      const aboutModal = bootstrap.Modal.getInstance(document.getElementById('aboutModal'));
      if (aboutModal) {
        aboutModal.hide();
      }
      
      // Show release notes after About modal closes
      setTimeout(() => {
        showReleaseNotes();
      }, 300); // Wait for About modal to close
    });
  }
  
  // Check for Updates button in About modal
  document.getElementById('checkUpdatesBtn').addEventListener('click', function() {
    logBasic('info', 'Check for updates button clicked from About modal');
    checkForUpdates(true); // Manual check
  });
  
  // Refresh button in Gist debug modal
  document.getElementById('refreshGistData').addEventListener('click', function() {
    logBasic('info', 'Refresh Gist data button clicked');
    fetchGistDebugInfo();
  });
  
  // Handle initial setup form submission
  document.getElementById('saveInitialSetup').addEventListener('click', async function() {
    const excelPath = document.getElementById('initialExcelPath').value;
    const startingRow = document.getElementById('initialStartingRow').value;
    const errorDiv = document.getElementById('initialFilePathError');
    const pathInput = document.getElementById('initialExcelPath');
    
    // Validate Excel file path
    if (!excelPath) {
      errorDiv.textContent = '❌ Error: Please select an Excel file path.';
      errorDiv.style.display = 'block';
      pathInput.classList.add('is-invalid');
      return;
    }
    
    // Validate file extension
    if (!excelPath.toLowerCase().endsWith('.xlsx')) {
      alert('❌ Invalid File Type\n\nOnly Excel (.xlsx) files are supported. Please select a valid Excel file.');
      return;
    }
    
    // Clear any errors
    errorDiv.style.display = 'none';
    pathInput.classList.remove('is-invalid');
    pathInput.classList.add('is-valid');
    
    if (excelPath && startingRow) {
      // Save with default settings for first-time setup (no test version)
      await saveSettings(excelPath, startingRow, false, false, true, '');
      const initialSetupModal = bootstrap.Modal.getInstance(document.getElementById('initialSetupModal'));
      initialSetupModal.hide();
      
      // Ensure main window is fully interactive after modal closes
      setTimeout(() => {
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        // Re-enable scrolling
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        logBasic('info', 'Initial setup completed successfully');
      }, 300);
    }
  });
  
  // Handle settings form submission - moved inside DOMContentLoaded
  document.getElementById('saveSettings').addEventListener('click', async function() {
    const excelPath = document.getElementById('excelPath').value;
    const startingRow = document.getElementById('startingRow').value;
    const verboseLogging = document.getElementById('verboseLogging').checked;
    const autoUpdateCheck = document.getElementById('autoUpdateCheck').checked;
    const enableOTA = document.getElementById('enableOTAToggle').checked;
    const errorDiv = document.getElementById('filePathError');
    const pathInput = document.getElementById('excelPath');
    
    // Validate Excel file path
    if (!excelPath) {
      errorDiv.textContent = '❌ Error: Please select an Excel file path.';
      errorDiv.style.display = 'block';
      pathInput.classList.add('is-invalid');
      return;
    }
    
    // Validate file extension
    if (!excelPath.toLowerCase().endsWith('.xlsx')) {
      alert('❌ Invalid File Type\n\nOnly Excel (.xlsx) files are supported. Please select a valid Excel file.');
      return;
    }
    
    // Clear any errors
    errorDiv.style.display = 'none';
    pathInput.classList.remove('is-invalid');
    pathInput.classList.add('is-valid');
    
    if (excelPath && startingRow) {
      await saveSettings(excelPath, startingRow, verboseLogging, autoUpdateCheck, enableOTA, appSettings.testVersion || '');
      
      // Close the modal - try multiple methods to ensure it closes
      const modalEl = document.getElementById('settingsModal');
      if (modalEl) {
        // Try to get existing instance first
        let modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        } else {
          // If no instance exists, create one and hide it immediately
          modal = new bootstrap.Modal(modalEl);
          modal.hide();
        }
      }
      
      // Ensure main window is fully interactive after modal closes
      setTimeout(() => {
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        // Re-enable scrolling
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Show release notes if they're pending and we're closing the settings modal specifically
        if (pendingReleaseNotes && modalElement.id === 'settingsModal') {
          setTimeout(() => {
            showReleaseNotes();
            pendingReleaseNotes = false;
          }, 500); // Additional delay to ensure settings modal is fully closed
        }
      }, 300); // Wait for modal close animation
    } else {
      alert('Please fill in both Excel path and starting row fields');
      logVerbose('warn', 'Settings save attempted with missing required fields');
    }
  });
  
  // Developer modal functionality
  function showDeveloperModal() {
    // Populate system information
    document.getElementById('devAppVersion').textContent = currentVersion;
    document.getElementById('devBuildNumber').textContent = packageJson.buildNumber || 'Unknown';
    document.getElementById('devPlatform').textContent = navigator.platform;
    document.getElementById('devUserAgent').textContent = navigator.userAgent;
    
    // Populate UI version and cache status
    const currentUIVersion = getCurrentUIVersion();
    const isConsistent = verifyUIVersionConsistency();
    document.getElementById('devUIVersion').textContent = `v${currentUIVersion}`;
    
    // Color code the version badge based on consistency
    const versionBadge = document.getElementById('devUIVersion');
    if (isConsistent) {
      versionBadge.className = 'badge bg-success';
    } else {
      versionBadge.className = 'badge bg-warning';
      versionBadge.title = 'Version mismatch detected between HTML and JS';
    }
    
    const cacheStatus = fs.existsSync(LOCAL_UI_CACHE_DIR) ? 
      (fs.existsSync(path.join(LOCAL_UI_CACHE_DIR, 'index.html')) ? 'Cached UI Available' : 'Cache Dir Only') : 
      'No Cache';
    document.getElementById('devCacheStatus').textContent = cacheStatus;
    
    // Populate test version if set
    document.getElementById('devTestVersion').value = appSettings.testVersion || '';
    
    const developerModal = new bootstrap.Modal(document.getElementById('developerModal'));
    developerModal.show();
    
    logVerbose('info', 'Developer modal opened via header quadruple-click with password');
  }

  // Function to show developer access modal
  function showDeveloperAccessModal() {
    // Clear any previous password
    document.getElementById('developerPassword').value = '';
    
    const developerAccessModal = new bootstrap.Modal(document.getElementById('developerAccessModal'));
    developerAccessModal.show();
    
    // Focus on password field when modal is shown
    document.getElementById('developerAccessModal').addEventListener('shown.bs.modal', function() {
      document.getElementById('developerPassword').focus();
    }, { once: true });
    
    logVerbose('info', 'Developer access modal shown via header quadruple-click');
  }

  // Developer access confirmation handler
  document.getElementById('confirmDeveloperAccess').addEventListener('click', function() {
    const password = document.getElementById('developerPassword').value;
    
    if (password === 'admin') {
      // Close the access modal
      const developerAccessModal = bootstrap.Modal.getInstance(document.getElementById('developerAccessModal'));
      developerAccessModal.hide();
      
      // Show the developer tools modal
      setTimeout(() => {
        showDeveloperModal();
      }, 300); // Small delay to let the first modal close
      
      logVerbose('info', 'Developer access granted with correct password');
    } else {
      // Show error styling on password field
      const passwordField = document.getElementById('developerPassword');
      passwordField.classList.add('is-invalid');
      
      // Clear the invalid styling after 3 seconds
      setTimeout(() => {
        passwordField.classList.remove('is-invalid');
      }, 3000);
      
      logVerbose('warn', 'Developer access denied - incorrect password');
    }
  });

  // Allow Enter key to submit developer password
  document.getElementById('developerPassword').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      document.getElementById('confirmDeveloperAccess').click();
    }
  });
  
  // Developer modal event listeners
  document.getElementById('devTestUpdateCheck').addEventListener('click', function() {
    const testVersion = document.getElementById('devTestVersion').value;
    if (testVersion && testVersion.trim()) {
      // Save test version to settings first
      appSettings.testVersion = testVersion.trim();
      localStorage.setItem('lectureLoggerSettings', JSON.stringify(appSettings));
      // Use the test version for update check
      checkForUpdates(true, true);
    } else {
      // Use current version for manual check
      checkForUpdates(true, false);
    }
  });
  
  document.getElementById('devClearTestVersion').addEventListener('click', function() {
    document.getElementById('devTestVersion').value = '';
    // Update settings to clear test version
    appSettings.testVersion = '';
    localStorage.setItem('lectureLoggerSettings', JSON.stringify(appSettings));
  });
  
  document.getElementById('devGithubDebug').addEventListener('click', function() {
    // Close developer modal first
    const developerModal = bootstrap.Modal.getInstance(document.getElementById('developerModal'));
    if (developerModal) {
      developerModal.hide();
    }
    // Show GitHub debug modal
    setTimeout(() => {
      fetchGistDebugInfo();
    }, 300);
  });
  
  document.getElementById('devUIDebug').addEventListener('click', function() {
    // Close developer modal first
    const developerModal = bootstrap.Modal.getInstance(document.getElementById('developerModal'));
    if (developerModal) {
      developerModal.hide();
    }
    // Show UI debug modal
    setTimeout(() => {
      fetchUIDebugInfo();
    }, 300);
  });
  
  
  // Simple UI Management buttons
  const checkUIUpdatesBtn = document.getElementById('checkUIUpdatesBtn');
  const clearUICacheBtn = document.getElementById('clearUICacheBtn');
  
  if (checkUIUpdatesBtn) {
    checkUIUpdatesBtn.addEventListener('click', async function() {
      console.log('Check UI Updates button clicked');
      
      const statusDiv = document.getElementById('uiStatusDisplay');
      const originalText = this.innerHTML;
      
      // Check if in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        if (statusDiv) statusDiv.innerHTML = '<span class="text-warning">⚠️ Development mode - UI updates disabled</span>';
        return;
      }
      
      try {
        this.disabled = true;
        this.innerHTML = '⏳ Checking...';
        if (statusDiv) statusDiv.innerHTML = 'Checking for UI updates...';
        
        // Debug: Show what versions we're comparing
        const currentUIVersion = getCurrentUIVersion();
        console.log('Current UI Version:', currentUIVersion);
        
        // Fetch remote version manually to debug
        const response = await fetch(UI_VERSION_URL);
        const latestUIVersion = (await response.text()).trim();
        console.log('Latest UI Version from remote:', latestUIVersion);
        
        const isNewer = isNewerVersion(latestUIVersion, currentUIVersion);
        console.log('Is newer version available?', isNewer);
        console.log('Comparison: latest =', latestUIVersion, ', current =', currentUIVersion);
        
        const result = await checkUIVersion();
        
        if (result.updated && !result.silent) {
          if (statusDiv) statusDiv.innerHTML = `<span class="text-success">✅ Updated to v${result.version}! Restart to apply.</span>`;
          // Show subtle refresh notification only if validation passed
          showOTANotification();
        } else if (result.silent) {
          if (statusDiv) statusDiv.innerHTML = `<span class="text-danger">❌ Update failed validation - check Developer Tools</span>`;
        } else if (result.error) {
          if (statusDiv) statusDiv.innerHTML = `<span class="text-warning">⚠️ ${result.error}</span>`;
        } else {
          if (statusDiv) statusDiv.innerHTML = `<span class="text-info">ℹ️ UI is up to date (local: v${currentUIVersion}, remote: v${latestUIVersion})</span>`;
        }
      } catch (error) {
        console.error('Error checking UI updates:', error);
        if (statusDiv) statusDiv.innerHTML = `<span class="text-danger">❌ Error: ${error.message}</span>`;
      } finally {
        this.disabled = false;
        this.innerHTML = originalText;
      }
    });
  }
  
  if (clearUICacheBtn) {
    clearUICacheBtn.addEventListener('click', function() {
      console.log('Clear UI Cache button clicked');
      
      const statusDiv = document.getElementById('uiStatusDisplay');
      
      try {
        if (fs.existsSync(LOCAL_UI_CACHE_DIR)) {
          const files = fs.readdirSync(LOCAL_UI_CACHE_DIR);
          files.forEach(file => {
            fs.unlinkSync(path.join(LOCAL_UI_CACHE_DIR, file));
          });
          fs.rmdirSync(LOCAL_UI_CACHE_DIR);
          if (statusDiv) statusDiv.innerHTML = '<span class="text-success">✅ UI cache cleared</span>';
        } else {
          if (statusDiv) statusDiv.innerHTML = '<span class="text-info">ℹ️ No cache to clear</span>';
        }
      } catch (error) {
        if (statusDiv) statusDiv.innerHTML = `<span class="text-danger">❌ Error: ${error.message}</span>`;
      }
    });
  }

  // Force Check OTA button handler
  const forceCheckOTABtn = document.getElementById('forceCheckOTABtn');
  if (forceCheckOTABtn) {
    forceCheckOTABtn.addEventListener('click', async function() {
      console.log('Force Check OTA button clicked');
      
      const statusDiv = document.getElementById('uiStatusDisplay');
      const originalText = this.innerHTML;
      
      try {
        this.disabled = true;
        this.innerHTML = '🚀 Force Checking...';
        if (statusDiv) statusDiv.innerHTML = 'Forcing OTA UI check...';
        
        // Force enable OTA for this check if disabled
        const wasOTADisabled = !appSettings.enableOTA;
        if (wasOTADisabled) {
          appSettings.enableOTA = true;
          logBasic('info', 'Temporarily enabling OTA for force check');
        }
        
        // Reset OTA status
        otaStatus.state = 'checking';
        otaStatus.message = 'Force checking for UI updates';
        otaStatus.error = null;
        
        logBasic('info', 'Force checking OTA UI updates from developer tools');
        
        // Clear any pending files first
        pendingOTAFiles.files = null;
        pendingOTAFiles.version = null;
        pendingOTAFiles.htmlVersion = null;
        pendingOTAFiles.jsVersion = null;
        
        // Get remote version
        const response = await fetch(UI_VERSION_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const remoteVersion = (await response.text()).trim();
        const currentVersion = getCurrentUIVersion();
        
        logBasic('info', 'Force OTA check versions', { 
          remote: remoteVersion, 
          current: currentVersion 
        });
        
        // Force download even if versions match
        await downloadUIFiles(remoteVersion);
        
        if (statusDiv) {
          statusDiv.innerHTML = `<span class="text-success">✅ Force OTA check completed! Check notification.</span>`;
        }
        
        // Restore OTA setting if it was disabled
        if (wasOTADisabled) {
          appSettings.enableOTA = false;
          await saveSettings(appSettings.excelPath, appSettings.startingRow, appSettings.verboseLogging, appSettings.autoUpdateCheck, false, appSettings.testVersion || '');
          logBasic('info', 'Restored OTA disabled setting after force check');
        }
        
      } catch (error) {
        console.error('Error in force OTA check:', error);
        otaStatus.state = 'failed';
        otaStatus.error = error.message;
        
        if (statusDiv) {
          statusDiv.innerHTML = `<span class="text-danger">❌ Force OTA check failed: ${error.message}</span>`;
        }
        
        logBasic('error', 'Force OTA check failed', error);
      } finally {
        this.disabled = false;
        this.innerHTML = originalText;
      }
    });
  }

  // OTA UI Update notification button handlers
  const reloadNowBtn = document.getElementById('reloadNowBtn');
  const notYetBtn = document.getElementById('notYetBtn');
  
  if (reloadNowBtn) {
    reloadNowBtn.addEventListener('click', async function() {
      // Close the notification first
      const notification = document.getElementById('uiUpdateNotification');
      if (notification) {
        notification.classList.remove('show');
        // Also hide the element completely
        setTimeout(() => {
          notification.style.display = 'none';
        }, 150); // Wait for fade animation
      }
      
      // Show loading state
      this.disabled = true;
      this.innerHTML = '🔄 Reloading...';
      
      // Cache the pending OTA files before restarting
      if (pendingOTAFiles.files && Object.keys(pendingOTAFiles.files).length > 0) {
        try {
          logBasic('info', 'User approved OTA update, caching files before restart');
          
          await initializeCacheDir();
          
          // Cache the validated files
          for (const [fileName, content] of Object.entries(pendingOTAFiles.files)) {
            const cachePath = path.join(LOCAL_UI_CACHE_DIR, fileName);
            
            // Backup existing cached file
            if (fs.existsSync(cachePath)) {
              fs.copyFileSync(cachePath, `${cachePath}.backup`);
            }
            
            fs.writeFileSync(cachePath, content, 'utf8');
            logVerbose('info', `OTA UI file cached: ${fileName}`);
          }
          
          // Update UI version file
          const versionFilePath = path.join(LOCAL_UI_CACHE_DIR, 'ui-version.txt');
          fs.writeFileSync(versionFilePath, pendingOTAFiles.version, 'utf8');
          
          logBasic('info', 'OTA UI files cached successfully after user approval', { 
            version: pendingOTAFiles.version,
            htmlVersion: pendingOTAFiles.htmlVersion,
            jsVersion: pendingOTAFiles.jsVersion
          });
          
          // Clear pending files
          pendingOTAFiles.files = null;
          pendingOTAFiles.version = null;
          pendingOTAFiles.htmlVersion = null;
          pendingOTAFiles.jsVersion = null;
          
        } catch (cacheError) {
          logBasic('error', 'Failed to cache OTA files after user approval', cacheError);
          this.innerHTML = '❌ Cache Failed';
          this.disabled = false;
          return;
        }
      }
      
      // Restart the Electron app to load cached UI files
      setTimeout(async () => {
        try {
          // Use IPC to request app restart from main process
          await ipcRenderer.invoke('restart-app');
        } catch (error) {
          console.warn('Could not restart app via IPC, trying direct method:', error);
          try {
            // Try direct access to app if available
            const { app } = require('electron');
            if (app) {
              app.relaunch();
              app.exit();
            } else {
              // Final fallback: just reload the page
              location.reload();
            }
          } catch (fallbackError) {
            console.warn('All restart methods failed, reloading page:', fallbackError);
            location.reload();
          }
        }
      }, 200);
    });
  }
  
  if (notYetBtn) {
    notYetBtn.addEventListener('click', function() {
      // Just dismiss the notification without caching files
      const notification = document.getElementById('uiUpdateNotification');
      if (notification) {
        notification.classList.remove('show');
        // Also hide the element completely to prevent blocking other UI
        setTimeout(() => {
          notification.style.display = 'none';
        }, 150); // Wait for fade animation
      }
      
      logBasic('info', 'User declined OTA update, files remain uncached');
    });
  }

  // Update modal event handlers
  document.getElementById('skipUpdateBtn').addEventListener('click', function() {
    const updateModal = bootstrap.Modal.getInstance(document.getElementById('updateModal'));
    updateModal.hide();
    logBasic('info', 'Update skipped by user');
  });
  
  document.getElementById('downloadUpdateBtn').addEventListener('click', async function() {
    const downloadBtn = this;
    const originalText = downloadBtn.textContent;
    
    downloadBtn.disabled = true;
    downloadBtn.textContent = '⏳ Downloading...';
    
    try {
      const isMac = process.platform === 'darwin';
      const downloadUrl = isMac ? window.updateDownloadLinks.mac : window.updateDownloadLinks.win;
      const filename = isMac ? 'LectureLogger-Update.dmg' : 'LectureLogger-Update.exe';
      
      logBasic('info', 'Starting update download', { platform: process.platform, url: downloadUrl });
      
      // Use Electron's shell to download and open
      await shell.openExternal(downloadUrl);
      
      // Close the modal and quit the app
      const updateModal = bootstrap.Modal.getInstance(document.getElementById('updateModal'));
      updateModal.hide();
      
      setTimeout(() => {
        const { app } = require('electron').remote || require('@electron/remote');
        if (app) {
          app.quit();
        } else {
          window.close();
        }
      }, 1000);
      
    } catch (error) {
      logVerbose('error', 'Download failed', { error: error.message });
      alert('Download failed. Please try downloading manually from the release page.');
      downloadBtn.disabled = false;
      downloadBtn.textContent = originalText;
    }
  });

  // Initial Setup Modal handlers
  const initialBrowseFileBtn = document.getElementById('initialBrowseFileBtn');
  const initialFileInput = document.getElementById('initialFileInput');
  const saveInitialSetup = document.getElementById('saveInitialSetup');

  if (initialBrowseFileBtn && initialFileInput) {
    initialBrowseFileBtn.addEventListener('click', () => {
      initialFileInput.click();
    });

    initialFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.name.endsWith('.xlsx')) {
        document.getElementById('initialExcelPath').value = file.path;
        document.getElementById('initialFilePathError').style.display = 'none';
      } else if (file) {
        document.getElementById('initialFilePathError').textContent = 'Please select a valid Excel (.xlsx) file.';
        document.getElementById('initialFilePathError').style.display = 'block';
      }
    });
  }

  if (saveInitialSetup) {
    saveInitialSetup.addEventListener('click', async () => {
      try {
        const excelPath = document.getElementById('initialExcelPath').value;
        const startingRow = parseInt(document.getElementById('initialStartingRow').value) || 125;
        const autoUpdateCheck = document.getElementById('initialAutoUpdateCheck').checked;
        const enableOTA = document.getElementById('initialEnableOTA').checked;

        if (!excelPath) {
          document.getElementById('initialFilePathError').textContent = 'Please select an Excel file.';
          document.getElementById('initialFilePathError').style.display = 'block';
          return;
        }

        await saveSettings(excelPath, startingRow, false, autoUpdateCheck, enableOTA);
        
        // Close the modal - try multiple methods to ensure it closes
        const modalEl = document.getElementById('initialSetupModal');
        if (modalEl) {
          // Try to get existing instance first
          let modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) {
            modal.hide();
          } else {
            // If no instance exists, create one and hide it immediately
            modal = new bootstrap.Modal(modalEl);
            modal.hide();
          }
        }

        showSuccessAlert('Settings saved successfully!', 'You can change these settings anytime from the ⚙️ Settings menu.');
        
        // Show release notes if pending
        if (pendingReleaseNotes) {
          setTimeout(() => {
            showReleaseNotes();
            pendingReleaseNotes = false;
          }, 500);
        }
      } catch (error) {
        console.error('Error in initial setup:', error);
        alert('Error saving initial settings: ' + error.message);
      }
    });
  }

  // Check for updates on startup if enabled
  setTimeout(() => {
    if (appSettings.autoUpdateCheck !== false) { // Default to true if not set
      checkForUpdates(false);
    }
  }, 2000); // Wait 2 seconds after startup
});
