# Lyra - Audio Enhancement Browser Extension

Lyra is a browser extension that helps fix annoying sound problems in YouTube videos and other media. It allows you to:

- Set global gain (volume) that applies across all websites
- Override gain for specific domains
- Adjust gain (volume) per page or per media element
- Adjust pan (left/right balance)
- Convert stereo to mono
- Flip left and right channels

This extension is perfect for those times when videos have audio in one channel only, are too quiet, or have other audio balance issues.

## Features

- **Global Gain Settings**: Set a default volume boost that applies to all websites
- **Per-Domain Overrides**: Customize gain settings for specific domains (e.g., YouTube, Netflix)
- **Persistent Settings**: Your preferences are saved and automatically applied
- **Page Controls**: Apply audio adjustments to all media elements on a page at once
- **Individual Controls**: Fine-tune specific audio/video elements separately
- **Dark Mode Support**: Automatically adapts to your browser's theme
- **Real-time Adjustments**: Changes are applied instantly as you adjust sliders

## Project Structure

```
lyra/
├── assets/
│   ├── icons/           # Extension icons
│   └── images/          # Images used in the popup
├── src/
│   ├── popup.html       # Extension popup HTML
│   ├── popup.js         # Main extension functionality
│   └── popup.css        # Styling for the popup
├── manifest.json        # Firefox extension manifest
├── manifest.chrome.json # Chrome extension manifest
├── build.sh            # Build script for packaging
└── README.md           # This file
```

## Building the Extension

The extension can be built for both Firefox and Chrome-based browsers using the included build script.

### Prerequisites

- Bash shell environment
- zip utility

### Build Process

1. Make sure the build script is executable:
   ```bash
   chmod +x build.sh
   ```

2. Run the build script:
   ```bash
   ./build.sh
   ```

3. The built extensions will be available in the `build` directory:
   - Firefox: `build/lyra-firefox-[version].xpi`
   - Chrome: `build/lyra-chrome-[version].zip`

## Installation

### Firefox

#### Developer Installation
1. Open Firefox
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to your project folder and select the `manifest.json` file or the XPI file from the build directory

#### Regular Installation
- Install from Firefox Add-ons when published
- Or manually install the XPI file:
  1. Go to `about:addons`
  2. Click the gear icon
  3. Select "Install Add-on From File..."
  4. Choose the XPI file

### Chrome/Edge/Opera

1. Open Chrome/Edge/Opera
2. Go to `chrome://extensions` (or equivalent in other browsers)
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked"
5. Navigate to your project's `build/chrome` folder and select it

## Usage

### Global Settings
1. Click the Lyra icon in your browser toolbar
2. Set your **Global Gain** (default: 1.5x) - this applies to all websites
3. Optionally create **Domain Overrides** for specific sites:
   - Adjust the domain gain slider to your preferred level
   - Click "Save Override" to save settings for the current domain
   - Click "Clear Override" to remove domain-specific settings

### Page Controls
1. Use the **Current Page Controls** to adjust all media on the current page:
   - **Gain**: Increase or decrease volume
   - **Pan**: Adjust balance between left and right channels
   - **Mono**: Convert stereo to mono (fixes "audio in one ear" issues)
   - **Flip L/R**: Swap left and right audio channels
2. Use the "Reset" button to revert to saved global/domain settings
3. Individual media elements can be adjusted separately using the "Control individual media elements" section

### Settings Persistence
- Global gain settings are saved automatically and apply to all new tabs
- Domain overrides are saved per-domain and take precedence over global settings
- Page-level adjustments are temporary and reset when you reload the page

## Limitations

- Due to browser security restrictions, the extension cannot modify audio from cross-origin media sources (media hosted on different domains)
- Page-level adjustments (beyond saved global/domain settings) are reset when the page is reloaded
- Global and domain settings persist across browser sessions

## License

See the [LICENSE.md](LICENSE.md) file for details.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests to improve the extension.

## Acknowledgments

Lyra is a customized version inspired by SoundFixer extension, with updated functionality and design improvements.
