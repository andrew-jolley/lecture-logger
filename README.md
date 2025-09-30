# Le## Features

- 🎓 **Lecture Logging**: Easy form-based interface for recording lecture information
- 📊 **Excel Integration**: Direct writing to Excel files via Python backend with declaration/confirmation columns
- 🔧 **Developer Tools**: Advanced debugging and configuration options
- 🐍 **Embedded Python**: Cross-platform Python integration with zero user setup
- ⚙️ **Settings Management**: Automatic synchronization between Electron and Python
- 🚀 **Auto Updates**: Intelligent update system
- 💾 **Smart Caching**: Offline reliability with local UI cachinger

A secure desktop application for logging lectures into Excel spreadsheets with integrated Python backend for robust Excel processing.

## Features

- 🎓 **Lecture Logging**: Easy form-based interface for recording lecture information
- 📊 **Excel Integration**: Direct writing to Excel files via Python backend with declaration/confirmation columns
- � **Security Enhanced**: Local Bootstrap hosting, improved password security, secure Electron configuration
- �🔧 **Developer Tools**: Advanced debugging and configuration options with admin access
- 🐍 **Embedded Python**: Cross-platform Python integration with zero user setup
- ⚙️ **Settings Management**: Automatic synchronization between Electron and Python
- 🚀 **Auto Updates**: Intelligent update system with critical update protection
- 💾 **Smart Caching**: Offline reliability with local UI caching

## Architecture

- **Frontend**: Electron v38.2.0 with Bootstrap 5.3.2 UI
- **Backend**: Python 3.13.5 bridge for Excel processing (openpyxl)
- **Build**: Automated multi-platform Python distribution setup
- **Platforms**: Windows x64, macOS ARM64

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
npm install
npm run setup-python  # Downloads Python distributions for all platforms
npm start
```

### Building
```bash
npm run dist        # Build for all platforms
npm run dist:mac    # macOS only
npm run dist:win    # Windows only

# Additional commands
npm run setup-python  # Set up Python runtime
npm run clean        # Clean build directory
```

## Project Structure

```
lecture-logger/
├── index.html              # Main UI
├── main.js                 # Electron main process
├── renderer.js             # Electron renderer process
├── assets/
│   └── bootstrap/          # Local Bootstrap CSS/JS
├── python/
│   ├── electron_bridge.py  # Python-Electron bridge
│   ├── electron_settings.json # Settings sync file
│   └── OTJ for Python.xlsx # Sample Excel file
├── python-runtime/         # Embedded Python distributions
│   ├── win32-x64/         # Windows 64-bit Python (~41MB)
│   └── darwin-arm64/      # macOS wrapper (~0.1MB)
├── ui/                     # UI development version
├── scripts/
│   └── setup-multiplatform-python.js # Python setup script
└── test-complete-flow.js   # End-to-end testing
```

## Python Integration

The app uses embedded Python distributions for reliable cross-platform Excel processing:

- **Windows**: Full Python 3.13.5 embeddable distributions (~41MB)
- **macOS**: Intelligent wrapper that finds system Python (~0.1MB)

This ensures Windows users (typically less technical) get a "just works" experience, while macOS users benefit from smaller download sizes with automatic system Python detection.

## Testing

```bash
node test-complete-flow.js    # Full end-to-end test
node project-status.js        # Project health check
node sync-python-files.js     # Sync Python files across platforms
```

## Authors

- **Andrew Jolley** - UI Design & Frontend Development
- **Liam Shadwell** - Python Backend & Excel Integration

## License

Copyright © 2025 Andrew Jolley & Liam Shadwell. All rights reserved.