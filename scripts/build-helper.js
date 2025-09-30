#!/usr/bin/env node
/**
 * Build helper script to handle dynamic output paths for all platforms
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Read package.json to get version info
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;
const buildNumber = packageJson.buildNumber;

// Create output directory path
const outputDir = `dist/v${version}/${buildNumber}`;

// Get platform argument
const platform = process.argv[2];
const validPlatforms = ['win', 'mac', 'all'];

if (!platform || !validPlatforms.includes(platform)) {
    console.error('Usage: node scripts/build-helper.js [win|mac|all]');
    console.error('Example: node scripts/build-helper.js win');
    process.exit(1);
}

// Clean only the current build directory, not the entire dist folder
console.log(`🧹 Cleaning current build directory: ${outputDir}...`);
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
}

// Run setup-python
console.log('🐍 Setting up Python runtime...');
execSync('npm run setup-python', { stdio: 'inherit' });

// Build command mapping
const buildCommands = {
    win: `electron-builder --win --config.directories.output="${outputDir}"`,
    mac: `electron-builder --mac --config.directories.output="${outputDir}"`,
    all: `electron-builder -mw --config.directories.output="${outputDir}"`
};

// Execute build
console.log(`🚀 Building for ${platform}...`);
console.log(`📁 Output directory: ${outputDir}`);

try {
    execSync(buildCommands[platform], { stdio: 'inherit' });
    console.log(`✅ Build completed successfully!`);
    console.log(`📦 Files created in: ${outputDir}`);
    
    // List created files
    if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir, { recursive: true });
        const installers = files.filter(file => 
            file.endsWith('.exe') || 
            file.endsWith('.dmg') || 
            file.endsWith('.pkg') || 
            file.endsWith('.AppImage')
        );
        
        if (installers.length > 0) {
            console.log('\n🎯 Installer files created:');
            installers.forEach(file => console.log(`   ${file}`));
        }
    }
} catch (error) {
    console.error(`❌ Build failed:`, error.message);
    process.exit(1);
}