#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ADBWrapper } from './adb-wrapper.js';
import { screenshotHandler, touchHandler, swipeHandler } from './handlers.js';

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
