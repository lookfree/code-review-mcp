/**
 * 代码结构检查器
 * 检查代码结构与质量相关问题
 */

import { BaseChecker } from './BaseChecker.js';
import { ReviewIssue, ReviewCategory, IssueSeverity } from '../../types/index.js';

export class CodeStructureChecker extends BaseChecker {
  /**
   * 获取检查器处理的分类
   */
  getCategory(): ReviewCategory {
    return ReviewCategory.CODE_STRUCTURE;
  }

  /**
   * 执行代码结构检查
   */
  async check(files: string[], projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      const fileData = this.readFileContent(file);
      if (!fileData) continue;
      
      const { content } = fileData;

      // 检查重复编码
      issues.push(...this.checkDuplicateCode(file, content));
      
      // 检查命名规范
      issues.push(...this.checkNamingConventions(file, content));
      
      // 检查设计模式使用
      issues.push(...this.checkDesignPatterns(file, content));
      
      // 检查方法复杂度
      issues.push(...this.checkMethodComplexity(file, content));
    }

    return issues;
  }

  /**
   * 检查重复代码
   */
  private checkDuplicateCode(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    const codeBlocks = new Map<string, number[]>();
    
    // 检查重复的代码块（3行以上）
    for (let i = 0; i < lines.length - 2; i++) {
      const block = lines.slice(i, i + 3).join('\n').trim();
      if (block.length > 10 && !block.startsWith('//') && !block.startsWith('*')) {
        if (codeBlocks.has(block)) {
          codeBlocks.get(block)!.push(i + 1);
        } else {
          codeBlocks.set(block, [i + 1]);
        }
      }
    }
    
    // 报告重复代码
    for (const [block, lineNumbers] of codeBlocks) {
      if (lineNumbers.length > 1) {
        issues.push(this.createIssue(
          '重复代码',
          `发现重复代码块，出现在第 ${lineNumbers.join(', ')} 行`,
          file,
          IssueSeverity.MAJOR,
          lineNumbers[0],
          '考虑将重复代码提取为独立的方法',
          'duplicate-code'
        ));
      }
    }
    
    return issues;
  }

  /**
   * 检查命名规范
   */
  private checkNamingConventions(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // 检查类名命名规范（PascalCase）
      const classMatch = line.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (classMatch) {
        const className = classMatch[1];
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
          issues.push(this.createIssue(
            '类名命名规范',
            `类名 "${className}" 不符合PascalCase命名规范`,
            file,
            IssueSeverity.MINOR,
            lineNumber,
            '类名应该使用PascalCase命名规范，如：UserService',
            'class-naming'
          ));
        }
      }
      
      // 检查方法名命名规范（camelCase）
      const methodMatch = line.match(/(?:public|private|protected)?\s*\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
      if (methodMatch) {
        const methodName = methodMatch[1];
        if (!/^[a-z][a-zA-Z0-9]*$/.test(methodName) && methodName !== 'main') {
          issues.push(this.createIssue(
            '方法名命名规范',
            `方法名 "${methodName}" 不符合camelCase命名规范`,
            file,
            IssueSeverity.MINOR,
            lineNumber,
            '方法名应该使用camelCase命名规范，如：getUserById',
            'method-naming'
          ));
        }
      }
      
      // 检查变量名命名规范（camelCase）
      const variableMatch = line.match(/(?:private|protected|public)?\s+\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[;=]/);
      if (variableMatch) {
        const variableName = variableMatch[1];
        if (!/^[a-z][a-zA-Z0-9]*$/.test(variableName) && 
            !variableName.startsWith("m") && 
            !variableName.startsWith("s")) {
          issues.push(this.createIssue(
            '变量名命名规范',
            `变量名 "${variableName}" 不符合camelCase命名规范`,
            file,
            IssueSeverity.MINOR,
            lineNumber,
            '变量名应该使用camelCase命名规范，如：userId',
            'variable-naming'
          ));
        }
      }
      
      // 检查常量命名规范（UPPER_CASE）
      const constantMatch = line.match(/(?:public|private|protected)?\s+static\s+final\s+\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (constantMatch) {
        const constantName = constantMatch[1];
        if (!/^[A-Z][A-Z0-9_]*$/.test(constantName)) {
          issues.push(this.createIssue(
            '常量命名规范',
            `常量 "${constantName}" 不符合UPPER_CASE命名规范`,
            file,
            IssueSeverity.MINOR,
            lineNumber,
            '常量应该使用UPPER_CASE命名规范，如：MAX_RETRY_COUNT',
            'constant-naming'
          ));
        }
      }
    }
    
    return issues;
  }

  /**
   * 检查设计模式使用
   */
  private checkDesignPatterns(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    // 检查单例模式实现
    if (content.includes('private static') && content.includes('getInstance()')) {
      // 检查是否是线程安全的单例模式
      if (!content.includes('synchronized') && !content.includes('volatile')) {
        issues.push(this.createIssue(
          '单例模式实现',
          '发现可能不是线程安全的单例模式实现',
          file,
          IssueSeverity.MINOR,
          undefined,
          '考虑使用双重检查锁定或枚举实现线程安全的单例模式',
          'singleton-pattern'
        ));
      }
    }
    
    // 检查工厂模式
    if (file.includes('Factory') && content.includes('new ')) {
      let hasFactoryMethod = false;
      for (const line of lines) {
        if (line.includes('create') || line.includes('build') || line.includes('get') || line.includes('make')) {
          hasFactoryMethod = true;
          break;
        }
      }
      
      if (!hasFactoryMethod) {
        issues.push(this.createIssue(
          '工厂模式实现',
          '类名包含Factory但可能没有正确实现工厂模式',
          file,
          IssueSeverity.INFO,
          undefined,
          '工厂类应该提供创建对象的方法，如create()、build()等',
          'factory-pattern'
        ));
      }
    }
    
    // 检查构建器模式
    if (file.includes('Builder') && !content.includes('build()')) {
      issues.push(this.createIssue(
        '构建器模式实现',
        '类名包含Builder但可能没有正确实现构建器模式',
        file,
        IssueSeverity.INFO,
        undefined,
        '构建器类应该提供build()方法返回构建的对象',
        'builder-pattern'
      ));
    }
    
    return issues;
  }

  /**
   * 检查方法复杂度
   */
  private checkMethodComplexity(file: string, content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    let inMethod = false;
    let methodStartLine = 0;
    let methodName = '';
    let braceCount = 0;
    let complexity = 0;
    let lineCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测方法开始
      if (!inMethod) {
        const methodMatch = line.match(/(?:public|private|protected)?\s*\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (methodMatch && !line.endsWith(';')) {
          inMethod = true;
          methodStartLine = i + 1;
          methodName = methodMatch[1];
          braceCount = line.includes('{') ? 1 : 0;
          complexity = 1; // 基础复杂度为1
          lineCount = 0;
        }
      } else {
        lineCount++;
        
        // 计算圆括号数量变化
        if (line.includes('{')) braceCount += line.split('{').length - 1;
        if (line.includes('}')) braceCount -= line.split('}').length - 1;
        
        // 增加复杂度的条件
        if (line.includes('if ') || line.includes('else if')) complexity++;
        if (line.includes('for ') || line.includes('while ') || line.includes('do ')) complexity++;
        if (line.includes('case ') || line.includes('default:')) complexity++;
        if (line.includes('catch ')) complexity++;
        if (line.includes('&&') || line.includes('||')) {
          complexity += (line.split('&&').length - 1) + (line.split('||').length - 1);
        }
        
        // 方法结束
        if (braceCount === 0) {
          inMethod = false;
          
          // 检查方法复杂度
          if (complexity > 10) {
            issues.push(this.createIssue(
              '方法复杂度过高',
              `方法 "${methodName}" 的圈复杂度为 ${complexity}，超过推荐值10`,
              file,
              IssueSeverity.MAJOR,
              methodStartLine,
              '考虑将复杂方法拆分为多个小方法',
              'method-complexity'
            ));
          }
          
          // 检查方法长度
          if (lineCount > 50) {
            issues.push(this.createIssue(
              '方法过长',
              `方法 "${methodName}" 有 ${lineCount} 行，超过推荐值50行`,
              file,
              IssueSeverity.MINOR,
              methodStartLine,
              '考虑将长方法拆分为多个小方法',
              'method-length'
            ));
          }
        }
      }
    }
    
    return issues;
  }
} 