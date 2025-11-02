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
