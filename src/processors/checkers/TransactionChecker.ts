/**
 * 事务检查器
 * 检查事务管理相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class TransactionChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.TRANSACTION;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查事务回滚配置
        if (line.includes('@Transactional') && !line.includes('rollbackFor')) {
          issues.push(this.createIssue(
            '事务回滚配置',
            '@Transactional缺少rollbackFor配置',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '添加rollbackFor = Exception.class',
            'transaction-rollback'
          ));
        }
        
        // 检查事务传播行为
        if (line.includes('@Transactional') && !line.includes('propagation')) {
          issues.push(this.createIssue(
            '事务传播行为',
            '未明确指定事务传播行为',
            file,
            IssueSeverity.INFO,
            i + 1,
            '明确指定传播行为，如REQUIRED、REQUIRES_NEW等',
            'transaction-propagation'
          ));
        }
        
        // 检查只读事务
        if (line.includes('@Transactional') && 
            (content.includes('select') || content.includes('find') || content.includes('get')) &&
            !line.includes('readOnly = true')) {
          issues.push(this.createIssue(
            '只读事务优化',
            '查询方法建议使用只读事务',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '添加readOnly = true优化性能',
            'readonly-transaction'
          ));
        }
        
        // 检查大事务
        if (line.includes('@Transactional')) {
          let methodLines = 0;
          for (let j = i + 1; j < lines.length && !lines[j].includes('public'); j++) {
            methodLines++;
            if (methodLines > 50) {
              issues.push(this.createIssue(
                '大事务',
                '事务方法过长，可能导致锁定时间过长',
                file,
                IssueSeverity.MAJOR,
                i + 1,
                '拆分大事务或优化事务边界',
                'large-transaction'
              ));
              break;
            }
          }
        }
      }
    }

    return issues;
  }
} 