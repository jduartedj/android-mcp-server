# Android MCP Server

A Model Context Protocol (MCP) server that provides Android device control capabilities via ADB (Android Debug Bridge).

## Features

- � **Scrcpy Streaming**: Ultra-fast H.264 video streaming for <50ms frame polling
- �📸 **Screenshot**: Capture screenshots from Android devices
- 👆 **Touch**: Simulate touch events at specific coordinates
- 👉 **Swipe**: Perform swipe gestures between coordinates
- 🔌 **ADB Integration**: Direct integration with Android Debug Bridge
- 🚀 **Auto-Download**: Automatically downloads ADB from official Android sources if not found
- ⚡ **Real-time Agent Support**: High-performance frame capture for AI decision-making

## Prerequisites

- Node.js 18 or higher
- Android device connected via USB with USB debugging enabled, or emulator running

**Note:** ADB (Android Debug Bridge) is optional - if not found in your system PATH, the server will automatically download it from official Android sources on first use.

## Quick Start

1. **Clone and Build**
   ```bash
   git clone https://github.com/jduartedj/android-mcp-server.git
   cd android-mcp-server
   npm install
   npm run build
   ```

2. **Test the Server**
   ```bash
   node dist/index.js
   ```
   The server will start and automatically download ADB if needed.

3. **Add to VS Code** (see [VS Code Integration](#vs-code-integration) below)

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the Server Standalone

```bash
node dist/index.js
```

### Configuration

The server supports the following environment variables:

- `ADB_PATH`: Custom path to ADB executable (default: uses system PATH)
- `DEVICE_SERIAL`: Specific device serial number to target (default: first available device)

## VS Code Integration

### Adding to VS Code GitHub Copilot

To use this MCP server with GitHub Copilot in VS Code:

1. **Open VS Code Settings** (Ctrl+, or Cmd+,)

2. **Search for MCP** or navigate to: `GitHub Copilot > Chat > MCP Servers`

3. **Edit the MCP configuration** by clicking "Edit in settings.json"

4. **Add the Android MCP Server** to your configuration:

```json
{
  "github.copilot.chat.mcp.servers": {
    "android-mcp-server": {
      "command": "node",
      "args": ["F:\\android-mcp-server\\dist\\index.js"],
      "env": {
        "ADB_PATH": "",
        "DEVICE_SERIAL": ""
      }
    }
  }
}
```

**Note:** Replace `F:\\android-mcp-server\\dist\\index.js` with the actual absolute path to your `dist/index.js` file. Use double backslashes on Windows.

5. **Alternative: Using npx** (if published to npm):

```json
{
  "github.copilot.chat.mcp.servers": {
    "android-mcp-server": {
      "command": "npx",
      "args": ["-y", "android-mcp-server"]
    }
  }
}
```

6. **Reload VS Code** or restart the GitHub Copilot extension

### Verifying the Integration

After adding the server:

1. Open GitHub Copilot Chat in VS Code
2. Type `@workspace` and you should see the Android MCP tools available
3. Try asking: "Take a screenshot of my Android device"
4. Copilot will use the `android_screenshot` tool to capture the screen

### Example Prompts for Copilot

Once integrated, you can ask GitHub Copilot:

- "Take a screenshot of my Android device"
- "Tap at coordinates 500, 1000 on my phone"
- "Swipe up on my Android screen"
- "Take a screenshot and save it to ./my-screenshot.png"

### Available Tools

#### 1. `android_start_scrcpy_stream`

Start a high-performance H.264 video stream from the device for rapid frame polling.

**Parameters:**
- `deviceSerial` (optional): Target specific device by serial number

**Latency:** ~2 seconds to initialize, then <50ms per frame

**Use Case:** Real-time screen monitoring for agent decision-making

**Example:**
```json
{
  "name": "android_start_scrcpy_stream",
  "arguments": {
    "deviceSerial": "FA8AY0A0000"
  }
}
```

#### 2. `android_get_latest_frame`

Get the latest pre-buffered frame from the active scrcpy stream.

**Parameters:** None (uses active stream)

**Latency:** <50ms

**Returns:** H.264 encoded frame data (buffer)

**Example:**
```json
{
  "name": "android_get_latest_frame",
  "arguments": {}
}
```

#### 3. `android_stop_scrcpy_stream`

Stop the active scrcpy stream and clean up resources.

**Parameters:** None

**Example:**
```json
{
  "name": "android_stop_scrcpy_stream",
  "arguments": {}
}
```

#### 4. `android_capture_frame_scrcpy`

Capture a single frame via scrcpy or fallback to ADB screencap.

**Parameters:**
- `outputPath` (optional): Local path to save the frame
- `deviceSerial` (optional): Target specific device by serial number

**Latency:** 100-300ms (scrcpy) or 500-1000ms (ADB fallback)

**Example:**
```json
{
  "name": "android_capture_frame_scrcpy",
  "arguments": {
    "outputPath": "./frame.png",
    "deviceSerial": "FA8AY0A0000"
  }
}
```

#### 5. `android_screenshot`

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

#### 6. `android_touch`

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

#### 7. `android_swipe`

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

## Device Setup

### Quick Start

1. **Set up ADB** (see [Device Setup Guide](./DEVICE_SETUP.md))
2. **Enable USB Debugging** on your Android device
3. **Connect via USB** and accept the debugging prompt
4. **Test connection**: `adb devices -l`
5. **Run tests**: `node tests/real-device-test.js`

### Detailed Setup Instructions

For platform-specific installation of ADB, device configuration, emulator setup, and troubleshooting, see [Device Setup Guide](./DEVICE_SETUP.md).

### Automatic ADB Installation

The server will automatically download and install ADB from official Android sources if it's not found on your system. The downloaded ADB will be stored in `~/.android-mcp-server/platform-tools/`.

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

## Project Structure

```
android-mcp-server/
├── src/                          # Source code
│   ├── index.ts                 # MCP server and tool definitions
│   ├── adb-wrapper.ts           # ADB command wrapper and device control
│   └── handlers.ts              # Tool handler implementations
├── dist/                        # Compiled JavaScript (generated)
├── docs/                        # Documentation
│   ├── README.md               # Documentation index
│   └── UIAUTOMATOR_INPUT_ACTIONS.md  # UIAutomator input methods guide
├── tests/                       # Test scripts and examples
│   ├── README.md               # Test documentation
│   ├── test-launch.js          # Basic app launch test
│   ├── create-user.js          # User registration example
│   └── ...                     # Additional test scripts
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
