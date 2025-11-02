import { execFile } from 'child_process';
import { promisify } from 'util';
import { access, readFile, mkdir, writeFile, chmod, rm } from 'fs/promises';
import { constants } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { join, dirname } from 'path';
import { platform, homedir, arch, tmpdir } from 'os';
import * as https from 'https';
import * as http from 'http';
import extract from 'extract-zip';

const execFileAsync = promisify(execFile);

export interface ADBOptions {
  adbPath?: string;
  deviceSerial?: string;
}

export class ADBWrapper {
  private adbPath: string;
  private adbInitialized: boolean = false;

  constructor(options: ADBOptions = {}) {
    this.adbPath = options.adbPath || process.env.ADB_PATH || 'adb';
  }

  /**
   * Get the download URL for ADB based on the current platform
   */
  private getADBDownloadUrl(): { url: string; filename: string } {
    const currentPlatform = platform();
    const currentArch = arch();
    
    // Latest platform-tools version
    const baseUrl = 'https://dl.google.com/android/repository';
    
    switch (currentPlatform) {
      case 'win32':
        return {
          url: `${baseUrl}/platform-tools-latest-windows.zip`,
          filename: 'platform-tools-windows.zip'
        };
      case 'darwin':
        return {
          url: `${baseUrl}/platform-tools-latest-darwin.zip`,
          filename: 'platform-tools-darwin.zip'
        };
      case 'linux':
        return {
          url: `${baseUrl}/platform-tools-latest-linux.zip`,
          filename: 'platform-tools-linux.zip'
        };
      default:
        throw new Error(`Unsupported platform: ${currentPlatform}`);
    }
  }

  /**
   * Get the local ADB directory path
   */
  private getADBDirectory(): string {
    const adbDir = join(homedir(), '.android-mcp-server', 'platform-tools');
    return adbDir;
  }

  /**
   * Get the expected ADB executable path
   */
  private getADBExecutablePath(): string {
    const adbDir = this.getADBDirectory();
    const currentPlatform = platform();
    
    if (currentPlatform === 'win32') {
      return join(adbDir, 'adb.exe');
    } else {
      return join(adbDir, 'adb');
    }
  }

  /**
   * Download a file from a URL
   */
  private async downloadFile(url: string, destination: string): Promise<void> {
    await mkdir(dirname(destination), { recursive: true });
    
    return new Promise((resolve, reject) => {
      const file = createWriteStream(destination);
      const client = url.startsWith('https') ? https : http;
      
      console.error(`Downloading ADB from ${url}...`);
      
      client.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          file.close();
          if (response.headers.location) {
            this.downloadFile(response.headers.location, destination)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error('Redirect without location header'));
          }
          return;
        }
        
        if (response.statusCode !== 200) {
          file.close();
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (err) => {
          file.close();
          rm(destination, { force: true }).catch(() => {});
          reject(err);
        });
      }).on('error', (err) => {
        file.close();
        rm(destination, { force: true }).catch(() => {});
        reject(err);
      });
    });
  }

  /**
   * Download and install ADB
   */
  private async downloadADB(): Promise<string> {
    const { url, filename } = this.getADBDownloadUrl();
    const adbDir = this.getADBDirectory();
    const downloadPath = join(adbDir, filename);
    
    try {
      // Download the ZIP file
      await this.downloadFile(url, downloadPath);
      
      console.error('Extracting ADB...');
      // Extract the ZIP file
      await extract(downloadPath, { dir: adbDir });
      
      // Clean up the ZIP file
      await rm(downloadPath, { force: true });
      
      const adbExecutable = this.getADBExecutablePath();
      
      // Make executable on Unix-like systems
      if (platform() !== 'win32') {
        await chmod(adbExecutable, 0o755);
      }
      
      console.error('ADB installed successfully!');
      return adbExecutable;
    } catch (error) {
      throw new Error(`Failed to download ADB: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if ADB is available and download if necessary
   */
  private async ensureADB(): Promise<void> {
    if (this.adbInitialized) {
      return;
    }

    try {
      // First, try the configured/system ADB
      await execFileAsync(this.adbPath, ['version']);
      this.adbInitialized = true;
      console.error(`Using ADB at: ${this.adbPath}`);
      return;
    } catch (error) {
      console.error('ADB not found in PATH, checking local installation...');
    }

    // Check if we have a local installation
    const localADBPath = this.getADBExecutablePath();
    try {
      await access(localADBPath, constants.X_OK);
      await execFileAsync(localADBPath, ['version']);
      this.adbPath = localADBPath;
      this.adbInitialized = true;
      console.error(`Using locally installed ADB at: ${localADBPath}`);
      return;
    } catch (error) {
      console.error('Local ADB installation not found, downloading...');
    }

    // Download and install ADB
    try {
      this.adbPath = await this.downloadADB();
      this.adbInitialized = true;
    } catch (error) {
      throw new Error(
        `ADB not found and automatic download failed: ${error instanceof Error ? error.message : String(error)}. ` +
        'Please install ADB manually from https://developer.android.com/tools/releases/platform-tools'
      );
    }
  }

  /**
   * Execute an ADB command
   */
  private async exec(
    args: string[],
    deviceSerial?: string
  ): Promise<{ stdout: string; stderr: string }> {
    // Ensure ADB is available before executing commands
    await this.ensureADB();
    
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
      const tempPath = join(tmpdir(), `screenshot_${Date.now()}.png`);
      await this.exec(['pull', devicePath, tempPath], device);
      await this.exec(['shell', 'rm', devicePath], device);

      const buffer = await readFile(tempPath);
      // Clean up temp file
      await rm(tempPath, { force: true });
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

  /**
   * Launch an app by package name
   */
  async launchApp(packageName: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    await this.exec(['shell', 'monkey', '-p', packageName, '-c', 'android.intent.category.LAUNCHER', '1'], device);
  }

  /**
   * Launch an app by activity name
   */
  async startActivity(activityName: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    await this.exec(['shell', 'am', 'start', '-n', activityName], device);
  }

  /**
   * Get list of installed packages
   */
  async listPackages(filter?: string, deviceSerial?: string): Promise<string[]> {
    const device = await this.getTargetDevice(deviceSerial);
    const { stdout } = await this.exec(['shell', 'pm', 'list', 'packages'], device);
    
    const packages = stdout
      .split('\n')
      .map(line => line.replace('package:', '').trim())
      .filter(pkg => pkg.length > 0);

    if (filter) {
      return packages.filter(pkg => pkg.toLowerCase().includes(filter.toLowerCase()));
    }

    return packages;
  }
}
