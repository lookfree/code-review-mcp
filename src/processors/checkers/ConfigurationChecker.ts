/**
 * 配置检查器
 * 检查配置与部署相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class ConfigurationChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.CONFIGURATION;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java') || f.endsWith('.properties') || f.endsWith('.yml'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查硬编码密码
        if (line.includes('password') && (line.includes('=') || line.includes(':'))) {
          const passwordMatch = line.match(/password\s*[:=]\s*["']?([^"'\s]+)["']?/i);
          if (passwordMatch && passwordMatch[1] !== '${' && !passwordMatch[1].startsWith('${')) {
            issues.push(this.createIssue(
              '硬编码密码',
              '发现硬编码的密码',
              file,
              IssueSeverity.CRITICAL,
              i + 1,
              '使用环境变量或配置文件管理敏感信息',
              'hardcoded-password'
            ));
          }
        }
        
        // 检查调试模式
        if (line.includes('debug') && line.includes('true')) {
          issues.push(this.createIssue(
            '调试模式配置',
            '生产环境不应启用调试模式',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '在生产环境中禁用调试模式',
            'debug-mode'
          ));
        }
        
        // 检查数据库配置
        if (line.includes('jdbc:') && line.includes('localhost')) {
          issues.push(this.createIssue(
            '数据库配置',
            '数据库连接使用localhost，可能不适合生产环境',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '使用环境变量配置数据库连接',
            'db-config'
          ));
        }
      }
    }

    return issues;
  }
} 