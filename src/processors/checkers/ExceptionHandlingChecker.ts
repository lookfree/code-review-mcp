/**
 * 异常处理检查器
 * 检查异常处理相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class ExceptionHandlingChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.EXCEPTION_HANDLING;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查空catch块
        if (line.includes('catch') && i < lines.length - 2) {
          const nextLine = lines[i + 1].trim();
          const afterNextLine = lines[i + 2].trim();
          if (nextLine === '{' && afterNextLine === '}') {
            issues.push(this.createIssue(
              '空catch块',
              '发现空的catch块，可能忽略了异常',
              file,
              IssueSeverity.MAJOR,
              i + 1,
              '添加适当的异常处理逻辑或日志记录',
              'empty-catch'
            ));
          }
        }
        
        // 检查异常日志记录
        if (line.includes('catch') && !content.includes('log') && !content.includes('Log')) {
          issues.push(this.createIssue(
            '异常日志记录',
            '异常处理中缺少日志记录',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '添加日志记录以便问题追踪',
            'exception-logging'
          ));
        }
        
        // 检查异常抛出
        if (line.includes('throw new Exception') || line.includes('throw new RuntimeException')) {
          issues.push(this.createIssue(
            '通用异常类型',
            '使用了通用的异常类型',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '使用更具体的异常类型',
            'generic-exception'
          ));
        }
      }
    }

    return issues;
  }
} 