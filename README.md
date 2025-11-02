# Android MCP Server

A Model Context Protocol (MCP) server providing comprehensive Android device control with **19 powerful tools** for UI automation, screen capture, and ultra-fast H.264 streaming via Scrcpy.

## Features

- 📸 **Screenshots**: Capture screenshots from Android devices
- 👆 **Touch & Gestures**: Simulate touch, long press, swipe, and multi-point interactions
- 🎯 **UIAutomator**: Full UI hierarchy inspection and element interaction (10 tools)
  - Dump complete XML UI hierarchy
  - Find elements by resource ID or text
  - Click, double-click, long-click on elements
  - Set/clear text in input fields
  - Toggle checkboxes
  - Wait for elements to appear
  - Scroll within specific elements
- ⚡ **Scrcpy Streaming**: Ultra-fast H.264 video streaming (4 tools)
  - Start/stop H.264 video streams (~2s setup, <50ms frame polling)
  - Capture single frames (100-300ms) or latest stream frames (<50ms)
  - Dramatically faster than screenshot capture
- 🚀 **App Management**: Launch apps and list installed packages
- 🔌 **ADB Integration**: Direct integration with Android Debug Bridge
- ⚡ **Auto-Download**: Automatically downloads ADB and Scrcpy from official sources

## Prerequisites

- Node.js 18 or higher
- Android device connected via USB with USB debugging enabled, or emulator running

**Note:** ADB (Android Debug Bridge) and Scrcpy are optional - the server automatically downloads them from official sources on first use if needed.

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
   The server will start and automatically download ADB/Scrcpy if needed.

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

- `ADB_PATH`: Custom path to ADB executable (default: uses system PATH or auto-downloads)
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
4. Copilot will use the appropriate tool to capture the screen

### Example Prompts for Copilot

Once integrated, you can ask GitHub Copilot:

- "Take a screenshot of my Android device"
- "Start streaming my device screen for real-time monitoring"
- "Get the latest frame from the stream"
- "Tap at coordinates 500, 1000 on my phone"
- "Swipe up on my Android screen"
- "List all installed apps on my device"
- "Launch the Chrome app"
- "Find the login button and click it"
- "Fill in the email field with user@example.com"
- "Dump the UI hierarchy of the current screen"
- "Long press on the menu button"
- "Scroll down in the settings list"
- "Toggle the enable notifications checkbox"
- "Wait for the loading indicator to disappear"

## All 19 MCP Tools

### Basic Tools (5)

#### 1. `android_screenshot`

Capture a screenshot from the Android device.

**Parameters:**
- `outputPath` (optional): Local path to save the screenshot. If not provided, returns base64 encoded image.
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** ~1-2 seconds per capture

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

Simulate a touch event at specific screen coordinates. Supports both quick taps and long presses.

**Parameters:**
- `x` (required): X coordinate
- `y` (required): Y coordinate
- `duration` (optional): Touch duration in milliseconds (default: 100ms for tap, >100ms for long press)
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Immediate

**Example - Quick Tap:**
```json
{
  "name": "android_touch",
  "arguments": { "x": 500, "y": 1000, "duration": 100 }
}
```

**Example - Long Press:**
```json
{
  "name": "android_touch",
  "arguments": { "x": 500, "y": 1000, "duration": 2000 }
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

**Performance:** Immediate

**Example:**
```json
{
  "name": "android_swipe",
  "arguments": {
    "startX": 500, "startY": 1500, "endX": 500, "endY": 500, "duration": 300
  }
}
```

#### 4. `android_launch_app`

Launch an Android app by package name.

**Parameters:**
- `packageName` (required): Package name of the app (e.g., com.example.app, com.google.android.apps.maps)
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** ~1-2 seconds

**Example:**
```json
{
  "name": "android_launch_app",
  "arguments": { "packageName": "com.example.app" }
}
```

#### 5. `android_list_packages`

List installed packages on the Android device with optional filtering.

**Parameters:**
- `filter` (optional): Search filter for package names (case-insensitive)
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Medium (retrieves full package list)

**Example - List All Packages:**
```json
{
  "name": "android_list_packages",
  "arguments": {}
}
```

**Example - Filter Packages:**
```json
{
  "name": "android_list_packages",
  "arguments": { "filter": "google" }
}
```

### UIAutomator Tools (10)

#### 6. `android_uiautomator_dump`

Dump the complete UI hierarchy of the current screen as XML for inspection and element identification.

**Parameters:**
- `deviceSerial` (optional): Target specific device by serial number

**Returns:** Complete XML UI hierarchy that can be parsed to find element resource IDs and attributes.

**Performance:** ~500-800ms

**Use Cases:**
- Inspecting app UI structure
- Finding element resource IDs for automation
- Understanding view hierarchies

**Example:**
```json
{
  "name": "android_uiautomator_dump",
  "arguments": {}
}
```

#### 7. `android_uiautomator_find`

Find UI elements by resource ID or text content using UIAutomator.

**Parameters:**
- `resourceId` (optional): Resource ID to search for (e.g., com.example.app:id/button_submit)
- `text` (optional): Text content to search for
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Fast

**Example - Find by Resource ID:**
```json
{
  "name": "android_uiautomator_find",
  "arguments": { "resourceId": "com.example.app:id/email_input" }
}
```

**Example - Find by Text:**
```json
{
  "name": "android_uiautomator_find",
  "arguments": { "text": "Submit" }
}
```

#### 8. `android_uiautomator_click`

Click on a UI element by resource ID.

**Parameters:**
- `resourceId` (required): Resource ID of the element to click
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Immediate

**Example:**
```json
{
  "name": "android_uiautomator_click",
  "arguments": { "resourceId": "com.example.app:id/button_submit" }
}
```

#### 9. `android_uiautomator_double_click`

Perform a double-click on a UI element by resource ID.

**Parameters:**
- `resourceId` (required): Resource ID of the element
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Immediate

**Example:**
```json
{
  "name": "android_uiautomator_double_click",
  "arguments": { "resourceId": "com.example.app:id/text_field" }
}
```

#### 10. `android_uiautomator_long_click`

Perform a long-click on a UI element by resource ID.

**Parameters:**
- `resourceId` (required): Resource ID of the element
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Immediate

**Example:**
```json
{
  "name": "android_uiautomator_long_click",
  "arguments": { "resourceId": "com.example.app:id/menu_item" }
}
```

#### 11. `android_uiautomator_set_text`

Set text on a UI element by resource ID. Automatically clears existing text first.

**Parameters:**
- `resourceId` (required): Resource ID of the element
- `text` (required): Text to set
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Immediate

**Example:**
```json
{
  "name": "android_uiautomator_set_text",
  "arguments": {
    "resourceId": "com.example.app:id/email_input",
    "text": "user@example.com"
  }
}
```

#### 12. `android_uiautomator_clear_text`

Clear text from a UI element by resource ID.

**Parameters:**
- `resourceId` (required): Resource ID of the element
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Immediate

**Example:**
```json
{
  "name": "android_uiautomator_clear_text",
  "arguments": { "resourceId": "com.example.app:id/search_input" }
}
```

#### 13. `android_uiautomator_toggle_checkbox`

Toggle a checkbox element by resource ID.

**Parameters:**
- `resourceId` (required): Resource ID of the checkbox
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Immediate

**Example:**
```json
{
  "name": "android_uiautomator_toggle_checkbox",
  "arguments": { "resourceId": "com.example.app:id/agree_checkbox" }
}
```

#### 14. `android_uiautomator_wait`

Wait for a UI element to appear by resource ID with timeout support.

**Parameters:**
- `resourceId` (required): Resource ID to wait for
- `timeoutMs` (optional): Maximum wait time in milliseconds (default: 5000)
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Configurable (up to timeout)

**Example:**
```json
{
  "name": "android_uiautomator_wait",
  "arguments": {
    "resourceId": "com.example.app:id/loading_indicator",
    "timeoutMs": 10000
  }
}
```

#### 15. `android_uiautomator_scroll_in_element`

Scroll within a specific scrollable UI element.

**Parameters:**
- `resourceId` (required): Resource ID of the scrollable element
- `direction` (required): Direction to scroll (up, down, left, right)
- `distance` (optional): Distance to scroll in pixels (default: 500)
- `deviceSerial` (optional): Target specific device by serial number

**Performance:** Immediate

**Example:**
```json
{
  "name": "android_uiautomator_scroll_in_element",
  "arguments": {
    "resourceId": "com.example.app:id/list_view",
    "direction": "down",
    "distance": 500
  }
}
```

### Scrcpy Streaming Tools (4)

Scrcpy streaming provides ultra-fast frame capture using H.264 video encoding, perfect for real-time monitoring, rapid screenshot sequences, or continuous frame polling.

#### 16. `android_start_scrcpy_stream`

Initialize an H.264 video stream from the Android device using Scrcpy.

**Parameters:**
- `deviceSerial` (optional): Target specific device by serial number
- `bitrate` (optional): Video bitrate in Mbps (default: 4)
- `fps` (optional): Frames per second (default: 60)

**Performance:** ~2 seconds setup, <50ms per frame polling afterward

**Advantages:**
- Ultra-fast frame capture (<50ms vs 1-2s for screenshot)
- Continuous streaming with pre-buffered frames
- Ideal for real-time monitoring
- H.264 compression reduces bandwidth

**Example:**
```json
{
  "name": "android_start_scrcpy_stream",
  "arguments": {
    "bitrate": 4,
    "fps": 30
  }
}
```

#### 17. `android_get_latest_frame`

Poll the latest frame from an active Scrcpy stream.

**Parameters:**
- `deviceSerial` (optional): Target specific device by serial number
- `outputPath` (optional): Save frame to file, otherwise returns base64

**Performance:** <50ms per frame (due to pre-buffered streaming)

**Use Cases:**
- Real-time monitoring
- Rapid screenshot sequences
- Continuous frame polling
- Streaming visualization

**Example:**
```json
{
  "name": "android_get_latest_frame",
  "arguments": {
    "outputPath": "./current_frame.png"
  }
}
```

#### 18. `android_stop_scrcpy_stream`

Stop an active Scrcpy H.264 stream.

**Parameters:**
- `deviceSerial` (optional): Target specific device by serial number

**Example:**
```json
{
  "name": "android_stop_scrcpy_stream",
  "arguments": {}
}
```

#### 19. `android_capture_frame_scrcpy`

Capture a single frame using Scrcpy without starting a persistent stream.

**Parameters:**
- `deviceSerial` (optional): Target specific device by serial number
- `outputPath` (optional): Save frame to file, otherwise returns base64
- `bitrate` (optional): Video bitrate in Mbps (default: 4)

**Performance:** 100-300ms (faster than screenshot, slower than streaming)

**Use Cases:**
- One-off frame captures
- When streaming overhead isn't justified
- Single frame comparison
- Lightweight capture operations

**Example:**
```json
{
  "name": "android_capture_frame_scrcpy",
  "arguments": {
    "outputPath": "./single_frame.png"
  }
}
```

## Performance Comparison

| Tool | Purpose | Speed | Best For |
|------|---------|-------|----------|
| `android_screenshot` | Basic capture | 1-2s | Simple screenshots, initial inspection |
| `android_capture_frame_scrcpy` | Single Scrcpy frame | 100-300ms | Faster one-off captures than screenshot |
| `android_start_scrcpy_stream` | Initialize stream | ~2s setup | Real-time monitoring workflows |
| `android_get_latest_frame` | Poll stream | <50ms | Rapid frame sequences, real-time apps |
| `android_touch` | Tap/long press | Immediate | UI interaction |
| `android_swipe` | Swipe gesture | Immediate | Navigation, scrolling |
| `android_uiautomator_dump` | UI inspection | 500-800ms | Element discovery |
| `android_uiautomator_find` | Element search | Fast | Located specific elements |
| `android_uiautomator_*` | Element interaction | Immediate | Form filling, UI automation |

## Common Use Cases

### 1. Automated Testing
```
1. Dump UI hierarchy to find element IDs
2. Click buttons and input text using resource IDs
3. Use streaming to verify visual changes in real-time
4. Scroll and navigate through the app
```

### 2. Real-Time Monitoring
```
1. Start Scrcpy stream (one-time ~2s setup)
2. Poll latest frames continuously (<50ms each)
3. Process frames for visual analysis
4. Stop stream when done
```

### 3. Rapid Frame Capture Sequence
```
1. Start Scrcpy stream
2. Get latest frame multiple times (much faster than screenshot)
3. Process frame sequence for animation/comparison
4. Stop stream
```

### 4. Form Filling (WebView or Native)
```
1. Find form fields by resource ID or text
2. Clear existing text
3. Set new text values
4. Toggle checkboxes and radio buttons
5. Click submit button
```

### 5. Multi-Device Automation
Use `deviceSerial` parameter to target specific devices:
```
1. List connected devices via ADB
2. Specify device serial for each tool call
3. Automate workflows on multiple devices in parallel
4. Useful for device farms and testing labs
```

### 6. App Discovery
```
1. List all packages (potentially 100+)
2. Filter packages by name (e.g., "google", "com.example")
3. Launch apps by package name
4. Perfect for discovering available apps on the device
```

## ADB & Scrcpy Setup

### Automatic Installation

The server automatically downloads and installs from official sources:
- **ADB**: From Android Platform Tools
- **Scrcpy**: From official releases

Downloaded tools stored in `~/.android-mcp-server/platform-tools/`

### Manual Installation (Optional)

**Windows:**
```bash
choco install adb
choco install scrcpy
```

**macOS:**
```bash
brew install android-platform-tools
brew install scrcpy
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install android-tools-adb scrcpy
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

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No Android devices found" | Ensure device is connected via USB and USB debugging is enabled. Run `adb devices` to verify. |
| UIAutomator element not found | Use `android_uiautomator_dump` to inspect the XML and verify the resource ID exists. |
| Scrcpy stream won't start | Ensure Scrcpy is installed or allow auto-download to complete. Check device is connected. |
| "ADB not found" error | Run the server once to auto-download ADB, or manually install platform-tools. |
| Touch coordinates not working | Verify coordinates are within screen bounds. Use screenshots to determine correct coordinates. |
| App launch fails | Verify package name is correct using `android_list_packages`. Try filtering if unsure. |
| Streaming frames are slow | Reduce bitrate/fps or use single `android_capture_frame_scrcpy` for one-off captures. |

## Advanced Patterns

### Real-Time Visual Monitoring
```
1. android_start_scrcpy_stream (2s setup)
2. Loop: android_get_latest_frame (<50ms each)
3. Process frames for ML/analysis
4. android_stop_scrcpy_stream when done
```

### Stress Testing with Rapid Frames
```
1. Start stream
2. Perform action on device
3. Capture 10+ frames in rapid succession (<50ms each)
4. Compare frame changes for regression detection
```

### Multi-Step Form Automation
```
1. android_uiautomator_dump (find all fields)
2. For each field:
   - android_uiautomator_find (locate)
   - android_uiautomator_set_text (fill)
3. android_uiautomator_click (submit)
4. android_uiautomator_wait (result screen)
5. android_screenshot (verify)
```

### Device Farm Parallel Testing
```
1. Get device list
2. For each device:
   - Specify deviceSerial in all tool calls
   - Run automation sequence
   - Compare results across devices
```

## Architecture

The server uses the Model Context Protocol to expose Android device control:

- **ADB Wrapper** (`src/adb-wrapper.ts`): Device communication, auto-downloads ADB
- **Scrcpy Integration** (`src/adb-wrapper.ts`): H.264 streaming, frame polling
- **UIAutomator Methods** (`src/adb-wrapper.ts`): Full XML dumping, element interaction
- **Tool Handlers** (`src/handlers.ts`): All 19 tool operations
- **MCP Server** (`src/index.ts`): Exposes all tools via Model Context Protocol

### Supported Android Versions
- Android 5.0+ (API Level 21+)
- Scrcpy streaming: Android 5.0+ via ADB, optimal on 7.0+

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode (if supported)
npm run watch
```

### Adding New Tools

To add a new tool:

1. **Implement method** in `src/adb-wrapper.ts`
2. **Implement handler** in `src/handlers.ts`
3. **Register tool** in `src/index.ts` with name, description, and schema
4. **Build and test** with the server running

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
