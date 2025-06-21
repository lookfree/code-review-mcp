/**
 * 服务关系检查器
 * 检查服务间关系相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class ServiceRelationChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.SERVICE_RELATION;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查循环依赖
        if (line.includes('@Autowired') || line.includes('@Resource')) {
          const nextLines = lines.slice(i + 1, i + 3).join(' ');
          if (nextLines.includes('Service') || nextLines.includes('Component')) {
            issues.push(this.createIssue(
              '潜在循环依赖',
              '可能存在服务间循环依赖',
              file,
              IssueSeverity.MINOR,
              i + 1,
              '检查服务依赖关系，避免循环依赖',
              'circular-dependency'
            ));
          }
        }
        
        // 检查Feign客户端
        if (line.includes('@FeignClient')) {
          if (!line.includes('fallback') && !line.includes('fallbackFactory')) {
            issues.push(this.createIssue(
              'Feign客户端容错',
              'Feign客户端缺少容错机制',
              file,
              IssueSeverity.MAJOR,
              i + 1,
              '添加fallback或fallbackFactory进行容错处理',
              'feign-fallback'
            ));
          }
        }
        
        // 检查服务注册发现
        if (content.includes('@EnableEurekaClient') || content.includes('@EnableDiscoveryClient')) {
          if (!content.includes('health')) {
            issues.push(this.createIssue(
              '服务健康检查',
              '服务注册缺少健康检查配置',
              file,
              IssueSeverity.MINOR,
              i + 1,
              '配置健康检查端点',
              'health-check'
            ));
          }
        }
      }
    }

    return issues;
  }
} 