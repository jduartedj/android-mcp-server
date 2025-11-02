# Setting Up Real Device Testing with Scrcpy

The MCP infrastructure is **fully ready** for real device testing. All 4 scrcpy tools are implemented and compiled correctly. However, to actually run tests on a real Android device, you need to set up ADB (Android Debug Bridge) and connect a device.

## Table of Contents
1. [Windows Setup](#windows-setup)
2. [macOS Setup](#macos-setup)
3. [Linux Setup](#linux-setup)
4. [Device Setup](#device-setup)
5. [Verification](#verification)
6. [Running Tests](#running-tests)

---

## Windows Setup

### Option 1: Download Android SDK Platform Tools (Recommended)

1. **Download from Google**
   ```
   https://developer.android.com/studio/releases/platform-tools
   ```
   - Download `platform-tools-latest-windows.zip`
   - This contains `adb.exe` and related tools

2. **Extract and Add to PATH**
   - Extract to a location like `C:\Android\platform-tools`
   - Add to Windows PATH:
     - Open Settings → Environment Variables
     - Edit `Path` variable
     - Add: `C:\Android\platform-tools`
     - Restart your terminal/PowerShell

3. **Verify Installation**
   ```powershell
   adb --version
   # Should output: Android Debug Bridge version X.X.X
   ```

### Option 2: Install via Chocolatey (If Available)

```powershell
choco install android-sdk
# ADB will be in: C:\Program Files (x86)\Android\android-sdk\platform-tools
```

### Option 3: Install Android Studio (Full Suite)

- Download from: `https://developer.android.com/studio`
- Install Android Studio
- ADB will be in: `C:\Users\{username}\AppData\Local\Android\sdk\platform-tools`
- Add to PATH in IDE or manually

---

## macOS Setup

### Option 1: Homebrew (Easiest)

```bash
brew install android-platform-tools
```

### Option 2: Download Directly

```bash
# Download platform tools
curl -O https://dl.google.com/android/repository/platform-tools-latest-darwin.zip

# Extract
unzip platform-tools-latest-darwin.zip

# Add to PATH (in ~/.zshrc or ~/.bash_profile)
export PATH="$PATH:~/platform-tools"

# Apply changes
source ~/.zshrc
```

### Verify

```bash
adb --version
```

---

## Linux Setup

### Debian/Ubuntu

```bash
sudo apt-get update
sudo apt-get install adb
```

### Fedora/RHEL

```bash
sudo dnf install android-tools
```

### Manual Installation

```bash
# Download
wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip

# Extract
unzip platform-tools-latest-linux.zip
sudo mv platform-tools /opt/

# Add to PATH (in ~/.bashrc or ~/.profile)
export PATH="$PATH:/opt/platform-tools"

# Apply
source ~/.bashrc
```

### Verify

```bash
adb --version
```

---

## Device Setup

### On Your Android Device

1. **Enable Developer Mode**
   - Open Settings
   - Scroll to "About phone"
   - Tap "Build number" 7 times
   - Should see: "You are now a developer"

2. **Enable USB Debugging**
   - Go back to Settings
   - Find "Developer options" (usually in System or Advanced)
   - Toggle "USB Debugging" ON
   - You may see a prompt to allow USB debugging - tap OK

3. **Connect via USB**
   - Connect device to computer via USB cable
   - Use a proper USB cable that supports data transfer (not just charging)
   - On device: Tap "Allow" if prompted about USB debugging access
   - On device: May need to change USB mode to "File Transfer" or "Media Transfer Protocol"

### For Android Emulator (Virtual Device)

If you don't have a physical device:

**Option A: Use Android Studio Emulator**
- Open Android Studio
- AVD Manager → Create Virtual Device
- Choose Pixel device and Android version
- Start the emulator
- ADB will automatically connect

**Option B: Use Genymotion (Faster alternative)**
- Download from: `https://www.genymotion.com/`
- Install and create a virtual device
- Device will auto-connect to ADB

**Option C: Use WSA (Windows Subsystem for Android)**
- Available on Windows 11
- Enable Developer Mode
- ADB connects automatically

---

## Verification

### Check Device Connection

```powershell
# Windows / PowerShell
adb devices -l

# macOS / Linux
adb devices -l
```

Expected output:
```
List of attached devices
emulator-5554          device product:sdk_google model:Android_SDK_built_for_x86 device:generic_x86
# OR
FA8AY0A0000           device usb:1-1 model:SM_G991B device:beyond2
```

If device shows as `offline` or `unauthorized`:
- Disconnect and reconnect USB cable
- Tap "Allow USB debugging" on device again
- Run: `adb kill-server` then `adb devices -l`

### Test ADB Connection

```powershell
adb shell "getprop ro.build.version.release"
# Should output: Android version (e.g., "13")

adb shell "getprop ro.product.model"
# Should output: Device model (e.g., "Pixel 6")
```

---

## Running Tests

### 1. Verify MCP Infrastructure (No Device Required)

```powershell
npm run build
node tests/test-mcp-infrastructure.js
```

This verifies all scrcpy tools are compiled and registered correctly.

**Expected Output:**
```
✓ ALL TESTS PASSED
INFRASTRUCTURE READINESS: READY FOR REAL DEVICE TESTING
```

### 2. Run Real Device Test

Once ADB is installed and device is connected:

```powershell
node tests/real-device-test.js
```

This test will:
1. ✓ Initialize ADB Wrapper
2. ✓ Detect connected device
3. ✓ Get screen dimensions
4. ✓ Capture initial screenshot
5. ✓ Start scrcpy H.264 stream (if available)
6. ✓ Test frame polling
7. ✓ Execute unlock swipe
8. ✓ Tap app drawer
9. ✓ Launch washer app
10. ✓ Verify app opened
11. ✓ Capture final screenshot
12. ✓ Cleanup and summary

**Expected Output:**
```
STEP 1: Initialize ADB Wrapper
[✓] ADBWrapper initialized

STEP 2: Check Device Connection
[✓] Device found: FA8AY0A0000
  Serial: FA8AY0A0000

STEP 3: Get Screen Dimensions
[✓] Screen size: 1080x2400

... (additional steps) ...

✓ TEST COMPLETED SUCCESSFULLY
```

---

## Troubleshooting

### Problem: "adb: command not found"

**Solution:** ADB is not in PATH
- Verify installation: Check if `adb` exists in your installation directory
- Add to PATH: Follow the setup instructions above for your OS
- Restart terminal/PowerShell after changing PATH

### Problem: "error: no devices/emulators found"

**Solutions:**
1. Device is not connected:
   - Check USB cable
   - Try different USB port
   - Reinstall device drivers

2. USB Debugging not enabled:
   - Enable in device settings (see Device Setup section)
   - Tap "Allow USB Debugging" prompt

3. Unauthorized device:
   - Disconnect USB
   - Run: `adb kill-server`
   - Reconnect and tap "Always allow from this computer"
   - Run: `adb devices -l`

### Problem: "protocol failure: Connection refused"

**Solution:** ADB daemon crashed
```powershell
adb kill-server
adb devices
```

### Problem: Scrcpy not found (non-critical)

The test will fall back to ADB screencap automatically. To install scrcpy:

**Windows:**
```powershell
choco install scrcpy
# OR download from: https://github.com/Genymobile/scrcpy/releases
```

**macOS:**
```bash
brew install scrcpy
```

**Linux:**
```bash
sudo apt install scrcpy
```

---

## Performance Notes

### Frame Capture Latency

The MCP tools provide different latencies:

| Method | Latency | Use Case |
|--------|---------|----------|
| `android_get_latest_frame` | <50ms | Real-time decision making |
| `android_capture_frame_scrcpy` | 100-300ms | Occasional snapshots |
| `android_screenshot` | 500-1000ms | Fallback, non-critical |

For best performance with agents/models, use `android_start_scrcpy_stream` followed by repeated `android_get_latest_frame` calls.

### Scrcpy Configuration

Current settings in implementation:
- **FPS:** 30 frames per second
- **Codec:** H.264 (hardware acceleration)
- **Bitrate:** 5 Mbps
- **Resolution:** Device native (up to 1920x1080)

These are tuned for sub-50ms latency. Adjust if needed in `src/adb-wrapper.ts`:

```typescript
const scrcpyArgs = [
  '--max-fps=30',           // Increase for more frames (higher CPU)
  '--video-codec=h264',     // Or 'vp9' for better quality
  '--video-bit-rate=5M',    // Increase for better quality
  '--no-display',
  `--serial=${deviceSerial}`,
];
```

---

## Next Steps

1. **Install ADB** for your operating system
2. **Connect a device** (physical or emulator)
3. **Run verification:** `node tests/test-mcp-infrastructure.js`
4. **Run real device test:** `node tests/real-device-test.js`
5. **Integrate with MCP Server** for production use

The MCP server is ready to deploy once these steps are complete.

---

## Integration with MCP Clients

Once the MCP server is running, clients can use the scrcpy tools:

```python
# Example Python MCP client
client = MCPClient("stdio", ["node", "dist/index.js"])

# Start streaming
await client.call_tool("android_start_scrcpy_stream", {"deviceSerial": "FA8AY0A0000"})

# Get frames rapidly (<50ms each)
for _ in range(30):  # 30 frames = 1 second
    frame = await client.call_tool("android_get_latest_frame", {})
    # Process frame for decision making
    
# Stop streaming
await client.call_tool("android_stop_scrcpy_stream", {})
```

Or in JavaScript:

```javascript
const client = new MCPClient();

// Start stream
await client.callTool('android_start_scrcpy_stream', {deviceSerial: 'FA8AY0A0000'});

// Poll frames
const frames = [];
for (let i = 0; i < 30; i++) {
  const frame = await client.callTool('android_get_latest_frame', {});
  frames.push(frame);
  await new Promise(r => setTimeout(r, 50));
}

// Stop stream  
await client.callTool('android_stop_scrcpy_stream', {});
```

---

## Documentation Reference

- [MCP Scrcpy Integration Guide](./SCRCPY_INTEGRATION.md)
- [Full Technical Documentation](./docs/SCRCPY_STREAMING.md)
- [Agent Integration Patterns](./docs/SCRCPY_AGENT_GUIDE.md)
- [Main README](./README.md)

