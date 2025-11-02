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
