/**
 * 检查器基类
 * 所有具体检查器都继承自此基类
 */

import { readFileSync } from 'fs';
import { Logger } from '../../utils/Logger.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export abstract class BaseChecker {
  protected logger: Logger;
  
  constructor(logger?: Logger) {
    this.logger = logger || new Logger(this.constructor.name);
  }

  /**
   * 执行检查
   * @param files 要检查的文件列表
   * @param projectPath 项目根路径
   * @returns 检查发现的问题列表
   */
  abstract check(files: string[], projectPath: string): Promise<ReviewIssue[]>;

  /**
   * 获取检查器处理的分类
   */
  abstract getCategory(): ReviewCategory;

  /**
   * 安全地读取文件内容
   */
  protected readFileContent(file: string): { content: string, lines: string[] } | null {
    try {
      const content = readFileSync(file, 'utf-8');
      return {
        content,
        lines: content.split('\n')
      };
    } catch (error: any) {
      this.logger.warn(`无法读取文件 ${file}: ${error.message}`);
      return null;
    }
  }

  /**
   * 创建检查问题
   */
  protected createIssue(
    type: string,
    description: string,
    file: string,
    severity: IssueSeverity,
    line?: number,
    suggestion?: string,
    ruleId?: string
  ): ReviewIssue {
    return {
      category: this.getCategory(),
      severity,
      type,
      description,
      file,
      line,
      suggestion,
      ruleId: ruleId || `${this.getCategory()}-${type.toLowerCase().replace(/\s+/g, '-')}`
    };
  }
} 