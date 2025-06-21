/**
 * 安全检查器
 * 检查安全相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class SecurityChecker extends BaseChecker {
  /**
   * 获取检查器处理的分类
   */
  getCategory(): ReviewCategory {
    return ReviewCategory.SECURITY;
  }

  /**
   * 执行安全检查
   */
  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content } = fileData;

      // 检查SQL注入
      issues.push(...this.checkSqlInjection(file, content));
      
      // 检查XSS攻击防护
      issues.push(...this.checkXssProtection(file, content));
      
      // 检查权限验证
      issues.push(...this.checkPermissionValidation(file, content));
      
      // 检查输入验证
      issues.push(...this.checkInputValidation(file, content));
    }

    return issues;
  }

  /**
   * 检查SQL注入
   */
  private checkSqlInjection(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // 检查字符串拼接SQL
      if ((line.includes("executeQuery(") || line.includes("executeUpdate(") || line.includes("execute(")) 
          && line.includes("+") && line.includes("\"")) {
        issues.push(this.createIssue(
          'SQL注入风险',
          '使用字符串拼接构建SQL语句，存在SQL注入风险',
          file,
          IssueSeverity.CRITICAL,
          lineNumber,
          '使用PreparedStatement和参数化查询代替字符串拼接',
          'sql-injection'
        ));
      }
      
      // 检查Statement直接执行
      if (line.includes("Statement") && !line.includes("Prepared")) {
        const nextLines = lines.slice(i, i + 5).join(' ');
        if (nextLines.includes("executeQuery") || nextLines.includes("executeUpdate") || nextLines.includes("execute(")) {
          issues.push(this.createIssue(
            'SQL注入风险',
            '使用Statement直接执行SQL，存在SQL注入风险',
            file,
            IssueSeverity.MAJOR,
            lineNumber,
            '使用PreparedStatement代替Statement',
            'statement-execution'
          ));
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查XSS攻击防护
   */
  private checkXssProtection(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    // 检查是否使用了XSS防护库
    let hasXssProtection = content.includes("HtmlUtils.htmlEscape") || 
                           content.includes("StringEscapeUtils") ||
                           content.includes("encodeForHTML") ||
                           content.includes("escapeHtml");
    
    // 检查是否有直接输出用户输入的情况
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // 检查Controller中直接返回用户输入
      if ((file.includes("Controller") || content.includes("@Controller") || content.includes("@RestController")) &&
          (line.includes("@RequestParam") || line.includes("@PathVariable"))) {
        
        // 查找后续5行是否直接返回
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.includes("return") && !nextLine.includes("htmlEscape") && !nextLine.includes("escape")) {
            issues.push(this.createIssue(
              'XSS攻击风险',
              '直接返回用户输入，可能存在XSS攻击风险',
              file,
              IssueSeverity.MAJOR,
              lineNumber,
              '使用HtmlUtils.htmlEscape()或其他XSS防护库处理用户输入',
              'xss-protection'
            ));
            break;
          }
        }
      }
    }
    
    // 检查JSP页面中的XSS风险
    if (file.endsWith(".jsp") && !hasXssProtection) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes("${param.") || line.includes("<%=request.getParameter")) {
          issues.push(this.createIssue(
            'JSP XSS攻击风险',
            'JSP页面中直接输出请求参数，存在XSS攻击风险',
            file,
            IssueSeverity.CRITICAL,
            i + 1,
            '使用JSTL的<c:out>标签或fn:escapeXml()函数',
            'jsp-xss'
          ));
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查权限验证
   */
  private checkPermissionValidation(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    // 检查是否使用了Spring Security或Shiro等安全框架
    const hasSecurityFramework = content.includes("@PreAuthorize") || 
                                content.includes("@Secured") || 
                                content.includes("hasRole") ||
                                content.includes("hasPermission") ||
                                content.includes("SecurityContextHolder") ||
                                content.includes("Subject") && content.includes("hasRole");
    
    // 检查Controller是否缺少权限验证
    if ((file.includes("Controller") || content.includes("@Controller") || content.includes("@RestController")) &&
        !hasSecurityFramework) {
      
      // 检查是否有敏感操作但缺少权限验证
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;
        
        if ((line.includes("@PostMapping") || line.includes("@PutMapping") || line.includes("@DeleteMapping")) &&
            !content.includes("Authentication") && !content.includes("Principal")) {
          
          issues.push(this.createIssue(
            '缺少权限验证',
            '敏感操作接口可能缺少权限验证',
            file,
            IssueSeverity.MAJOR,
            lineNumber,
            '添加@PreAuthorize注解或在方法中进行权限验证',
            'permission-validation'
          ));
        }
      }
    }
    
    // 检查硬编码的角色或权限
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if ((line.includes("\"ROLE_") || line.includes("\"ADMIN\"") || line.includes("\"USER\"")) &&
          (line.includes("hasRole") || line.includes("hasAuthority"))) {
        
        issues.push(this.createIssue(
          '硬编码角色',
          '发现硬编码的角色或权限字符串',
          file,
          IssueSeverity.MINOR,
          i + 1,
          '使用常量类或枚举定义角色和权限',
          'hardcoded-roles'
        ));
      }
    }
    
    return issues;
  }

  /**
   * 检查输入验证
   */
  private checkInputValidation(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    // 检查是否使用了Bean Validation
    const hasBeanValidation = content.includes("@Valid") || 
                             content.includes("@Validated") || 
                             content.includes("@NotNull") ||
                             content.includes("@NotEmpty") ||
                             content.includes("@NotBlank");
    
    // 检查Controller中是否缺少输入验证
    if ((file.includes("Controller") || content.includes("@Controller") || content.includes("@RestController")) &&
        !hasBeanValidation) {
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;
        
        // 检查是否有接收请求体但没有验证
        if (line.includes("@RequestBody") && !line.includes("@Valid") && !line.includes("@Validated")) {
          issues.push(this.createIssue(
            '缺少输入验证',
            '接收请求体但未进行输入验证',
            file,
            IssueSeverity.MAJOR,
            lineNumber,
            '添加@Valid或@Validated注解进行输入验证',
            'input-validation'
          ));
        }
        
        // 检查是否有接收请求参数但没有验证
        if (line.includes("@RequestParam") && 
            !line.includes("required = false") && 
            !line.includes("defaultValue")) {
          
          // 检查是否在方法内部进行了验证
          let hasValidation = false;
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.includes("if") && 
                (nextLine.includes("null") || nextLine.includes("isEmpty") || nextLine.includes("isBlank"))) {
              hasValidation = true;
              break;
            }
          }
          
          if (!hasValidation) {
            issues.push(this.createIssue(
              '缺少参数验证',
              '接收请求参数但未进行验证',
              file,
              IssueSeverity.MINOR,
              lineNumber,
              '添加参数验证或使用Bean Validation',
              'param-validation'
            ));
          }
        }
      }
    }
    
    // 检查DTO类是否缺少验证注解
    if (file.endsWith("DTO.java") || file.endsWith("Request.java") || file.endsWith("Form.java")) {
      if (!hasBeanValidation) {
        issues.push(this.createIssue(
          '缺少验证注解',
          'DTO类缺少Bean Validation验证注解',
          file,
          IssueSeverity.MINOR,
          undefined,
          '添加@NotNull、@NotEmpty等验证注解',
          'dto-validation'
        ));
      }
    }
    
    return issues;
  }
} 