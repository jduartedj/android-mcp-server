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
 * Handle touch tool call
 */
export async function touchHandler(
  adb: ADBWrapper,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { x, y, duration = 100, deviceSerial } = args as TouchArgs;

  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('Invalid coordinates: x and y must be numbers');
  }

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
  const { startX, startY, endX, endY, duration = 300, deviceSerial } = args as SwipeArgs;

  if (
    typeof startX !== 'number' ||
    typeof startY !== 'number' ||
    typeof endX !== 'number' ||
    typeof endY !== 'number'
  ) {
    throw new Error('Invalid coordinates: all coordinates must be numbers');
  }

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
