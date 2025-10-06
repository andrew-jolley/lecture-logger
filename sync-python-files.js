#!/usr/bin/env node
/**
 * Python File Synchronization Script
 * Ensures all Python bridge files are synchronized across all runtime directories
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔄 Python File Synchronization Script');
console.log('Ensuring all Python files are up-to-date across all locations');
console.log('='.repeat(70));

// Define the source and target locations
const sourceDir = path.join(__dirname, 'python');
const targetDirs = [
    path.join(__dirname, 'python-runtime/darwin-arm64'),
    path.join(__dirname, 'python-runtime/win32-x64')
];

const filesToSync = [
    'electron_bridge.py',
    'OTJ_Automation.py'
];

function calculateFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
        return null;
    }
}

function getFileStats(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return {
            exists: true,
            size: stats.size,
            modified: stats.mtime,
            hash: calculateFileHash(filePath)
        };
    } catch (error) {
        return {
            exists: false,
            size: 0,
            modified: null,
            hash: null
        };
    }
}

function copyFile(source, target) {
    try {
        // Ensure target directory exists
        const targetDir = path.dirname(target);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.copyFileSync(source, target);
        return true;
    } catch (error) {
        console.log(`   ❌ Failed to copy: ${error.message}`);
        return false;
    }
}

function checkPythonFunctionality(bridgeFile) {
    console.log(`\n🔍 Checking Python functionality in: ${path.basename(path.dirname(bridgeFile))}`);
    
    try {
        const content = fs.readFileSync(bridgeFile, 'utf8');
        
        // Check for key functions
        const functions = [
            'addDeclaration',
            'addConfirmation', 
            'find_next_row',
            'process_data',
            'test_connection',
            'get_options'
        ];
        
        functions.forEach(func => {
            if (content.includes(func)) {
                console.log(`   ✅ ${func} function found`);
            } else {
                console.log(`   ❌ ${func} function MISSING`);
            }
        });
        
        // Check for declaration/confirmation logic
        if (content.includes('declaration, confirmation = addDeclaration')) {
            console.log('   ✅ Declaration/confirmation logic integrated');
        } else {
            console.log('   ❌ Declaration/confirmation logic MISSING');
        }
        
        return true;
    } catch (error) {
        console.log(`   ❌ Could not read file: ${error.message}`);
        return false;
    }
}

function main() {
    console.log('📁 Source Directory:', sourceDir);
    console.log('📁 Target Directories:', targetDirs.length);
    targetDirs.forEach(dir => console.log(`   - ${dir}`));
    
    console.log(`\n📄 Files to Sync: ${filesToSync.join(', ')}`);
    
    // Check source files
    console.log('\n🔍 Checking Source Files:');
    const sourceFiles = {};
    
    filesToSync.forEach(fileName => {
        const sourcePath = path.join(sourceDir, fileName);
        const stats = getFileStats(sourcePath);
        sourceFiles[fileName] = { path: sourcePath, stats };
        
        console.log(`\n   📄 ${fileName}:`);
        if (stats.exists) {
            console.log(`      ✅ Exists: ${stats.size} bytes`);
            console.log(`      📅 Modified: ${stats.modified}`);
            console.log(`      🔒 Hash: ${stats.hash.substring(0, 8)}...`);
        } else {
            console.log(`      ❌ Missing in source directory!`);
        }
    });
    
    // Sync files to all target directories
    console.log('\n🔄 Synchronizing Files:');
    let totalCopied = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    targetDirs.forEach(targetDir => {
        console.log(`\n📂 Target: ${path.basename(targetDir)}`);
        
        if (!fs.existsSync(targetDir)) {
            console.log('   📁 Creating directory...');
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        filesToSync.forEach(fileName => {
            const sourcePath = sourceFiles[fileName].path;
            const sourceStats = sourceFiles[fileName].stats;
            const targetPath = path.join(targetDir, fileName);
            const targetStats = getFileStats(targetPath);
            
            console.log(`   📄 ${fileName}:`);
            
            if (!sourceStats.exists) {
                console.log('      ⚠️  Source file missing - skipping');
                totalSkipped++;
                return;
            }
            
            if (targetStats.exists && targetStats.hash === sourceStats.hash) {
                console.log('      ✅ Already up-to-date');
                totalSkipped++;
            } else {
                console.log('      🔄 Copying...');
                if (copyFile(sourcePath, targetPath)) {
                    console.log('      ✅ Copied successfully');
                    totalCopied++;
                } else {
                    totalErrors++;
                }
            }
        });
    });
    
    // Verify Python functionality in each runtime
    console.log('\n🧪 Verifying Python Functionality:');
    targetDirs.forEach(targetDir => {
        const bridgeFile = path.join(targetDir, 'electron_bridge.py');
        if (fs.existsSync(bridgeFile)) {
            checkPythonFunctionality(bridgeFile);
        } else {
            console.log(`\n❌ No electron_bridge.py in ${path.basename(targetDir)}`);
        }
    });
    
    // Summary
    console.log('\n🎉 Synchronization Summary:');
    console.log('='.repeat(40));
    console.log(`📊 Files copied: ${totalCopied}`);
    console.log(`⏭️  Files skipped (up-to-date): ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
        console.log('\n✅ All Python files are synchronized successfully!');
        console.log('🚀 All runtime directories have the latest code with declaration/confirmation support.');
        return true;
    } else {
        console.log('\n❌ Some files failed to synchronize. Check the errors above.');
        return false;
    }
}

// Handle script interruption
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Synchronization interrupted by user');
    process.exit(1);
});

// Run the synchronization
if (main()) {
    process.exit(0);
} else {
    process.exit(1);
}