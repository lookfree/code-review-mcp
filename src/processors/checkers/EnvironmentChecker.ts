/**
 * 环境依赖检查器
 * 检查环境依赖相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class EnvironmentChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.ENVIRONMENT;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java') || f.endsWith('.properties') || f.endsWith('.yml'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查环境变量使用
        if (line.includes('System.getenv') || line.includes('System.getProperty')) {
          if (!line.includes('default') && !line.includes('?')) {
            issues.push(this.createIssue(
              '环境变量默认值',
              '环境变量缺少默认值',
              file,
              IssueSeverity.MINOR,
              i + 1,
              '为环境变量提供默认值以提高健壮性',
              'env-default'
            ));
          }
        }
        
        // 检查配置管理
        if (line.includes('spring.profiles.active')) {
          if (line.includes('prod') || line.includes('production')) {
            issues.push(this.createIssue(
              '生产环境配置',
              '生产环境配置需要特别注意',
              file,
              IssueSeverity.INFO,
              i + 1,
              '确保生产环境配置的安全性和正确性',
              'prod-config'
            ));
          }
        }
        
        // 检查依赖版本
        if (file.includes('pom.xml') && line.includes('<version>')) {
          if (line.includes('SNAPSHOT') || line.includes('RELEASE')) {
            issues.push(this.createIssue(
              '依赖版本管理',
              '使用了不稳定的依赖版本',
              file,
              IssueSeverity.MINOR,
              i + 1,
              '生产环境建议使用稳定版本',
              'dependency-version'
            ));
          }
        }
      }
    }

    return issues;
  }
} 