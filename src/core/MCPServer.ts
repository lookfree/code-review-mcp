/**
 * 代码审查MCP服务器核心
 * 
 * 基于MCP模板实现的代码审查服务器
 * 包含了请求处理、工具路由、错误处理等核心功能
 */

// MCP SDK 导入
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// 定义必要的类型
interface CallToolRequest {
  params: {
    name: string;
    arguments?: any;
    [key: string]: any;
  };
}

// ListToolsRequest 接口暂时不需要

// 导入工具定义和实现
import { scanProject, toolDefinition as scanProjectDef } from '../tools/scanProject.js';
import { generateReport, toolDefinition as generateReportDef } from '../tools/generateReport.js';
import { Logger } from '../utils/Logger.js';
import { MCPTool } from '../types/index.js';

/**
 * 代码审查MCP服务器主类
 */
export class CodeReviewMCPServer {
  private server: Server;
  private logger: Logger;
  private tools: Map<string, MCPTool>;

  constructor(logger?: Logger) {
    this.server = new Server(
      {
        name: 'code-review-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.logger = logger || new Logger('CodeReviewMCPServer');
    this.tools = new Map();

    this.setupHandlers();
    this.registerTools();
  }

  /**
   * 设置请求处理器
   */
  private setupHandlers(): void {
    // 工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.info('收到工具列表请求');
      return {
        tools: Array.from(this.tools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // 工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      return this.handleToolCall(request);
    });
  }

  /**
   * 注册工具
   */
  private registerTools(): void {
    // 注册项目扫描工具
    this.tools.set(scanProjectDef.name, {
      name: scanProjectDef.name,
      description: scanProjectDef.description,
      inputSchema: scanProjectDef.inputSchema,
      execute: scanProject,
    });

    // 注册报告生成工具
    this.tools.set(generateReportDef.name, {
      name: generateReportDef.name,
      description: generateReportDef.description,
      inputSchema: generateReportDef.inputSchema,
      execute: generateReport,
    });

    this.logger.info(`已注册 ${this.tools.size} 个工具`);
    this.tools.forEach((tool, name) => {
      this.logger.info(`- ${name}: ${tool.description}`);
    });
  }

  /**
   * 处理工具调用请求
   */
  private async handleToolCall(request: CallToolRequest): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`收到工具调用请求: ${request.params.name}`);
      this.logger.debug('请求详情:', JSON.stringify(request, null, 2));

      // 验证工具是否存在
      const tool = this.tools.get(request.params.name);
      if (!tool) {
        throw new Error(`未知工具: ${request.params.name}`);
      }

      // 构造工具执行请求
      const toolRequest = {
        params: request.params
      };

      // 执行工具
      const result = await tool.execute(toolRequest);
      
      const duration = Date.now() - startTime;
      this.logger.info(`工具 ${request.params.name} 执行完成，耗时: ${duration}ms`);

      // 返回结果
      if (result.content) {
        return result;
      } else {
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`工具调用失败: ${error.message}，耗时: ${duration}ms`);
      
      return {
        content: [
          {
            type: 'text',
            text: `错误: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    this.logger.info('启动代码审查MCP服务器...');
    this.logger.info(`已注册 ${this.tools.size} 个工具`);
    
    await this.server.connect(transport);
    this.logger.info('代码审查MCP服务器已启动，等待请求...');
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    this.logger.info('停止代码审查MCP服务器...');
    await this.server.close();
    this.logger.info('代码审查MCP服务器已停止');
  }

  /**
   * 获取已注册的工具列表
   */
  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }
} 