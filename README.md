# Android MCP Server

A Model Context Protocol (MCP) server that provides Android device control capabilities via ADB (Android Debug Bridge).

## Features

- 📸 **Screenshot**: Capture screenshots from Android devices
- 👆 **Touch**: Simulate touch events at specific coordinates
- 👉 **Swipe**: Perform swipe gestures between coordinates
- 🔌 **ADB Integration**: Direct integration with Android Debug Bridge
- 🚀 **Auto-Download**: Automatically downloads ADB from official Android sources if not found

## Prerequisites

- Node.js 18 or higher
- Android device connected via USB with USB debugging enabled, or emulator running

**Note:** ADB (Android Debug Bridge) is optional - if not found in your system PATH, the server will automatically download it from official Android sources on first use.

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the Server

```bash
node dist/index.js
```

### Configuration

The server supports the following environment variables:

- `ADB_PATH`: Custom path to ADB executable (default: uses system PATH)
- `DEVICE_SERIAL`: Specific device serial number to target (default: first available device)

### Available Tools

#### 1. `android_screenshot`

Capture a screenshot from the Android device.

**Parameters:**
- `outputPath` (optional): Local path to save the screenshot. If not provided, returns base64 encoded image.
- `deviceSerial` (optional): Target specific device by serial number.

**Example:**
```json
{
  "name": "android_screenshot",
  "arguments": {
    "outputPath": "./screenshot.png"
  }
}
```

#### 2. `android_touch`

Simulate a touch event at specific screen coordinates.

**Parameters:**
- `x` (required): X coordinate
- `y` (required): Y coordinate
- `duration` (optional): Touch duration in milliseconds (default: 100)
- `deviceSerial` (optional): Target specific device by serial number

**Example:**
```json
{
  "name": "android_touch",
  "arguments": {
    "x": 500,
    "y": 1000,
    "duration": 100
  }
}
```

#### 3. `android_swipe`

Perform a swipe gesture between two coordinates.

**Parameters:**
- `startX` (required): Starting X coordinate
- `startY` (required): Starting Y coordinate
- `endX` (required): Ending X coordinate
- `endY` (required): Ending Y coordinate
- `duration` (optional): Swipe duration in milliseconds (default: 300)
- `deviceSerial` (optional): Target specific device by serial number

**Example:**
```json
{
  "name": "android_swipe",
  "arguments": {
    "startX": 500,
    "startY": 1500,
    "endX": 500,
    "endY": 500,
    "duration": 300
  }
}
```

## ADB Setup

### Automatic Installation

The server will automatically download and install ADB from official Android sources if it's not found on your system. The downloaded ADB will be stored in `~/.android-mcp-server/platform-tools/`.

### Manual Installation (Optional)

If you prefer to install ADB manually or want it available system-wide:

**Windows:**
```bash
choco install adb
```

**macOS:**
```bash
brew install android-platform-tools
```

**Linux:**
```bash
sudo apt-get install android-tools-adb
```

### Enabling USB Debugging on Android

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times to enable Developer Options
3. Go to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Connect device via USB and accept the debugging prompt

### Verify Connection

```bash
adb devices
```

You should see your device listed.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch
```

## Architecture

The server uses the Model Context Protocol to expose Android device control capabilities:

- **ADB Wrapper**: Executes ADB commands and handles device communication
- **Tool Handlers**: Implements screenshot, touch, and swipe operations
- **MCP Server**: Exposes tools via the Model Context Protocol

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
