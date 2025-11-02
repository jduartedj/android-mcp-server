#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ADBWrapper } from './adb-wrapper.js';
import { screenshotHandler, touchHandler, swipeHandler, launchAppHandler, listPackagesHandler, uiautomatorDumpHandler, uiautomatorFindHandler, uiautomatorClickHandler, uiautomatorWaitHandler, uiautomatorSetTextHandler, uiautomatorClearTextHandler, uiautomatorLongClickHandler, uiautomatorDoubleClickHandler, uiautomatorToggleCheckboxHandler, uiautomatorScrollInElementHandler, handleStartScrcpyStream, handleStopScrcpyStream, handleGetLatestFrame, handleCaptureFrameScrcpy } from './handlers.js';

const SERVER_NAME = 'android-mcp-server';
const SERVER_VERSION = '0.1.0';

class AndroidMCPServer {
  private server: Server;
  private adb: ADBWrapper;

  constructor() {
    this.adb = new ADBWrapper();
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'android_screenshot',
          description: 'Capture a screenshot from the Android device',
          inputSchema: {
            type: 'object',
            properties: {
              outputPath: {
                type: 'string',
                description: 'Local path to save the screenshot (optional). If not provided, returns base64 encoded image.',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
          },
        },
        {
          name: 'android_touch',
          description: 'Simulate a touch event at specific screen coordinates',
          inputSchema: {
            type: 'object',
            properties: {
              x: {
                type: 'number',
                description: 'X coordinate',
              },
              y: {
                type: 'number',
                description: 'Y coordinate',
              },
              duration: {
                type: 'number',
                description: 'Touch duration in milliseconds (default: 100)',
                default: 100,
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['x', 'y'],
          },
        },
        {
          name: 'android_swipe',
          description: 'Perform a swipe gesture between two coordinates',
          inputSchema: {
            type: 'object',
            properties: {
              startX: {
                type: 'number',
                description: 'Starting X coordinate',
              },
              startY: {
                type: 'number',
                description: 'Starting Y coordinate',
              },
              endX: {
                type: 'number',
                description: 'Ending X coordinate',
              },
              endY: {
                type: 'number',
                description: 'Ending Y coordinate',
              },
              duration: {
                type: 'number',
                description: 'Swipe duration in milliseconds (default: 300)',
                default: 300,
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['startX', 'startY', 'endX', 'endY'],
          },
        },
        {
          name: 'android_launch_app',
          description: 'Launch an Android app by package name',
          inputSchema: {
            type: 'object',
            properties: {
              packageName: {
                type: 'string',
                description: 'Package name of the app to launch (e.g., com.example.app)',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['packageName'],
          },
        },
        {
          name: 'android_list_packages',
          description: 'List installed packages on the Android device',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'string',
                description: 'Optional filter to search for specific packages (case-insensitive)',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
          },
        },
        {
          name: 'android_uiautomator_dump',
          description: 'Dump the UI hierarchy using UIAutomator and return as XML',
          inputSchema: {
            type: 'object',
            properties: {
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
          },
        },
        {
          name: 'android_uiautomator_find',
          description: 'Find UI elements by resource ID or text using UIAutomator',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID to search for (e.g., com.example.app:id/button_submit)',
              },
              text: {
                type: 'string',
                description: 'Text content to search for',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
          },
        },
        {
          name: 'android_uiautomator_click',
          description: 'Click on a UI element by resource ID using UIAutomator',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID of the element to click (e.g., com.example.app:id/button_submit)',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['resourceId'],
          },
        },
        {
          name: 'android_uiautomator_wait',
          description: 'Wait for a UI element to appear by resource ID',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID of the element to wait for',
              },
              timeoutMs: {
                type: 'number',
                description: 'Maximum time to wait in milliseconds (default: 5000)',
                default: 5000,
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['resourceId'],
          },
        },
        {
          name: 'android_uiautomator_set_text',
          description: 'Set text on a UI element by resource ID using UIAutomator',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID of the element (e.g., com.example.app:id/text_input)',
              },
              text: {
                type: 'string',
                description: 'Text to set in the element',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['resourceId', 'text'],
          },
        },
        {
          name: 'android_uiautomator_clear_text',
          description: 'Clear text from a UI element by resource ID',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID of the element to clear',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['resourceId'],
          },
        },
        {
          name: 'android_uiautomator_long_click',
          description: 'Perform a long click on a UI element by resource ID',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID of the element to long click',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['resourceId'],
          },
        },
        {
          name: 'android_uiautomator_double_click',
          description: 'Perform a double click on a UI element by resource ID',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID of the element to double click',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['resourceId'],
          },
        },
        {
          name: 'android_uiautomator_toggle_checkbox',
          description: 'Toggle a checkbox element by resource ID',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID of the checkbox element',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['resourceId'],
          },
        },
        {
          name: 'android_uiautomator_scroll_in_element',
          description: 'Scroll within a specific UI element',
          inputSchema: {
            type: 'object',
            properties: {
              resourceId: {
                type: 'string',
                description: 'Resource ID of the scrollable element',
              },
              direction: {
                type: 'string',
                enum: ['up', 'down', 'left', 'right'],
                description: 'Direction to scroll',
              },
              distance: {
                type: 'number',
                description: 'Distance to scroll in pixels (default: 500)',
                default: 500,
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
            required: ['resourceId', 'direction'],
          },
        },
        {
          name: 'android_start_scrcpy_stream',
          description: 'Start scrcpy streaming for continuous fast frame capture (requires scrcpy installed)',
          inputSchema: {
            type: 'object',
            properties: {
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
          },
        },
        {
          name: 'android_stop_scrcpy_stream',
          description: 'Stop scrcpy streaming',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'android_get_latest_frame',
          description: 'Get the latest frame from scrcpy stream (instant access, no latency)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'android_capture_frame_scrcpy',
          description: 'Capture a single frame via scrcpy (faster than ADB screencap)',
          inputSchema: {
            type: 'object',
            properties: {
              outputPath: {
                type: 'string',
                description: 'Local path to save the frame (optional). If not provided, returns base64 encoded image.',
              },
              deviceSerial: {
                type: 'string',
                description: 'Specific device serial number to target (optional)',
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'android_screenshot':
            return await screenshotHandler(this.adb, args);
          case 'android_touch':
            return await touchHandler(this.adb, args);
          case 'android_swipe':
            return await swipeHandler(this.adb, args);
          case 'android_launch_app':
            return await launchAppHandler(this.adb, args);
          case 'android_list_packages':
            return await listPackagesHandler(this.adb, args);
          case 'android_uiautomator_dump':
            return await uiautomatorDumpHandler(this.adb, args);
          case 'android_uiautomator_find':
            return await uiautomatorFindHandler(this.adb, args);
          case 'android_uiautomator_click':
            return await uiautomatorClickHandler(this.adb, args);
          case 'android_uiautomator_wait':
            return await uiautomatorWaitHandler(this.adb, args);
          case 'android_uiautomator_set_text':
            return await uiautomatorSetTextHandler(this.adb, args);
          case 'android_uiautomator_clear_text':
            return await uiautomatorClearTextHandler(this.adb, args);
          case 'android_uiautomator_long_click':
            return await uiautomatorLongClickHandler(this.adb, args);
          case 'android_uiautomator_double_click':
            return await uiautomatorDoubleClickHandler(this.adb, args);
          case 'android_uiautomator_toggle_checkbox':
            return await uiautomatorToggleCheckboxHandler(this.adb, args);
          case 'android_uiautomator_scroll_in_element':
            return await uiautomatorScrollInElementHandler(this.adb, args);
          case 'android_start_scrcpy_stream':
            return await handleStartScrcpyStream(this.adb, args as any);
          case 'android_stop_scrcpy_stream':
            return await handleStopScrcpyStream(this.adb, args as any);
          case 'android_get_latest_frame':
            return await handleGetLatestFrame(this.adb, args as any);
          case 'android_capture_frame_scrcpy':
            return await handleCaptureFrameScrcpy(this.adb, args as any);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Android MCP Server running on stdio');
  }
}

const server = new AndroidMCPServer();
server.run().catch(console.error);
