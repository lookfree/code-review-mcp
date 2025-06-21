/**
 * 线程安全检查器
 * 检查线程安全相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class ThreadSafetyChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.THREAD_SAFETY;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查Controller/Service中的实例变量
        if ((content.includes('@Controller') || content.includes('@Service')) && 
            line.includes('private') && !line.includes('static') && !line.includes('final')) {
          issues.push(this.createIssue(
            'Controller/Service实例变量',
            'Controller或Service中的实例变量可能导致线程安全问题',
            file,
            IssueSeverity.MAJOR,
            i + 1,
            '避免在Controller/Service中使用可变的实例变量',
            'instance-variable'
          ));
        }
        
        // 检查SimpleDateFormat
        if (line.includes('SimpleDateFormat') && !line.includes('ThreadLocal')) {
          issues.push(this.createIssue(
            'SimpleDateFormat线程安全',
            'SimpleDateFormat不是线程安全的',
            file,
            IssueSeverity.MAJOR,
            i + 1,
            '使用ThreadLocal<SimpleDateFormat>或DateTimeFormatter',
            'simpledateformat'
          ));
        }
        
        // 检查HashMap在多线程环境
        if (line.includes('HashMap') && !line.includes('ConcurrentHashMap')) {
          issues.push(this.createIssue(
            'HashMap多线程使用',
            'HashMap在多线程环境下不安全',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '考虑使用ConcurrentHashMap',
            'hashmap-thread'
          ));
        }
      }
    }

    return issues;
  }
} 