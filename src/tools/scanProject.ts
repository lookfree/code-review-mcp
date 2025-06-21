/**
 * 项目扫描工具
 * 扫描整个Java Spring Boot项目并执行代码审查
 */

import { CodeReviewEngine } from '../processors/CodeReviewEngine.js';
import { Logger } from '../utils/Logger.js';
import { ScanProjectParams } from '../types/index.js';

/**
 * 扫描项目工具函数
 */
export async function scanProject(request: any): Promise<any> {
  const startTime = Date.now();
  const logger = new Logger('ScanProject');
  
  try {
    logger.info('收到项目扫描请求');
    
    // 🔑 关键：兼容性参数提取
    const params = extractParams(request) as ScanProjectParams;
    logger.debug('提取的参数:', params);
    
    // 参数验证
    validateParams(params);
    
    // 创建代码审查引擎
    const engine = new CodeReviewEngine(logger);
    
    // 执行项目扫描
    const result = await engine.scanProject(params);
    
    const duration = Date.now() - startTime;
    logger.info(`项目扫描完成，耗时: ${duration}ms`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.success,
          summary: result.summary,
          issues: result.issues.slice(0, 50), // 限制返回的问题数量
          message: `扫描完成，发现 ${result.issues.length} 个问题`,
          duration
        }, null, 2)
      }]
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`项目扫描失败: ${error.message}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          duration
        }, null, 2)
      }],
      isError: true
    };
  }
}

/**
 * 兼容性参数提取函数
 */
function extractParams(request: any): any {
  if (request.params?.arguments) {
    return request.params.arguments;
  }
  
  if (request.params) {
    const { name, ...otherParams } = request.params;
    return otherParams;
  }
  
  return {};
}

/**
 * 参数验证函数
 */
function validateParams(params: any): void {
  if (!params.projectPath) {
    throw new Error('缺少必需的参数: projectPath');
  }
  
  if (typeof params.projectPath !== 'string') {
    throw new Error('参数 projectPath 必须是字符串类型');
  }
  
  if (params.categories && !Array.isArray(params.categories)) {
    throw new Error('参数 categories 必须是数组类型');
  }
  
  if (params.outputFormat && !['json', 'html', 'markdown'].includes(params.outputFormat)) {
    throw new Error('参数 outputFormat 必须是 json、html 或 markdown');
  }
}

/**
 * 工具定义导出
 */
export const toolDefinition = {
  name: 'scan_project',
  description: '🔍 扫描Java Spring Boot项目并执行全面的代码审查，基于详细的质量检查清单',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: '要扫描的项目根目录路径'
      },
      includePatterns: {
        type: 'array',
        items: { type: 'string' },
        description: '包含的文件模式，默认为 ["**/*.java"]'
      },
      excludePatterns: {
        type: 'array',
        items: { type: 'string' },
        description: '排除的文件模式，默认排除 target、build、node_modules 等目录'
      },
      categories: {
        type: 'array',
        items: { 
          type: 'string',
          enum: [
            'code_structure',
            'performance', 
            'thread_safety',
            'security',
            'api_design',
            'service_relation',
            'database',
            'transaction',
            'environment',
            'configuration',
            'exception_handling',
            'maintainability',
            'third_party'
          ]
        },
        description: '要执行的审查分类，默认执行所有分类'
      },
      outputFormat: {
        type: 'string',
        enum: ['json', 'html', 'markdown'],
        description: '输出格式，默认为 json'
      },
      reportPath: {
        type: 'string',
        description: '报告输出路径（可选）'
      }
    },
    required: ['projectPath']
  }
}; 