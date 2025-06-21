/**
 * API设计检查器
 * 检查接口设计相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class ApiDesignChecker extends BaseChecker {
  getCategory(): ReviewCategory {
    return ReviewCategory.API_DESIGN;
  }

  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content, lines } = fileData;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查RESTful API设计
        if (line.includes('@RequestMapping') || line.includes('@GetMapping') || 
            line.includes('@PostMapping') || line.includes('@PutMapping') || 
            line.includes('@DeleteMapping')) {
          
          // 检查URL路径规范
          const urlMatch = line.match(/value\s*=\s*"([^"]+)"/);
          if (urlMatch) {
            const url = urlMatch[1];
            if (url.includes('_') || /[A-Z]/.test(url)) {
              issues.push(this.createIssue(
                'URL路径规范',
                'URL路径应使用小写字母和连字符',
                file,
                IssueSeverity.MINOR,
                i + 1,
                '使用kebab-case格式，如：/user-profile',
                'url-naming'
              ));
            }
          }
          
          // 检查HTTP方法使用
          if (line.includes('@RequestMapping') && !line.includes('method')) {
            issues.push(this.createIssue(
              'HTTP方法未指定',
              '@RequestMapping应明确指定HTTP方法',
              file,
              IssueSeverity.MINOR,
              i + 1,
              '使用@GetMapping、@PostMapping等注解或指定method属性',
              'http-method'
            ));
          }
        }
        
        // 检查参数验证
        if ((line.includes('@RequestBody') || line.includes('@RequestParam')) && 
            !line.includes('@Valid') && !line.includes('@Validated')) {
          issues.push(this.createIssue(
            '缺少参数验证',
            'API参数缺少验证注解',
            file,
            IssueSeverity.MAJOR,
            i + 1,
            '添加@Valid或@Validated注解进行参数验证',
            'parameter-validation'
          ));
        }
        
        // 检查返回类型规范
        if (line.includes('public') && line.includes('(') && 
            !line.includes('ResponseEntity') && !line.includes('Result') && 
            content.includes('@RestController')) {
          issues.push(this.createIssue(
            '返回类型规范',
            'API方法建议使用统一的返回类型',
            file,
            IssueSeverity.MINOR,
            i + 1,
            '使用ResponseEntity或自定义Result类型',
            'return-type'
          ));
        }
      }
    }

    return issues;
  }
} 