import { execFile } from 'child_process';
import { promisify } from 'util';
import { access, readFile } from 'fs/promises';
import { constants } from 'fs';

const execFileAsync = promisify(execFile);

export interface ADBOptions {
  adbPath?: string;
  deviceSerial?: string;
}

export class ADBWrapper {
  private adbPath: string;

  constructor(options: ADBOptions = {}) {
    this.adbPath = options.adbPath || process.env.ADB_PATH || 'adb';
  }

  /**
   * Execute an ADB command
   */
  private async exec(
    args: string[],
    deviceSerial?: string
  ): Promise<{ stdout: string; stderr: string }> {
    const commandArgs = deviceSerial ? ['-s', deviceSerial, ...args] : args;

    try {
      const { stdout, stderr } = await execFileAsync(this.adbPath, commandArgs);
      return { stdout, stderr };
    } catch (error: any) {
      throw new Error(`ADB command failed: ${error.message}`);
    }
  }

  /**
   * Get list of connected devices
   */
  async getDevices(): Promise<string[]> {
    const { stdout } = await this.exec(['devices']);
    const lines = stdout.split('\n').slice(1); // Skip header
    return lines
      .map((line) => line.trim())
      .filter((line) => line && line.includes('\t'))
      .map((line) => line.split('\t')[0]);
  }

  /**
   * Get the first available device or specified device
   */
  private async getTargetDevice(deviceSerial?: string): Promise<string> {
    if (deviceSerial) {
      return deviceSerial;
    }

    const devices = await this.getDevices();
    if (devices.length === 0) {
      throw new Error('No Android devices found. Please connect a device or start an emulator.');
    }

    return devices[0];
  }

  /**
   * Capture screenshot and save to device
   */
  async screenshot(outputPath?: string, deviceSerial?: string): Promise<string | Buffer> {
    const device = await this.getTargetDevice(deviceSerial);
    const devicePath = '/sdcard/screenshot.png';

    // Take screenshot on device
    await this.exec(['shell', 'screencap', '-p', devicePath], device);

    if (outputPath) {
      // Pull screenshot to local path
      await this.exec(['pull', devicePath, outputPath], device);
      // Clean up device screenshot
      await this.exec(['shell', 'rm', devicePath], device);
      return outputPath;
    } else {
      // Pull screenshot to temp and read as buffer
      const tempPath = `/tmp/screenshot_${Date.now()}.png`;
      await this.exec(['pull', devicePath, tempPath], device);
      await this.exec(['shell', 'rm', devicePath], device);

      const buffer = await readFile(tempPath);
      return buffer;
    }
  }

  /**
   * Simulate touch event
   */
  async touch(
    x: number,
    y: number,
    duration: number = 100,
    deviceSerial?: string
  ): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);

    if (duration <= 100) {
      // Simple tap
      await this.exec(['shell', 'input', 'tap', String(x), String(y)], device);
    } else {
      // Long press using swipe with same start/end coordinates
      await this.exec(
        ['shell', 'input', 'swipe', String(x), String(y), String(x), String(y), String(duration)],
        device
      );
    }
  }

  /**
   * Perform swipe gesture
   */
  async swipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number = 300,
    deviceSerial?: string
  ): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);

    await this.exec(
      [
        'shell',
        'input',
        'swipe',
        String(startX),
        String(startY),
        String(endX),
        String(endY),
        String(duration),
      ],
      device
    );
  }

  /**
   * Get screen resolution
   */
  async getScreenSize(deviceSerial?: string): Promise<{ width: number; height: number }> {
    const device = await this.getTargetDevice(deviceSerial);
    const { stdout } = await this.exec(['shell', 'wm', 'size'], device);

    // Parse output like "Physical size: 1080x2400"
    const match = stdout.match(/(\d+)x(\d+)/);
    if (!match) {
      throw new Error('Failed to parse screen size');
    }

    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
}
