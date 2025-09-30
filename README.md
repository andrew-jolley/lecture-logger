# Lecture Logger

A desktop application for logging lectures into Excel spreadsheets with integrated Python backend for robust Excel processing.

## Features

- 🎓 **Lecture Logging**: Easy form-based interface for recording lecture information
- 📊 **Excel Integration**: Direct writing to Excel files via Python backend
- 🔧 **Developer Tools**: Advanced debugging and configuration options
- 🐍 **Embedded Python**: Cross-platform Python integration with zero user setup
- ⚙️ **Settings Management**: Automatic synchronization between Electron and Python

## Architecture

- **Frontend**: Electron with Bootstrap UI
- **Backend**: Python bridge for Excel processing (openpyxl)
- **Build**: Automated multi-platform Python distribution setup

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
```

## Project Structure

```
lecture-logger/
├── index.html              # Main UI
├── main.js                 # Electron main process
├── renderer.js             # Electron renderer process
├── python/
│   ├── electron_bridge.py  # Python-Electron bridge
│   ├── electron_settings.json # Settings sync file
│   └── OTJ for Python.xlsx # Sample Excel file
├── python-runtime/         # Embedded Python distributions
│   ├── win32-x64/         # Windows 64-bit Python
│   └── darwin-arm64/      # macOS wrapper
└── scripts/
    └── setup-multiplatform-python.js # Python setup script
```

## Python Integration

The app uses embedded Python distributions for reliable cross-platform Excel processing:

- **Windows**: Full Python 3.13.5 embeddable distributions (~41MB)
- **macOS**: Intelligent wrapper that finds system Python (~0.1MB)

This ensures Windows users (typically less technical) get a "just works" experience, while macOS users benefit from smaller download sizes with automatic system Python detection.

## Authors

- **Andrew Jolley** - UI Design & Frontend Development
- **Liam Shadwell** - Python Backend & Excel Integration

## License

Copyright © 2025 Andrew Jolley & Liam Shadwell. All rights reserved.