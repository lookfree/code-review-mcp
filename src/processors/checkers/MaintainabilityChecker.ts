/**
 * 可维护性检查器
 * 检查代码可维护性相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class MaintainabilityChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.MAINTAINABILITY;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      // 检查注释覆盖率
      let commentLines = 0;
      let codeLines = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
          commentLines++;
        } else if (line.length > 0 && !line.startsWith('import') && !line.startsWith('package')) {
          codeLines++;
        }
        
        // 检查方法长度
        if (line.includes('public') && line.includes('(') && line.includes(')')) {
          let methodLines = 0;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim().startsWith('}') && lines[j].trim().length === 1) {
              break;
            }
            methodLines++;
          }
          
          if (methodLines > 30) {
            issues.push(this.createIssue(
              '方法过长',
              `方法长度为${methodLines}行，建议拆分`,
              file,
              IssueSeverity.MINOR,
              i + 1,
              '将长方法拆分为多个小方法',
              'long-method'
            ));
          }
        }
        
        // 检查魔法数字
        const numberMatch = line.match(/\b\d{2,}\b/);
        if (numberMatch && !line.includes('final') && !line.includes('static')) {
          issues.push(this.createIssue(
            '魔法数字',
            '代码中包含魔法数字',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '将魔法数字定义为常量',
            'magic-number'
          ));
        }
        
        // 检查TODO注释
        if (line.includes('TODO') || line.includes('FIXME')) {
          issues.push(this.createIssue(
            'TODO注释',
            '代码中存在未完成的TODO项',
            file,
            IssueSeverity.INFO,
            i + 1,
            '及时处理TODO和FIXME注释',
            'todo-comment'
          ));
        }
      }
      
      // 检查注释比例
      if (codeLines > 0 && commentLines / codeLines < 0.1) {
        issues.push(this.createIssue(
          '注释不足',
          '代码注释比例过低',
          file,
          IssueSeverity.MINOR,
          undefined,
          '增加必要的代码注释',
          'insufficient-comments'
        ));
      }
    }

    return issues;
  }
} 