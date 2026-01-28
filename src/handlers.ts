import { ADBWrapper } from './adb-wrapper.js';

interface ScreenshotArgs {
  outputPath?: string;
  deviceSerial?: string;
}

interface TouchArgs {
  x: number;
  y: number;
  duration?: number;
  deviceSerial?: string;
}

interface SwipeArgs {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration?: number;
  deviceSerial?: string;
}

interface LaunchAppArgs {
  packageName: string;
  deviceSerial?: string;
}

interface ListPackagesArgs {
  filter?: string;
  deviceSerial?: string;
}

interface UIAutomatorDumpArgs {
  deviceSerial?: string;
}

interface UIAutomatorFindArgs {
  resourceId?: string;
  text?: string;
  deviceSerial?: string;
}

interface UIAutomatorClickArgs {
  resourceId: string;
  deviceSerial?: string;
}

interface UIAutomatorWaitArgs {
  resourceId: string;
  timeoutMs?: number;
  deviceSerial?: string;
}

interface UIAutomatorSetTextArgs {
  resourceId: string;
  text: string;
  deviceSerial?: string;
}

interface UIAutomatorClearTextArgs {
  resourceId: string;
  deviceSerial?: string;
}

interface UIAutomatorLongClickArgs {
  resourceId: string;
  deviceSerial?: string;
}

interface UIAutomatorDoubleClickArgs {
  resourceId: string;
  deviceSerial?: string;
}

interface UIAutomatorToggleCheckboxArgs {
  resourceId: string;
  deviceSerial?: string;
}

interface UIAutomatorScrollInElementArgs {
  resourceId: string;
  direction: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  deviceSerial?: string;
}

/**
 * Handle screenshot tool call
 */
export async function screenshotHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text?: string; data?: string; mimeType?: string }> }> {
  const { outputPath, deviceSerial } = args as ScreenshotArgs;

  try {
    const result = await adb.screenshot(outputPath, deviceSerial);

    if (typeof result === 'string') {
      // Path returned
      return {
        content: [
          {
            type: 'text',
            text: `Screenshot saved to: ${result}`,
          },
        ],
      };
    } else {
      // Buffer returned - encode as base64
      const base64 = result.toString('base64');
      return {
        content: [
          {
            type: 'text',
            text: 'Screenshot captured successfully',
          },
          {
            type: 'image',
            data: base64,
            mimeType: 'image/png',
          },
        ],
      };
    }
  } catch (error) {
    throw new Error(`Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to ensure a value is a number (handles string-to-number conversion)
 */
function toNumber(value: any, name: string): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  throw new Error(`Invalid ${name}: must be a number, got ${typeof value}`);
}

/**
 * Handle touch tool call
 */
export async function touchHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { deviceSerial } = args as TouchArgs;
  
  // Robust number conversion (handles string coordinates from some MCP clients)
  const x = toNumber(args.x, 'x coordinate');
  const y = toNumber(args.y, 'y coordinate');
  const duration = args.duration !== undefined ? toNumber(args.duration, 'duration') : 100;

  if (x < 0 || y < 0) {
    throw new Error('Invalid coordinates: x and y must be positive');
  }

  try {
    await adb.touch(x, y, duration, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Touch executed at (${x}, ${y}) with duration ${duration}ms`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Touch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle swipe tool call
 */
export async function swipeHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { deviceSerial } = args as SwipeArgs;

  // Robust number conversion (handles string coordinates from some MCP clients)
  const startX = toNumber(args.startX, 'startX coordinate');
  const startY = toNumber(args.startY, 'startY coordinate');
  const endX = toNumber(args.endX, 'endX coordinate');
  const endY = toNumber(args.endY, 'endY coordinate');
  const duration = args.duration !== undefined ? toNumber(args.duration, 'duration') : 300;

  if (startX < 0 || startY < 0 || endX < 0 || endY < 0) {
    throw new Error('Invalid coordinates: all coordinates must be positive');
  }

  try {
    await adb.swipe(startX, startY, endX, endY, duration, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Swipe executed from (${startX}, ${startY}) to (${endX}, ${endY}) over ${duration}ms`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Swipe failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle launch app tool call
 */
export async function launchAppHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { packageName, deviceSerial } = args as LaunchAppArgs;

  if (!packageName || typeof packageName !== 'string') {
    throw new Error('Invalid package name: packageName must be a non-empty string');
  }

  try {
    await adb.launchApp(packageName, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully launched app: ${packageName}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Launch app failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle list packages tool call
 */
export async function listPackagesHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { filter, deviceSerial } = args as ListPackagesArgs;

  try {
    const packages = await adb.listPackages(filter, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${packages.length} packages${filter ? ` matching "${filter}"` : ''}:\n${packages.join('\n')}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`List packages failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator dump tool call
 */
export async function uiautomatorDumpHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { deviceSerial } = args as UIAutomatorDumpArgs;

  try {
    const xml = await adb.getUIHierarchyXml(deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: xml,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator dump failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator find element tool call
 */
export async function uiautomatorFindHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, text, deviceSerial } = args as UIAutomatorFindArgs;

  if (!resourceId && !text) {
    throw new Error('Either resourceId or text must be provided');
  }

  try {
    let result: string;
    if (resourceId) {
      result = await adb.findElementByResourceId(resourceId, deviceSerial);
    } else {
      result = await adb.findElementByText(text!, deviceSerial);
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator find failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator click element tool call
 */
export async function uiautomatorClickHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, deviceSerial } = args as UIAutomatorClickArgs;

  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid resource ID: resourceId must be a non-empty string');
  }

  try {
    await adb.clickElementByResourceId(resourceId, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully clicked element with resource-id: ${resourceId}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator click failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator wait for element tool call
 */
export async function uiautomatorWaitHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, timeoutMs = 5000, deviceSerial } = args as UIAutomatorWaitArgs;

  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid resource ID: resourceId must be a non-empty string');
  }

  try {
    const found = await adb.waitForElement(resourceId, timeoutMs, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: found
            ? `Element with resource-id "${resourceId}" found within ${timeoutMs}ms`
            : `Element with resource-id "${resourceId}" not found after ${timeoutMs}ms`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator wait failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator set text tool call
 */
export async function uiautomatorSetTextHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, text, deviceSerial } = args as UIAutomatorSetTextArgs;

  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid resource ID: resourceId must be a non-empty string');
  }

  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text: text must be a non-empty string');
  }

  try {
    await adb.setTextByResourceId(resourceId, text, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully set text on element with resource-id: ${resourceId}\nText: "${text}"`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator set text failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator clear text tool call
 */
export async function uiautomatorClearTextHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, deviceSerial } = args as UIAutomatorClearTextArgs;

  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid resource ID: resourceId must be a non-empty string');
  }

  try {
    await adb.clearTextByResourceId(resourceId, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully cleared text on element with resource-id: ${resourceId}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator clear text failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator long click tool call
 */
export async function uiautomatorLongClickHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, deviceSerial } = args as UIAutomatorLongClickArgs;

  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid resource ID: resourceId must be a non-empty string');
  }

  try {
    await adb.longClickElementByResourceId(resourceId, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully long-clicked element with resource-id: ${resourceId}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator long click failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator double click tool call
 */
export async function uiautomatorDoubleClickHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, deviceSerial } = args as UIAutomatorDoubleClickArgs;

  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid resource ID: resourceId must be a non-empty string');
  }

  try {
    await adb.doubleClickElementByResourceId(resourceId, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully double-clicked element with resource-id: ${resourceId}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator double click failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator toggle checkbox tool call
 */
export async function uiautomatorToggleCheckboxHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, deviceSerial } = args as UIAutomatorToggleCheckboxArgs;

  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid resource ID: resourceId must be a non-empty string');
  }

  try {
    await adb.toggleCheckboxByResourceId(resourceId, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully toggled checkbox with resource-id: ${resourceId}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator toggle checkbox failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle UIAutomator scroll in element tool call
 */
export async function uiautomatorScrollInElementHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { resourceId, direction, distance = 500, deviceSerial } = args as UIAutomatorScrollInElementArgs;

  if (!resourceId || typeof resourceId !== 'string') {
    throw new Error('Invalid resource ID: resourceId must be a non-empty string');
  }

  if (!direction || !['up', 'down', 'left', 'right'].includes(direction)) {
    throw new Error('Invalid direction: must be one of "up", "down", "left", "right"');
  }

  try {
    await adb.scrollInElement(resourceId, direction, distance, deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully scrolled ${direction} in element with resource-id: ${resourceId}\nDistance: ${distance}px`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`UIAutomator scroll in element failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface StartScrcpyStreamArgs {
  deviceSerial?: string;
}

export async function handleStartScrcpyStream(adb: ADBWrapper, args: StartScrcpyStreamArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { deviceSerial } = args;

  try {
    await adb.startScrcpyStream(deviceSerial);

    return {
      content: [
        {
          type: 'text',
          text: 'Scrcpy streaming started successfully. Use getLatestFrame to retrieve frames.',
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to start scrcpy stream: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface StopScrcpyStreamArgs {
  deviceSerial?: string;
}

export async function handleStopScrcpyStream(adb: ADBWrapper, args: StopScrcpyStreamArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    await adb.stopScrcpyStream();

    return {
      content: [
        {
          type: 'text',
          text: 'Scrcpy stream stopped successfully.',
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to stop scrcpy stream: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface GetLatestFrameArgs {
  // No arguments needed
}

export async function handleGetLatestFrame(adb: ADBWrapper, args: GetLatestFrameArgs): Promise<{ content: Array<{ type: string; text?: string; data?: string; mimeType?: string }> }> {
  try {
    const frame = adb.getLatestFrame();

    if (!frame) {
      return {
        content: [
          {
            type: 'text',
            text: 'No frame available. Start streaming first with startScrcpyStream.',
          },
        ],
      };
    }

    // Return frame as base64-encoded image
    return {
      content: [
        {
          type: 'image',
          data: frame.toString('base64'),
          mimeType: 'image/h264',
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to get latest frame: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface CaptureFrameScrcpyArgs {
  outputPath?: string;
  deviceSerial?: string;
}

export async function handleCaptureFrameScrcpy(adb: ADBWrapper, args: CaptureFrameScrcpyArgs): Promise<{ content: Array<{ type: string; text?: string; data?: string; mimeType?: string }> }> {
  const { outputPath, deviceSerial } = args;

  try {
    const result = await adb.captureFrameScrcpy(outputPath, deviceSerial);

    if (typeof result === 'string') {
      return {
        content: [
          {
            type: 'text',
            text: `Frame saved to: ${result}`,
          },
        ],
      };
    } else {
      // Return as base64-encoded image
      return {
        content: [
          {
            type: 'image',
            data: result.toString('base64'),
            mimeType: 'image/png',
          },
        ],
      };
    }
  } catch (error) {
    throw new Error(`Failed to capture frame with scrcpy: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface SendKeyEventArgs {
  keyCode: string;
  deviceSerial?: string;
}

export async function handleSendKeyEvent(adb: ADBWrapper, args: SendKeyEventArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { keyCode, deviceSerial } = args;

  try {
    await adb.sendKeyEvent(keyCode, deviceSerial);
    return {
      content: [
        {
          type: 'text',
          text: `Key event sent: ${keyCode}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to send key event: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface InputTextArgs {
  text: string;
  deviceSerial?: string;
}

export async function handleInputText(adb: ADBWrapper, args: InputTextArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { text, deviceSerial } = args;

  try {
    await adb.inputText(text, deviceSerial);
    return {
      content: [
        {
          type: 'text',
          text: `Text input sent: "${text}"`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to input text: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface ExecuteCommandArgs {
  args: string[];
  deviceSerial?: string;
}

export async function handleExecuteCommand(adb: ADBWrapper, args: ExecuteCommandArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { args: adbArgs, deviceSerial } = args;

  if (!adbArgs || !Array.isArray(adbArgs) || adbArgs.length === 0) {
    throw new Error('args parameter is required and must be a non-empty array');
  }

  try {
    const { stdout, stderr } = await adb.executeCommand(adbArgs, deviceSerial);
    
    let output = '';
    if (stdout) output += `stdout:\n${stdout}`;
    if (stderr) output += `${output ? '\n\n' : ''}stderr:\n${stderr}`;
    
    return {
      content: [
        {
          type: 'text',
          text: output || 'Command executed successfully (no output)',
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to execute ADB command: ${error instanceof Error ? error.message : String(error)}`);
  }
}
