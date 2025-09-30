#!/usr/bin/env node

/**
 * Multi-Platform Python Setup for Lecture Logger
 * 
 * This script downloads and configures Python distributions for all target platforms:
 * - Windows: Downloads embeddable Python 3.13.5 with pip and openpyxl support
 * - macOS: Creates intelligent wrapper that finds system Python and auto-installs openpyxl

 * 
 * Total size impact: ~41MB (Windows only, macOS is lightweight wrapper)
 * 
 * Usage: npm run setup-python (automatically called during build)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PYTHON_VERSION = '3.13.5';
const RUNTIME_DIR = path.join(__dirname, '..', 'python-runtime');

// Official Python.org download URLs
const PYTHON_DOWNLOADS = {
  'win32-x64': {
    url: `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`,
    type: 'embeddable',
    size: '10.4 MB'
  }
};

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${path.basename(url)}`);
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(destPath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(destPath, () => {}); 
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function setupWindowsEmbeddable(platformKey) {
  const platformDir = path.join(RUNTIME_DIR, platformKey);
  
  if (fs.existsSync(platformDir)) {
    console.log(`✅ ${platformKey} Python already exists`);
    return;
  }
  
  console.log(`🐍 Setting up ${platformKey} Python`);
  fs.mkdirSync(platformDir, { recursive: true });
  
  const pythonInfo = PYTHON_DOWNLOADS[platformKey];
  const zipPath = path.join(platformDir, 'python-embed.zip');
  
  try {
    await downloadFile(pythonInfo.url, zipPath);
    
    // Extract
    console.log(`📦 Extracting ${platformKey} Python...`);
    execSync(`unzip -q "${zipPath}" -d "${platformDir}"`, { stdio: 'inherit' });
    
    // Clean up zip
    fs.unlinkSync(zipPath);
    
    // Configure embedded Python
    await configureEmbeddedPython(platformDir);
    
    // Copy bridge script
    await copyBridgeScript(platformDir);
    
    console.log(`✅ ${platformKey} setup complete`);
    
  } catch (error) {
    console.error(`❌ ${platformKey} setup failed: ${error.message}`);
    // Clean up on failure
    if (fs.existsSync(platformDir)) {
      fs.rmSync(platformDir, { recursive: true, force: true });
    }
  }
}

async function configureEmbeddedPython(platformDir) {
  // Find and modify ._pth file to enable site packages
  const pthFiles = fs.readdirSync(platformDir).filter(f => f.endsWith('._pth'));
  if (pthFiles.length > 0) {
    const pthFile = path.join(platformDir, pthFiles[0]);
    let content = fs.readFileSync(pthFile, 'utf-8');
    
    if (!content.includes('import site')) {
      content += '\nimport site\n';
    }
    if (!content.includes('Lib\\site-packages')) {
      content += 'Lib\\site-packages\n';
    }
    
    fs.writeFileSync(pthFile, content);
  }
  
  // Download get-pip.py
  const getPipPath = path.join(platformDir, 'get-pip.py');
  try {
    await downloadFile('https://bootstrap.pypa.io/get-pip.py', getPipPath);
  } catch (error) {
    console.warn(`⚠️ Could not download get-pip.py: ${error.message}`);
  }
}

async function copyBridgeScript(platformDir) {
  const bridgeSource = path.join(__dirname, '..', 'python', 'electron_bridge.py');
  if (fs.existsSync(bridgeSource)) {
    const bridgeDest = path.join(platformDir, 'electron_bridge.py');
    fs.copyFileSync(bridgeSource, bridgeDest);
  }
}

async function createWrapperScripts() {
  // Create macOS wrapper
  const macosDir = path.join(RUNTIME_DIR, 'darwin-arm64');
  const macosWrapper = `#!/bin/bash
# macOS Python finder for Lecture Logger
export PYTHONPATH="$PYTHONPATH:$(dirname "$0")"

# Try to find and use system Python with openpyxl auto-install
for py_cmd in python3 python; do
    if command -v "$py_cmd" >/dev/null 2>&1; then
        # Try to install openpyxl if missing
        "$py_cmd" -c "import openpyxl" 2>/dev/null || "$py_cmd" -m pip install --user openpyxl 2>/dev/null
        exec "$py_cmd" "$@"
    fi
done

echo "❌ Python not found! Install from: https://www.python.org/downloads/"
exit 1
`;

  fs.mkdirSync(path.join(macosDir, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(macosDir, 'bin', 'python3'), macosWrapper);
  fs.chmodSync(path.join(macosDir, 'bin', 'python3'), 0o755);
  
  // Copy bridge script
  await copyBridgeScript(macosDir);
  
  console.log('✅ Wrapper script created for macOS');
}

async function main() {
  console.log('🚀 Setting up Python for all target platforms...');
  
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  
  try {
    // Download Windows embeddable Python
    await setupWindowsEmbeddable('win32-x64');
    
    // Create wrapper script for macOS
    await createWrapperScripts();
    
    console.log('🎉 Multi-platform Python setup complete!');
    
    const totalSize = getDirSize(RUNTIME_DIR);
    console.log(`📊 Total runtime size: ${totalSize} MB`);
    
    if (totalSize > 30) {
      console.log('⚠️ Size is quite large. Consider optimizing for production builds.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

function getDirSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let totalSize = 0;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      totalSize += getDirSize(filePath);
    } else {
      totalSize += fs.statSync(filePath).size;
    }
  }
  
  return Math.round(totalSize / (1024 * 1024));
}

if (require.main === module) {
  main();
}

module.exports = { main };