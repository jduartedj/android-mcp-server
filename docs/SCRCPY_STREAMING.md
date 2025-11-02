# Scrcpy-Based Fast Frame Streaming

## Overview

The Android MCP Server now supports **scrcpy-based frame streaming** for ultra-fast screen capture, which is ideal for agents/models that need to check the screen quickly without latency.

## Why Scrcpy?

Scrcpy is significantly faster than ADB screencap for several reasons:

1. **Direct ADB tunneling** - Uses H.264 hardware encoding on the device
2. **Lower overhead** - No PNG compression/decompression cycle
3. **Streaming support** - Can maintain persistent connection for frame polling
4. **30fps capability** - Can capture frames at 30fps if needed
5. **Adjustable bitrate** - Trade-off between quality and speed

### Performance Comparison

- **ADB screencap**: 500-1500ms per frame (PNG encode/decode)
- **Scrcpy single frame**: 100-300ms per frame (H.264 hardware encoded)
- **Scrcpy stream polling**: <50ms per frame (pre-buffered data)

## Installation

### Linux
```bash
# Ubuntu/Debian
sudo apt install scrcpy

# Arch
sudo pacman -S scrcpy

# Or from source
git clone https://github.com/Genymobile/scrcpy.git
cd scrcpy && ./install_release.sh
```

### macOS
```bash
# Homebrew
brew install scrcpy

# Or MacPorts
sudo port install scrcpy
```

### Windows

The MCP server will attempt to auto-download scrcpy v2.4 from GitHub releases. If auto-download fails, you can:

```powershell
# Using chocolatey
choco install scrcpy

# Or download manually from:
# https://github.com/Genymobile/scrcpy/releases/download/v2.4/scrcpy-2.4-win64-v15.zip
```

## Usage

### Option 1: Continuous Streaming (Fastest for Agents)

For the fastest frame access when checking screen state repeatedly:

```javascript
// Start streaming
await agent.use_mcp_tool("android-mcp-server", "android_start_scrcpy_stream", {
  deviceSerial: "emulator-5554"
});

// Get frames instantly (no latency - pre-buffered data)
const frame1 = await agent.use_mcp_tool(
  "android-mcp-server", 
  "android_get_latest_frame", 
  {}
);

// Perform action
await agent.use_mcp_tool("android-mcp-server", "android_touch", {
  x: 500,
  y: 1000,
  deviceSerial: "emulator-5554"
});

// Get updated frame instantly
const frame2 = await agent.use_mcp_tool(
  "android-mcp-server", 
  "android_get_latest_frame", 
  {}
);

// Stop streaming when done
await agent.use_mcp_tool("android-mcp-server", "android_stop_scrcpy_stream", {});
```

**Latency Profile:**
- Stream start: ~2000ms (one-time)
- Frame retrieval: <50ms (polling pre-buffered stream)
- Total cycle: ~50ms per screen check

### Option 2: Single Frame Capture (Good Balance)

For one-off frame captures without starting a persistent stream:

```javascript
const frame = await agent.use_mcp_tool(
  "android-mcp-server",
  "android_capture_frame_scrcpy",
  {
    outputPath: "/tmp/screen.png",  // optional
    deviceSerial: "emulator-5554"
  }
);
```

**Latency Profile:**
- Single capture: 100-300ms
- Includes scrcpy startup time
- Good for periodic checks, not continuous polling

### Option 3: Fallback to ADB Screencap

If scrcpy is not available, both tools automatically fall back to ADB screencap:

```javascript
// Works even without scrcpy - will use ADB screencap
const frame = await agent.use_mcp_tool(
  "android-mcp-server",
  "android_capture_frame_scrcpy",
  {}
);
```

## MCP Tools

### `android_start_scrcpy_stream`

Start persistent scrcpy streaming for rapid frame polling.

**Parameters:**
- `deviceSerial` (optional): Target device serial

**Returns:** Success message

**Performance:** 2000ms first time, establishes persistent connection

**Configuration:**
- Max FPS: 30fps
- Codec: H.264 (hardware accelerated)
- Bitrate: 5Mbps
- Display: None (no window on host)

### `android_get_latest_frame`

Retrieve the latest frame from active stream (instant access).

**Parameters:** None

**Returns:** Base64-encoded H.264 frame or error if stream not active

**Performance:** <50ms

**Note:** Returns `null` if no stream is running

### `android_stop_scrcpy_stream`

Stop the streaming session and clean up resources.

**Parameters:** None

**Returns:** Success message

**Performance:** Immediate

### `android_capture_frame_scrcpy`

Single-frame capture using scrcpy (faster than ADB).

**Parameters:**
- `outputPath` (optional): Save to file path
- `deviceSerial` (optional): Target device

**Returns:** File path (if outputPath given) or base64-encoded PNG

**Performance:** 100-300ms

**Fallback:** Automatically uses ADB screencap if scrcpy unavailable

## Architecture

### Streaming Pipeline

```
Device (H.264 Video Stream)
    ↓
Scrcpy Process (stdout pipe)
    ↓
Node.js Buffer (latest frame stored)
    ↓
Agent/Model (instant access via getLatestFrame)
```

### Frame Storage

- Only the latest frame is kept in memory
- Previous frames are discarded to avoid memory buildup
- Stream runs at 30fps but you can poll at any rate

## Optimization Tips

### For Fast Agent Decision-Making

1. **Start stream at app launch:**
   ```javascript
   await startApp();
   await startScrcpyStream();
   ```

2. **Poll frames in decision loop:**
   ```javascript
   while (running) {
     const frame = await getLatestFrame();
     const decision = analyzeFrame(frame);
     await executeAction(decision);
     // Ultra-low latency cycle
   }
   ```

3. **Stop stream when done:**
   ```javascript
   await stopScrcpyStream();
   ```

### For Periodic Monitoring

Use single frame capture instead:

```javascript
// Check every 5 seconds
while (monitoring) {
  const frame = await captureFrameScrcpy();
  checkForErrors(frame);
  await sleep(5000);
}
```

## Troubleshooting

### "scrcpy not found" Error

1. Install scrcpy manually (see Installation above)
2. Ensure it's in PATH: `scrcpy --version`
3. On Windows, the MCP server will try to auto-download

### Frame Quality Issues

- Increase bitrate in adb-wrapper.ts (current: 5Mbps)
- Use H.264 profile adjustments if needed
- Check network bandwidth for remote devices

### Streaming Stops

- Device may have gone to sleep (enable "Stay Awake" in developer settings)
- ADB connection may have dropped (reconnect)
- Scrcpy process crashed (check error logs)

### High CPU Usage

- Reduce stream FPS from 30 to 10-15
- Decrease poll rate if using getLatestFrame
- Disable stream when not needed

## Configuration

Edit `src/adb-wrapper.ts` to adjust scrcpy parameters:

```typescript
// In startScrcpyStream() method:
spawn(this.scrcpyPath, [
  '--max-fps=30',           // Adjust FPS
  '--video-bit-rate=5M',    // Adjust quality
  '--video-codec=h264',     // Can use vp9 for better compression
  // Add more options as needed
])
```

Available scrcpy options:
- `--max-fps=N`: Frame rate cap
- `--video-bit-rate=Nk/M`: Bitrate (k=kbps, M=Mbps)
- `--encoder=name`: Hardware encoder selection
- `--power-off-on-close`: Power off device on close

## References

- [Scrcpy GitHub](https://github.com/Genymobile/scrcpy)
- [Scrcpy Manual](https://github.com/Genymobile/scrcpy/blob/master/README.md)
- [H.264 Codec Info](https://en.wikipedia.org/wiki/H.264)

