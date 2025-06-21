#!/usr/bin/env node

/**
 * 代码审查MCP服务器入口文件
 * 
 * 启动代码审查MCP服务器，提供Java Spring Boot项目的代码质量检查功能
 */

import { CodeReviewMCPServer } from './core/MCPServer.js';
import { Logger, LogLevel } from './utils/Logger.js';

/**
 * 主函数
 */
async function main(): Promise<void> {
  // 设置日志级别
  const logLevel = process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO;
  const logger = new Logger('CodeReviewMCP', logLevel);

  try {
    logger.info('🚀 启动代码审查MCP服务器...');
    logger.info('📋 基于详细的代码质量检查清单提供审查服务');
    
    // 创建并启动服务器
    const server = new CodeReviewMCPServer(logger);
    
    // 显示可用工具
    const tools = server.getRegisteredTools();
    logger.info(`🔧  可用工具: ${tools.join(', ')}`);
    
    // 启动服务器
    await server.start();

    // 处理优雅关闭
    process.on('SIGINT', async () => {
      logger.info('收到 SIGINT 信号，正在关闭服务器...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('收到 SIGTERM 信号，正在关闭服务器...');
      await server.stop();
      process.exit(0);
    });

  } catch (error: any) {
    logger.error(`服务器启动失败: ${error.message}`);
    process.exit(1);
  }
}

// Node.js 声明
declare const process: {
  env: { [key: string]: string | undefined };
  on: (event: string, handler: () => void) => void;
  exit: (code: number) => void;
};

declare const console: {
  error: (message?: any, ...optionalParams: any[]) => void;
};

// 启动服务器
main().catch((error: any) => {
  console.error('未处理的错误:', error);
  process.exit(1);
}); 