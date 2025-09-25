#!/usr/bin/env node
/**
 * List all available builds with their details
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
    console.log('📁 No dist directory found. Run a build first.');
    process.exit(0);
}

console.log('📦 Available Builds:\n');

const versionDirs = fs.readdirSync(distDir).filter(item => 
    fs.statSync(path.join(distDir, item)).isDirectory()
);

if (versionDirs.length === 0) {
    console.log('🔍 No builds found in dist directory.');
    process.exit(0);
}

versionDirs.sort().forEach(version => {
    console.log(`🏷️  Version: ${version}`);
    
    const versionPath = path.join(distDir, version);
    const buildDirs = fs.readdirSync(versionPath).filter(item => 
        fs.statSync(path.join(versionPath, item)).isDirectory()
    );
    
    buildDirs.sort().forEach(buildNumber => {
        const buildPath = path.join(versionPath, buildNumber);
        const buildFiles = fs.readdirSync(buildPath);
        
        // Find installer files
        const installers = buildFiles.filter(file => 
            file.endsWith('.exe') || 
            file.endsWith('.dmg') || 
            file.endsWith('.pkg') || 
            file.endsWith('.AppImage')
        );
        
        // Get build date from build number (format: YYYYMMDD.NNN)
        const dateMatch = buildNumber.match(/^(\d{4})(\d{2})(\d{2})\.(\d+)$/);
        let buildDate = 'Unknown date';
        if (dateMatch) {
            const [, year, month, day, build] = dateMatch;
            buildDate = `${year}-${month}-${day} (build ${build})`;
        }
        
        console.log(`   📅 ${buildNumber} - ${buildDate}`);
        console.log(`      📍 Path: dist/${version}/${buildNumber}`);
        
        if (installers.length > 0) {
            console.log(`      🎯 Installers:`);
            installers.forEach(installer => {
                const filePath = path.join(buildPath, installer);
                const stats = fs.statSync(filePath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);
                console.log(`         • ${installer} (${sizeInMB} MB)`);
            });
        }
        console.log('');
    });
});

console.log(`\n📊 Total versions: ${versionDirs.length}`);
const totalBuilds = versionDirs.reduce((total, version) => {
    const versionPath = path.join(distDir, version);
    const buildDirs = fs.readdirSync(versionPath).filter(item => 
        fs.statSync(path.join(versionPath, item)).isDirectory()
    );
    return total + buildDirs.length;
}, 0);
console.log(`📊 Total builds: ${totalBuilds}`);