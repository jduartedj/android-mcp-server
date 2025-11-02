# Scrcpy Best Practices for Agent/Model Performance

## The Challenge
You need an agent/model to check the Android screen **quickly** (sub-100ms) and make decisions. Traditional ADB screencap takes 500-1500ms per frame, blocking agent decision-making.

## The Solution: Scrcpy Streaming

Use continuous H.264 video stream from device with pre-buffered frame polling:

```
Device → Scrcpy → Buffer → getLatestFrame() (instant)
```

---

## Fastest Implementation

### 1. Initialize Stream Once

```javascript
await startScrcpyStream({ deviceSerial: "emulator-5554" });
// Takes ~2 seconds, establishes persistent connection
```

### 2. Poll Frames in Decision Loop

```javascript
while (taskRunning) {
  const frame = await getLatestFrame();      // <50ms
  const decision = model.analyze(frame);     // agent/model decides
  
  if (decision.action === 'tap') {
    await touch(decision.x, decision.y);
  }
  
  // Repeat: entire cycle ~50-100ms vs 500-1500ms with ADB
}
```

### 3. Cleanup

```javascript
await stopScrcpyStream();
```

---

## Performance Characteristics

### Streaming Mode (Recommended)
```
Setup: ~2000ms (one-time)
Per frame: <50ms
Total for 10 cycles: ~500ms + 2s setup
```

### Single Capture Mode
```
Per frame: 100-300ms
Good for: Periodic checks (not continuous loops)
Total for 10 captures: 1-3 seconds
```

### ADB Screencap (Fallback)
```
Per frame: 500-1500ms
Good for: One-off, or when scrcpy unavailable
Total for 10 captures: 5-15 seconds
```

---

## Real-World Workflow

### Before (Slow)
```javascript
// Old approach - each check blocks
await launchApp("pt.washer");

for (let field = 0; field < 5; field++) {
  const frame = await screenshot();           // 500-1500ms wait
  const input = findInputField(frame);
  await touch(input.x, input.y);
  
  const verify = await screenshot();          // Another 500-1500ms wait
  if (hasError(verify)) break;
}
// Total: 5-15 seconds
```

### After (Fast)
```javascript
// New approach - streaming
await launchApp("pt.washer");
await startScrcpyStream();  // 2s setup

for (let field = 0; field < 5; field++) {
  const frame = await getLatestFrame();       // <50ms
  const input = findInputField(frame);
  await touch(input.x, input.y);
  
  const verify = await getLatestFrame();      // <50ms
  if (hasError(verify)) break;
}
// Total: 200-500ms + 2s setup = 2.2-2.5s (10× faster)
```

---

## Configuration for Different Scenarios

### Scenario 1: Agent Loop (Continuous Decisions)
```javascript
// Setup
await startScrcpyStream();

// Loop with frequent checks
while (running) {
  const frame = await getLatestFrame();  // <50ms
  // ... decision logic ...
}
```
**Use:** Streaming mode
**Latency:** <50ms per frame
**Best for:** Real-time interaction

---

### Scenario 2: Periodic Monitoring
```javascript
// Check every N seconds
while (monitoring) {
  const frame = await captureFrameScrcpy();  // 100-300ms
  // ... analysis ...
  await sleep(5000);
}
```
**Use:** Single frame capture
**Latency:** 100-300ms per check
**Best for:** Status monitoring

---

### Scenario 3: Occasional Verification
```javascript
// One-off checks
const result = await screenshot();  // Falls back to ADB
```
**Use:** Either method
**Latency:** 100-300ms (scrcpy) or 500-1500ms (ADB)
**Best for:** Compatibility

---

## Memory & CPU Optimization

### Memory
- Only latest frame stored (not buffered history)
- H.264 stream: ~5-10MB/s at 5Mbps bitrate
- One frame: ~100KB
- Very efficient

### CPU
```javascript
// Reduce CPU usage
{
  '--max-fps=10',     // Instead of 30
  '--video-bit-rate=2M'  // Instead of 5M
}
```

### Network
- For remote devices, reduce bitrate:
```javascript
{
  '--video-bit-rate=2M'  // Lower bandwidth
}
```

---

## Error Handling

### Graceful Degradation
```javascript
async function getScreen() {
  try {
    return await getLatestFrame();  // Try streaming first
  } catch (err) {
    console.log("Streaming failed, using single capture");
    return await captureFrameScrcpy();
  }
}
```

### Connection Stability
```javascript
async function robustStreamingLoop() {
  await startScrcpyStream();
  
  let retries = 0;
  while (running && retries < 3) {
    try {
      const frame = await getLatestFrame();
      if (!frame) throw new Error("No frame");
      
      // Process frame
      await processFrame(frame);
      retries = 0;
    } catch (err) {
      retries++;
      if (retries >= 3) {
        // Restart stream
        await stopScrcpyStream();
        await startScrcpyStream();
        retries = 0;
      }
    }
  }
}
```

---

## Agent Integration Pattern

### Fast Decision Loop
```javascript
const agent = {
  async decide(screenshot) {
    // This is called ~10-20× per second with streaming
    // vs ~1 time per 1-2 seconds with ADB
    
    const state = this.analyzeScreen(screenshot);
    
    if (state.errorMessage) {
      return { action: 'cancel' };
    }
    
    if (state.inputField) {
      return { 
        action: 'fill',
        resourceId: state.inputField.id,
        text: this.getInputFor(state.fieldName)
      };
    }
    
    if (state.nextButton) {
      return { action: 'click', x: state.nextButton.x, y: state.nextButton.y };
    }
    
    return { action: 'wait' };
  }
};

// Main loop
await startScrcpyStream();

while (taskRunning) {
  const frame = await getLatestFrame();      // <50ms
  const decision = await agent.decide(frame);
  
  switch (decision.action) {
    case 'fill':
      await setTextByResourceId(decision.resourceId, decision.text);
      break;
    case 'click':
      await touch(decision.x, decision.y);
      break;
    case 'wait':
      await sleep(100);
      break;
    case 'cancel':
      taskRunning = false;
      break;
  }
}

await stopScrcpyStream();
```

---

## Benchmarking

### Test Your Setup
```javascript
async function benchmark() {
  const iterations = 100;
  
  // Test ADB screencap
  let adbTotal = 0;
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await screenshot();
    adbTotal += Date.now() - start;
  }
  console.log(`ADB avg: ${adbTotal / iterations}ms`);
  
  // Test scrcpy streaming
  await startScrcpyStream();
  
  let streamTotal = 0;
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await getLatestFrame();
    streamTotal += Date.now() - start;
  }
  await stopScrcpyStream();
  
  console.log(`Scrcpy avg: ${streamTotal / iterations}ms`);
  console.log(`Speedup: ${adbTotal / streamTotal}×`);
}
```

**Expected output:**
```
ADB avg: 750ms
Scrcpy avg: 45ms
Speedup: 16.7×
```

---

## Troubleshooting Performance Issues

### Frames Are Stale
- Problem: getLatestFrame returns outdated screen state
- Solution: Reduce `--max-fps` to 15 or lower
- Check device CPU load

### High Latency Despite Streaming
- Problem: getLatestFrame takes >100ms
- Solution: Check USB/network bandwidth
- Reduce `--video-bit-rate` for remote devices
- Reduce resolution if possible

### Stream Keeps Dropping
- Problem: Streaming stops after a few minutes
- Solution: Enable "Stay Awake" in developer settings
- Check ADB connection stability
- Reduce quality settings

### CPU Usage Too High
- Problem: Agent CPU maxed out
- Solution: Reduce FPS from 30 to 10-15
- Reduce frame rate of polling loop
- Disable stream when not actively needed

---

## Best Practices

1. **Start stream early**
   ```javascript
   app.onLoad(() => startScrcpyStream());
   ```

2. **Use streaming for loops, single-capture for monitors**
   ```javascript
   // Good
   while (automating) {
     const frame = await getLatestFrame();  // streaming
   }
   
   // Also good
   while (monitoring) {
     const frame = await captureFrameScrcpy();  // single
   }
   ```

3. **Stop stream when done**
   ```javascript
   app.onComplete(() => stopScrcpyStream());
   ```

4. **Handle edge cases**
   ```javascript
   if (!frame) {
     // Stream may have stopped, restart
     await stopScrcpyStream();
     await startScrcpyStream();
   }
   ```

5. **Tune for your needs**
   ```javascript
   // Adjust these based on benchmarks
   '--max-fps=30'              // Lower = less CPU
   '--video-bit-rate=5M'       // Lower = less bandwidth
   ```

---

## When NOT to Use Streaming

- One-off screenshot needed → Use `screenshot()`
- Network is unstable → Use single capture or ADB
- Memory constraints → Use single capture only
- Test needs PNG format → Use `captureFrameScrcpy()` (returns PNG)

---

## Conclusion

For **fastest agent decision-making**, use:

1. **Start** scrcpy streaming (~2s one-time)
2. **Poll** `getLatestFrame()` in decision loop (<50ms per)
3. **Stop** when task complete

**Result:** 10-30× faster screen analysis enabling real-time, responsive Android automation.

