/**
 * 项目扫描工具测试
 */

import { scanProject, toolDefinition } from '../src/tools/scanProject.js';
import { Logger } from '../src/utils/Logger.js';

// Node.js 声明
declare const require: any;

describe('scanProject', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('Test');
  });

  describe('参数验证', () => {
    it('应该要求 projectPath 参数', async () => {
      const request = {
        params: {
          name: 'scan_project'
        }
      };

      const result = await scanProject(request);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('缺少必需的参数: projectPath');
    });

    it('应该验证 projectPath 是字符串', async () => {
      const request = {
        params: {
          name: 'scan_project',
          projectPath: 123
        }
      };

      const result = await scanProject(request);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('参数 projectPath 必须是字符串类型');
    });

    it('应该验证 categories 是数组', async () => {
      const request = {
        params: {
          name: 'scan_project',
          projectPath: '/test/path',
          categories: 'not-array'
        }
      };

      const result = await scanProject(request);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('参数 categories 必须是数组类型');
    });
  });

  describe('参数提取', () => {
    it('应该从 arguments 中提取参数', async () => {
      const request = {
        params: {
          name: 'scan_project',
          arguments: {
            projectPath: '/test/path'
          }
        }
      };

      const result = await scanProject(request);
      
      // 应该尝试处理请求，而不是参数错误
      expect(result.content[0].text).not.toContain('缺少必需的参数');
    });

    it('应该从 params 中直接提取参数', async () => {
      const request = {
        params: {
          name: 'scan_project',
          projectPath: '/test/path'
        }
      };

      const result = await scanProject(request);
      
      // 应该尝试处理请求，而不是参数错误
      expect(result.content[0].text).not.toContain('缺少必需的参数');
    });
  });

  describe('工具定义', () => {
    it('应该有正确的工具名称', () => {
      expect(toolDefinition.name).toBe('scan_project');
    });

    it('应该有描述', () => {
      expect(toolDefinition.description).toBeDefined();
      expect(toolDefinition.description.length).toBeGreaterThan(0);
    });

    it('应该有输入模式', () => {
      expect(toolDefinition.inputSchema).toBeDefined();
      expect(toolDefinition.inputSchema.type).toBe('object');
      expect(toolDefinition.inputSchema.properties).toBeDefined();
      expect(toolDefinition.inputSchema.required).toContain('projectPath');
    });
  });

  describe('错误处理', () => {
    it('应该处理不存在的项目路径', async () => {
      const request = {
        params: {
          name: 'scan_project',
          projectPath: '/non/existent/path'
        }
      };

      const result = await scanProject(request);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('项目路径不存在');
    });

    it('应该返回错误信息和持续时间', async () => {
      const request = {
        params: {
          name: 'scan_project',
          projectPath: '/non/existent/path'
        }
      };

      const result = await scanProject(request);
      
      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.duration).toBeDefined();
      expect(typeof response.duration).toBe('number');
    });
  });
});