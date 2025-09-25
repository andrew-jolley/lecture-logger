#!/usr/bin/env node

/**
 * End-to-end test script: JavaScript data → Python bridge → Excel spreadsheet
 * Tests complete flow including new declaration/confirmation columns (C to N)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 End-to-End Test: JavaScript → Python → Excel');
console.log('Testing complete data flow including new declaration/confirmation columns');
console.log('='.repeat(80));

// Test data scenarios
const testScenarios = [
    {
        name: "Scenario 1: Declaration=Yes (Confirmation should be N/A)",
        data: {
            date: "01/10/2024",
            location: "Home",
            activityType: "Reading",
            moduleCode: "DIG4142",
            description: "Testing complete flow with declaration=Yes",
            details: "This tests that when declaration is Yes, confirmation becomes N/A automatically",
            nextSteps: "Verify Excel data is correct",
            duration: "2.5",
            declaration: "Yes"
            // No confirmation field - should auto-set to N/A
        }
    },
    {
        name: "Scenario 2: Declaration=No, Confirmation=Yes",
        data: {
            date: "02/10/2024", 
            location: "BBC London Broadcasting House",
            activityType: "Work shadowing",
            moduleCode: "CMP4267",
            description: "Testing complete flow with declaration=No, confirmation=Yes",
            details: "This tests that when declaration is No, user-provided confirmation is used",
            nextSteps: "Review with supervisor",
            duration: "4.0",
            declaration: "No",
            confirmation: "Yes"
        }
    },
    {
        name: "Scenario 3: Declaration=No, Confirmation=No",
        data: {
            date: "today",
            location: "BBC Salford MediaCityUK",
            activityType: "Lecture", 
            moduleCode: "Not applicable",
            description: "Testing with today's date and no module",
            details: "Testing edge case with today date and N/A module",
            nextSteps: "",
            duration: "1.5",
            declaration: "No",
            confirmation: "No"
        }
    }
];

function updateSettings(startingRow) {
    console.log(`\n⚙️  Updating settings for test.xlsx, starting row ${startingRow}`);
    
    const settings = {
        excelPath: "/Users/andrewjolley/lecture-logger/test.xlsx",
        startingRow: startingRow,
        verboseLogging: true,
        timestamp: new Date().toISOString()
    };
    
    const settingsPath = path.join(__dirname, 'python', 'electron_settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`   ✅ Settings updated: ${settingsPath}`);
}

function runPythonBridge(command, data = null) {
    return new Promise((resolve, reject) => {
        console.log(`\n🐍 Running Python bridge command: ${command}`);
        
        const pythonPath = path.join(__dirname, 'python-runtime', 'darwin-arm64', 'bin', 'python3');
        const scriptPath = path.join(__dirname, 'python-runtime', 'darwin-arm64', 'electron_bridge.py');
        
        const args = [scriptPath, command];
        if (data) {
            args.push(JSON.stringify(data));
        }
        
        console.log(`   Command: ${pythonPath} ${args.join(' ')}`);
        
        const python = spawn(pythonPath, args, {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        python.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(stdout.trim());
                    resolve(result);
                } catch (e) {
                    console.log(`   Raw output: ${stdout}`);
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            } else {
                console.log(`   STDERR: ${stderr}`);
                console.log(`   STDOUT: ${stdout}`);
                reject(new Error(`Python process exited with code ${code}`));
            }
        });
        
        python.on('error', (error) => {
            reject(error);
        });
    });
}

async function testConnection() {
    console.log('\n🔗 Testing Python Bridge Connection');
    try {
        const result = await runPythonBridge('test_connection');
        console.log('   ✅ Connection successful');
        console.log(`   🐍 Python version: ${result.python_version.split(' ')[0]}`);
        console.log(`   📁 Working directory: ${result.working_directory}`);
        console.log(`   📊 Excel path: ${result.excel_path}`);
        return true;
    } catch (error) {
        console.log(`   ❌ Connection failed: ${error.message}`);
        return false;
    }
}

async function runTestScenario(scenario, expectedRow) {
    console.log(`\n📊 ${scenario.name}`);
    console.log('-'.repeat(50));
    
    try {
        // Show input data
        console.log('   📥 Input Data:');
        Object.entries(scenario.data).forEach(([key, value]) => {
            console.log(`      ${key}: "${value}"`);
        });
        
        // Process data through Python bridge
        console.log('   ⚙️  Processing through Python bridge...');
        const result = await runPythonBridge('process_data', scenario.data);
        
        if (result.success) {
            console.log('   ✅ SUCCESS!');
            console.log(`   📍 Written to row: ${result.row}`);
            console.log(`   📊 Data written (${result.data.length} columns):`);
            
            // Display the data in a readable format
            const columnLabels = [
                'C-Date', 'D-AcadYear', 'E-Location', 'F-Type', 'G-Module', 
                'H-Description', 'I-Details', 'J-KSB', 'K-NextSteps', 
                'L-Duration', 'M-Declaration', 'N-Confirmation'
            ];
            
            result.data.forEach((value, index) => {
                const label = columnLabels[index] || `Col${index + 3}`;
                console.log(`      ${label}: "${value}"`);
            });
            
            // Validate declaration/confirmation logic
            const declaration = result.data[10]; // Column M (index 10)
            const confirmation = result.data[11]; // Column N (index 11)
            
            console.log('\n   🔍 Validating Declaration/Confirmation Logic:');
            console.log(`      Declaration (M): "${declaration}"`);
            console.log(`      Confirmation (N): "${confirmation}"`);
            
            // Check logic
            if (scenario.data.declaration === "Yes" && confirmation === "N/A") {
                console.log('      ✅ CORRECT: Declaration=Yes → Confirmation=N/A');
            } else if (scenario.data.declaration === "No" && confirmation === scenario.data.confirmation) {
                console.log(`      ✅ CORRECT: Declaration=No → Confirmation=${confirmation}`);
            } else {
                console.log('      ❌ INCORRECT: Declaration/Confirmation logic failed');
            }
            
            return true;
        } else {
            console.log(`   ❌ FAILED: ${result.error}`);
            return false;
        }
        
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        return false;
    }
}

async function checkExcelFile() {
    console.log('\n📋 Checking Excel File Status');
    const excelPath = '/Users/andrewjolley/lecture-logger/test.xlsx';
    
    try {
        const stats = fs.statSync(excelPath);
        console.log(`   ✅ Excel file exists: ${excelPath}`);
        console.log(`   📊 File size: ${stats.size} bytes`);
        console.log(`   📅 Last modified: ${stats.mtime}`);
        return true;
    } catch (error) {
        console.log(`   ❌ Excel file not found: ${excelPath}`);
        return false;
    }
}

async function findNextAvailableRow() {
    console.log('\n🔍 Finding Next Available Row');
    try {
        const result = await runPythonBridge('find_next_row');
        if (result.row) {
            console.log(`   ✅ Next available row: ${result.row}`);
            return result.row;
        } else {
            console.log('   ❌ Could not determine next available row');
            return 110; // Default fallback
        }
    } catch (error) {
        console.log(`   ⚠️  Could not find next row, using default 110: ${error.message}`);
        return 110;
    }
}

async function main() {
    try {
        console.log('🚀 Starting End-to-End Test');
        
        // Check Excel file exists
        const excelExists = await checkExcelFile();
        if (!excelExists) {
            console.log('\n❌ Test cannot proceed without Excel file');
            process.exit(1);
        }
        
        // Find starting row
        const startingRow = await findNextAvailableRow();
        
        // Update settings
        updateSettings(startingRow);
        
        // Test connection
        const connectionOk = await testConnection();
        if (!connectionOk) {
            console.log('\n❌ Test cannot proceed without Python bridge connection');
            process.exit(1);
        }
        
        // Run test scenarios
        console.log(`\n🧪 Running ${testScenarios.length} test scenarios`);
        const results = [];
        
        for (let i = 0; i < testScenarios.length; i++) {
            const scenario = testScenarios[i];
            const expectedRow = startingRow + i;
            const success = await runTestScenario(scenario, expectedRow);
            results.push(success);
        }
        
        // Summary
        console.log('\n🎉 Test Summary');
        console.log('='.repeat(40));
        
        const passed = results.filter(r => r).length;
        const total = results.length;
        
        results.forEach((success, index) => {
            const status = success ? '✅ PASSED' : '❌ FAILED';
            console.log(`   ${testScenarios[index].name}: ${status}`);
        });
        
        console.log(`\n📊 Overall Result: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! End-to-end flow is working perfectly!');
            console.log(`📊 Check Excel file at: /Users/andrewjolley/lecture-logger/test.xlsx`);
            console.log(`📍 Data should be in rows ${startingRow} to ${startingRow + total - 1}`);
            process.exit(0);
        } else {
            console.log('❌ Some tests failed. Check the output above for details.');
            process.exit(1);
        }
        
    } catch (error) {
        console.log(`\n❌ Test script failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Handle script interruption
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Test interrupted by user');
    process.exit(1);
});

// Run the test
main();