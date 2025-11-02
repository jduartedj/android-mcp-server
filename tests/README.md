# Test Scripts and Examples

This directory contains test and example scripts for the Android MCP Server.

## Example Scripts

### Basic Examples

- **`test-launch.js`** - Basic script to launch an app via MCP
- **`test-mcp-infrastructure.js`** - Verify MCP server connectivity
- **`example-scrcpy-streaming.js`** - Scrcpy streaming for fast frame capture
- **`example-form-filling.js`** - WebView form filling techniques

### Navigation and Interaction

- **`test-real-navigation.ps1`** - PowerShell script demonstrating UI navigation with streaming
- **`test-stream-touch-navigation.js`** - Node.js example of touch-based navigation

### Advanced Topics

- **`test-uiautomator-text-input.js`** - UIAutomator text input methods
- **`test-complete-workflow.js`** - Complete end-to-end automation workflow

## Running Tests

### Prerequisites

1. Android device connected via USB with debugging enabled
2. ADB installed and configured
3. Android MCP server running: `node dist/index.js`

### Basic Test

```bash
# Verify server is working
node tests/test-launch.js
```

### Form Filling Example

```bash
# See how to fill form fields in WebView apps
node tests/example-form-filling.js
```

### Streaming Performance

```bash
# Test scrcpy streaming for fast frame capture
node tests/example-scrcpy-streaming.js
```

### Full Navigation Workflow

```bash
# Run PowerShell navigation example
pwsh -File tests/test-real-navigation.ps1
```

## Key Concepts Demonstrated

### 1. Screenshot Capture
```javascript
const screenshot = await callMCP("android_screenshot", {});
```

### 2. Touch Interaction
```javascript
await callMCP("android_touch", { x: 500, y: 1000 });
```

### 3. Swipe Gesture
```javascript
await callMCP("android_swipe", {
  startX: 500,
  startY: 1500,
  endX: 500,
  endY: 500,
});
```

### 4. Fast Streaming
```javascript
await callMCP("android_start_scrcpy_stream", {});
const frame = await callMCP("android_get_latest_frame", {});
```

### 5. Text Input (WebView Forms)
```javascript
// By index
await callMCP("android_webview_set_text_by_index", {
  fieldIndex: 0,
  text: "John",
});

// By placeholder
await callMCP("android_webview_set_text_by_placeholder", {
  placeholder: "First name",
  text: "John",
});

// By selector
await callMCP("android_webview_set_text_by_selector", {
  selector: 'input[name="firstName"]',
  text: "John",
});
```

## Documentation

For detailed information, see:

- **Main README:** `../README.md`
- **Device Setup:** `../DEVICE_SETUP.md`
- **Scrcpy Streaming:** `../docs/SCRCPY_AND_STREAMING.md`
- **UIAutomator Input:** `../docs/UIAUTOMATOR_INPUT_ACTIONS.md`
- **Full API Reference:** See tool descriptions in `../README.md`

## Tips for Writing Tests

1. **Always check prerequisites:**
   ```javascript
   const devices = await getDevices();
   if (devices.length === 0) throw new Error("No device connected");
   ```

2. **Add appropriate delays:**
   ```javascript
   await screenshot();
   await sleep(500); // Let UI render
   await touch(x, y);
   ```

3. **Verify state before actions:**
   ```javascript
   const screen = await screenshot();
   if (!screen.includes("expected_element")) {
     throw new Error("UI not in expected state");
   }
   ```

4. **Use meaningful error messages:**
   ```javascript
   if (!result.success) {
     throw new Error(`Failed to fill field: ${result.error}`);
   }
   ```

5. **Clean up after tests:**
   ```javascript
   try {
     // Test code
   } finally {
     await stopScrcpyStream(); // Clean up resources
   }
   ```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Device not found" | Check USB connection and enable debugging |
| "ADB not found" | Install ADB or let MCP download it automatically |
| "Screenshot is blank" | Device may be locked - unlock and keep awake |
| "Touch not working" | Verify coordinates and check screen timeout settings |
| "Scrcpy not found" | Install scrcpy via package manager |

## Contributing New Tests

When adding new test scripts:

1. Include clear comments explaining what's being tested
2. Add error handling and meaningful error messages
3. Document any prerequisites or setup needed
4. Include both successful and failure cases
5. Add timing information for performance benchmarks
6. Update this README with the new script

## Support

For issues or questions:
- Check the main README.md
- Review DEVICE_SETUP.md for setup issues
- See docs/UIAUTOMATOR_INPUT_ACTIONS.md for input method details
- Check docs/SCRCPY_AND_STREAMING.md for streaming issues
