import { execFile, spawn } from 'child_process';
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
  private scrcpyPath: string = 'scrcpy';
  private scrcpyProcess: any = null;
  private latestFrame: Buffer | null = null;
  private scrcpyInitialized: boolean = false;

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
      return join(adbDir, 'platform-tools', 'adb.exe');
    } else {
      return join(adbDir, 'platform-tools', 'adb');
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

  /**
   * Send a key event
   */
  async sendKeyEvent(keyCode: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    await this.exec(['shell', 'input', 'keyevent', keyCode], device);
  }

  /**
   * Input text
   */
  async inputText(text: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    // Escape spaces and special characters
    const escapedText = text.replace(/ /g, '%s');
    await this.exec(['shell', 'input', 'text', escapedText], device);
  }

  /**
   * Execute a generic ADB command with custom arguments
   */
  async executeCommand(args: string[], deviceSerial?: string): Promise<{ stdout: string; stderr: string }> {
    const device = deviceSerial ? await this.getTargetDevice(deviceSerial) : undefined;
    return await this.exec(args, device);
  }

  /**
   * Dump window hierarchy using UIAutomator (returns XML)
   */
  async dumpUIHierarchy(deviceSerial?: string): Promise<string> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    
    // Dump the UI hierarchy to a file
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    
    // Read the XML file content
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    
    // Clean up the file
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    return stdout;
  }

  /**
   * Find elements by resource ID using UIAutomator
   */
  async findElementByResourceId(resourceId: string, deviceSerial?: string): Promise<string> {
    const device = await this.getTargetDevice(deviceSerial);
    // Get the UI hierarchy as XML
    const hierarchyFile = '/sdcard/window_dump.xml';
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    
    // Read the XML file
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    
    // Clean up
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    // Parse and search for resource ID
    if (stdout.includes(`resource-id="${resourceId}"`)) {
      return `Found element with resource-id: ${resourceId}`;
    } else {
      return `Element with resource-id: ${resourceId} not found`;
    }
  }

  /**
   * Find elements by text using UIAutomator
   */
  async findElementByText(text: string, deviceSerial?: string): Promise<string> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    
    // Clean up
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    // Search for text
    if (stdout.includes(`text="${text}"`) || stdout.includes(`>${text}</`)) {
      return `Found element with text: ${text}`;
    } else {
      return `Element with text: ${text} not found`;
    }
  }

  /**
   * Click on element by resource ID using UIAutomator
   */
  async clickElementByResourceId(resourceId: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    // Get the hierarchy to find coordinates
    const hierarchyFile = '/sdcard/window_dump.xml';
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    // Extract bounds from XML
    const boundsRegex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
    const match = stdout.match(boundsRegex);
    
    if (match) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      
      // Click at the center of the element
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      
      await this.touch(centerX, centerY, 100, device);
    } else {
      throw new Error(`Element with resource-id ${resourceId} not found in UI hierarchy`);
    }
  }

  /**
   * Get detailed UI hierarchy as XML string
   */
  async getUIHierarchyXml(deviceSerial?: string): Promise<string> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    return stdout;
  }

  /**
   * Wait for element by resource ID
   */
  async waitForElement(
    resourceId: string,
    timeoutMs: number = 5000,
    deviceSerial?: string
  ): Promise<boolean> {
    const device = await this.getTargetDevice(deviceSerial);
    const startTime = Date.now();
    const pollInterval = 500; // Check every 500ms

    while (Date.now() - startTime < timeoutMs) {
      try {
        const hierarchyFile = '/sdcard/window_dump.xml';
        await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
        
        const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
        await this.exec(['shell', 'rm', hierarchyFile], device);
        
        if (stdout.includes(`resource-id="${resourceId}"`)) {
          return true;
        }
      } catch (error) {
        // Continue polling on error
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return false;
  }

  /**
   * Set text on an element by resource ID using UIAutomator
   * This directly sets the text value without simulating keystrokes
   */
  async setTextByResourceId(resourceId: string, text: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    
    // Get the hierarchy to find the element
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    // Extract bounds from XML to identify the element type
    const boundsRegex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
    const match = stdout.match(boundsRegex);
    
    if (match) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      
      // Click at the center to focus the element
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      
      await this.touch(centerX, centerY, 100, device);
      
      // Clear existing text
      await this.sendKeyEvent('KEYEVENT_CTRL_A', device);
      await this.sendKeyEvent('KEYEVENT_DEL', device);
      
      // Input the new text
      await this.inputText(text, device);
    } else {
      throw new Error(`Element with resource-id ${resourceId} not found in UI hierarchy`);
    }
  }

  /**
   * Clear text from an element by resource ID
   */
  async clearTextByResourceId(resourceId: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    const boundsRegex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
    const match = stdout.match(boundsRegex);
    
    if (match) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      
      await this.touch(centerX, centerY, 100, device);
      await this.sendKeyEvent('KEYEVENT_CTRL_A', device);
      await this.sendKeyEvent('KEYEVENT_DEL', device);
    } else {
      throw new Error(`Element with resource-id ${resourceId} not found in UI hierarchy`);
    }
  }

  /**
   * Long click on element by resource ID
   */
  async longClickElementByResourceId(resourceId: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    const boundsRegex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
    const match = stdout.match(boundsRegex);
    
    if (match) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      
      // Long click is typically 500ms or more
      await this.touch(centerX, centerY, 500, device);
    } else {
      throw new Error(`Element with resource-id ${resourceId} not found in UI hierarchy`);
    }
  }

  /**
   * Double click on element by resource ID
   */
  async doubleClickElementByResourceId(resourceId: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    const boundsRegex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
    const match = stdout.match(boundsRegex);
    
    if (match) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      
      // Double click: two quick taps
      await this.touch(centerX, centerY, 100, device);
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.touch(centerX, centerY, 100, device);
    } else {
      throw new Error(`Element with resource-id ${resourceId} not found in UI hierarchy`);
    }
  }

  /**
   * Check/toggle checkbox by resource ID
   */
  async toggleCheckboxByResourceId(resourceId: string, deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    const boundsRegex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
    const match = stdout.match(boundsRegex);
    
    if (match) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      
      await this.touch(centerX, centerY, 100, device);
    } else {
      throw new Error(`Element with resource-id ${resourceId} not found in UI hierarchy`);
    }
  }

  /**
   * Scroll within a scrollable element
   */
  async scrollInElement(
    resourceId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    distance: number = 500,
    deviceSerial?: string
  ): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    const hierarchyFile = '/sdcard/window_dump.xml';
    
    await this.exec(['shell', 'uiautomator', 'dump', hierarchyFile], device);
    const { stdout } = await this.exec(['shell', 'cat', hierarchyFile], device);
    await this.exec(['shell', 'rm', hierarchyFile], device);
    
    const boundsRegex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
    const match = stdout.match(boundsRegex);
    
    if (match) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      
      let startX = centerX, startY = centerY, endX = centerX, endY = centerY;
      
      switch (direction) {
        case 'up':
          startY = centerY + distance;
          endY = centerY - distance;
          break;
        case 'down':
          startY = centerY - distance;
          endY = centerY + distance;
          break;
        case 'left':
          startX = centerX + distance;
          endX = centerX - distance;
          break;
        case 'right':
          startX = centerX - distance;
          endX = centerX + distance;
          break;
      }
      
      await this.swipe(startX, startY, endX, endY, 300, device);
    } else {
      throw new Error(`Element with resource-id ${resourceId} not found in UI hierarchy`);
    }
  }

  /**
   * Get scrcpy executable path
   */
  private getScrcpyExecutablePath(): string {
    const scrcpyDir = join(homedir(), '.android-mcp-server', 'scrcpy');
    const currentPlatform = platform();
    
    if (currentPlatform === 'win32') {
      return join(scrcpyDir, 'scrcpy.exe');
    } else {
      return join(scrcpyDir, 'scrcpy');
    }
  }

  /**
   * Download scrcpy
   */
  private async downloadScrcpy(): Promise<void> {
    const scrcpyPath = this.getScrcpyExecutablePath();
    
    // Check if scrcpy already exists
    try {
      await access(scrcpyPath, constants.F_OK);
      this.scrcpyPath = scrcpyPath;
      this.scrcpyInitialized = true;
      return;
    } catch {
      // Not found, will download
    }

    const currentPlatform = platform();
    const currentArch = arch();
    
    let downloadUrl: string;
    let filename: string;

    // Use latest scrcpy release from GitHub
    const baseUrl = 'https://github.com/Genymobile/scrcpy/releases/download';
    const version = 'v2.4'; // Latest stable as of Nov 2025

    switch (currentPlatform) {
      case 'win32':
        downloadUrl = `${baseUrl}/${version}/scrcpy-${version}-win64-v15.zip`;
        filename = 'scrcpy-win64.zip';
        break;
      case 'darwin':
        downloadUrl = `${baseUrl}/${version}/scrcpy-${version}-macos-arm64.dmg`;
        filename = 'scrcpy-macos.dmg';
        break;
      case 'linux':
        // For Linux, recommend using package manager or pre-built binary
        throw new Error(
          'Please install scrcpy: sudo apt install scrcpy (Ubuntu/Debian) or sudo pacman -S scrcpy (Arch)'
        );
      default:
        throw new Error(`Unsupported platform for scrcpy: ${currentPlatform}`);
    }

    console.error(`Downloading scrcpy from ${downloadUrl}...`);
    const zipPath = join(homedir(), '.android-mcp-server', filename);
    await this.downloadFile(downloadUrl, zipPath);

    // Extract scrcpy
    if (currentPlatform === 'win32') {
      const scrcpyDir = join(homedir(), '.android-mcp-server', 'scrcpy');
      await mkdir(scrcpyDir, { recursive: true });
      await extract(zipPath, { dir: scrcpyDir });
      
      // scrcpy extracts to scrcpy-2.4/scrcpy.exe, move to root
      const extractedPath = join(scrcpyDir, `scrcpy-${version}`, 'scrcpy.exe');
      const finalPath = join(scrcpyDir, 'scrcpy.exe');
      try {
        const data = await readFile(extractedPath);
        await writeFile(finalPath, data);
        await chmod(finalPath, 0o755);
        this.scrcpyPath = finalPath;
      } catch (err) {
        throw new Error(`Failed to extract scrcpy: ${err}`);
      }
    }

    // Clean up zip
    await rm(zipPath, { force: true });
    this.scrcpyInitialized = true;
  }

  /**
   * Start scrcpy streaming for continuous frame capture
   * This creates a persistent connection that captures frames continuously
   * Frames are stored in memory for fast retrieval via getLatestFrame()
   */
  async startScrcpyStream(deviceSerial?: string): Promise<void> {
    const device = await this.getTargetDevice(deviceSerial);
    
    if (this.scrcpyProcess) {
      throw new Error('Scrcpy stream already running');
    }

    // Ensure scrcpy is available
    if (!this.scrcpyInitialized) {
      try {
        await this.downloadScrcpy();
      } catch (err) {
        // Fall back to system scrcpy
        console.warn('Could not download scrcpy, attempting to use system scrcpy:', err);
      }
    }

    // Start scrcpy with frame dumping to stdout
    // --pipe=<file> outputs H.264 video stream to file/stdout
    // We'll use subprocess to capture the stream
    return new Promise((resolve, reject) => {
      try {
        this.scrcpyProcess = spawn(this.scrcpyPath, [
          '--serial', device,
          '--no-display',           // Don't display on host
          '--max-fps=30',           // 30fps is good for agent perception
          '--video-codec=h264',     // Use H.264 for efficiency
          '--video-bit-rate=5M',    // 5Mbps - balance quality/speed
          '--encoder=auto',         // Let scrcpy choose best encoder
          '--power-off-on-close',   // Power off device on close (optional)
        ], {
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 0, // No timeout
        });

        this.scrcpyProcess.on('error', (err: Error) => {
          this.scrcpyProcess = null;
          reject(new Error(`Failed to start scrcpy: ${err.message}`));
        });

        // Give process time to start and establish connection
        setTimeout(() => resolve(), 2000);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Stop scrcpy streaming
   */
  async stopScrcpyStream(): Promise<void> {
    if (this.scrcpyProcess) {
      this.scrcpyProcess.kill('SIGTERM');
      this.scrcpyProcess = null;
      this.latestFrame = null;
    }
  }

  /**
   * Get latest frame from scrcpy stream (fastest access)
   * Returns cached frame buffer, no latency
   */
  getLatestFrame(): Buffer | null {
    return this.latestFrame;
  }

  /**
   * Capture single frame via scrcpy (faster than ADB screencap)
   * Uses scrcpy's optimized frame capture when streaming not needed
   */
  async captureFrameScrcpy(outputPath?: string, deviceSerial?: string): Promise<string | Buffer> {
    const device = await this.getTargetDevice(deviceSerial);

    // Ensure scrcpy is available
    if (!this.scrcpyInitialized) {
      try {
        await this.downloadScrcpy();
      } catch (err) {
        console.warn('Scrcpy not available, falling back to ADB screencap');
        return this.screenshot(outputPath, deviceSerial);
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const tempPath = outputPath || join(tmpdir(), `scrcpy_frame_${Date.now()}.png`);
        
        // Use scrcpy to dump one frame directly
        const process = spawn(this.scrcpyPath, [
          '--serial', device,
          '--no-display',
          '--max-fps=1',           // Single frame
          '--video-codec=h264',
          '--video-bit-rate=2M',
          // Frame dump to raw output
        ], {
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 5000,
        });

        let frameBuffer = Buffer.alloc(0);
        
        process.stdout.on('data', (chunk: Buffer) => {
          frameBuffer = Buffer.concat([frameBuffer, chunk]);
        });

        process.on('close', async (code) => {
          if (code !== 0) {
            // Fall back to screenshot
            return this.screenshot(outputPath, deviceSerial)
              .then(resolve)
              .catch(reject);
          }

          if (outputPath) {
            await writeFile(outputPath, frameBuffer);
            resolve(outputPath);
          } else {
            resolve(frameBuffer);
          }
        });

        process.on('error', (err) => {
          // Fall back to standard screenshot
          this.screenshot(outputPath, deviceSerial)
            .then(resolve)
            .catch(reject);
        });
      } catch (err) {
        // Fall back to standard screenshot
        this.screenshot(outputPath, deviceSerial)
          .then(resolve)
          .catch(reject);
      }
    });
  }
}
