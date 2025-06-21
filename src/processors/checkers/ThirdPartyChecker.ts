/**
 * 第三方依赖检查器
 * 检查第三方依赖管理相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class ThirdPartyChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.THIRD_PARTY;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.xml') || f.endsWith('.gradle') || f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查依赖版本
        if (file.includes('pom.xml') && line.includes('<version>')) {
          if (line.includes('SNAPSHOT')) {
            issues.push(this.createIssue(
              '不稳定依赖版本',
              '使用了SNAPSHOT版本的依赖',
              file,
              IssueSeverity.MINOR,
              i + 1,
              '生产环境避免使用SNAPSHOT版本',
              'snapshot-dependency'
            ));
          }
        }
        
        // 检查安全漏洞（基于已知的有漏洞的版本）
        if (line.includes('log4j') && line.includes('2.1')) {
          issues.push(this.createIssue(
            '安全漏洞',
            'Log4j 2.15.0以下版本存在安全漏洞',
            file,
            IssueSeverity.CRITICAL,
            i + 1,
            '升级到Log4j 2.15.0或更高版本',
            'log4j-vulnerability'
          ));
        }
        
        // 检查过时的依赖
        if (line.includes('commons-lang') && !line.includes('commons-lang3')) {
          issues.push(this.createIssue(
            '过时依赖',
            '使用了过时的commons-lang库',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '迁移到commons-lang3',
            'outdated-dependency'
          ));
        }
        
        // 检查依赖冲突
        if (file.includes('pom.xml') && line.includes('<dependency>')) {
          const artifactMatch = line.match(/<artifactId>([^<]+)<\/artifactId>/);
          if (artifactMatch) {
            const artifact = artifactMatch[1];
            // 简单的重复依赖检查
            const duplicateCount = content.split(artifact).length - 1;
            if (duplicateCount > 1) {
              issues.push(this.createIssue(
                '重复依赖',
                `发现重复的依赖：${artifact}`,
                file,
                IssueSeverity.MINOR,
                i + 1,
                '移除重复的依赖声明',
                'duplicate-dependency'
              ));
            }
          }
        }
        
        // 检查未使用的导入
        if (line.startsWith('import') && file.endsWith('.java')) {
          const importMatch = line.match(/import\s+([^;]+);/);
          if (importMatch) {
            const importClass = importMatch[1].split('.').pop();
            if (importClass && !content.includes(importClass.replace('import ', '').replace(';', ''))) {
              issues.push(this.createIssue(
                '未使用的导入',
                `未使用的导入：${importClass}`,
                file,
                IssueSeverity.INFO,
                i + 1,
                '移除未使用的导入语句',
                'unused-import'
              ));
            }
          }
        }
      }
    }

    return issues;
  }
} 