/**
 * 核心代码审查引擎
 * 基于图片中的审查清单实现各种检查功能
 */

// Node.js ES模块导入
import { glob } from 'glob';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/Logger.js';
import {
  ReviewResult,
  ReviewIssue,
  ReviewSummary,
  ReviewCategory,
  IssueSeverity,
  ScanProjectParams,
  JavaProjectInfo,
  // CodeAnalysisResult  // 暂时不使用
} from '../types/index.js';

export class CodeReviewEngine {
  private logger: Logger;
  // private rules: Map<string, ReviewRule>; // 暂时不使用

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('CodeReviewEngine');
    // this.rules = new Map();
    // this.initializeRules();
  }

  /**
   * 扫描整个项目
   */
  async scanProject(params: ScanProjectParams): Promise<ReviewResult> {
    const startTime = Date.now();
    this.logger.info(`开始扫描项目: ${params.projectPath}`);

    try {
      // 检查项目路径是否存在
      if (!existsSync(params.projectPath)) {
        throw new Error(`项目路径不存在: ${params.projectPath}`);
      }

      // 获取项目信息
      const projectInfo = await this.analyzeProject(params.projectPath);
      this.logger.info(`检测到项目类型: ${projectInfo.projectType}`);

      // 获取要扫描的文件
      const files = await this.getFilesToScan(params);
      this.logger.info(`找到 ${files.length} 个文件需要扫描`);

      // 执行各类检查
      const allIssues: ReviewIssue[] = [];
      const categories = params.categories || Object.values(ReviewCategory);

      for (const category of categories) {
        this.logger.info(`执行 ${category} 类检查`);
        const issues = await this.runCategoryChecks(category, files, params.projectPath);
        allIssues.push(...issues);
      }

      // 生成摘要
      const summary = this.generateSummary(allIssues, files.length, Date.now() - startTime);
      
      this.logger.info(`扫描完成，发现 ${allIssues.length} 个问题`);

      return {
        success: true,
        issues: allIssues,
        summary
      };

    } catch (error: any) {
      this.logger.error(`项目扫描失败: ${error.message}`);
      return {
        success: false,
        message: error.message,
        issues: [],
        summary: {
          totalIssues: 0,
          criticalIssues: 0,
          majorIssues: 0,
          minorIssues: 0,
          infoIssues: 0,
          filesScanned: 0,
          reviewTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 分析项目结构
   */
  private async analyzeProject(projectPath: string): Promise<JavaProjectInfo> {
    const pomPath = join(projectPath, 'pom.xml');
    const gradlePath = join(projectPath, 'build.gradle');
    
    let projectType: 'maven' | 'gradle';
    let dependencies: any[] = [];

    if (existsSync(pomPath)) {
      projectType = 'maven';
      // 这里可以解析pom.xml获取依赖信息
    } else if (existsSync(gradlePath)) {
      projectType = 'gradle';
      // 这里可以解析build.gradle获取依赖信息
    } else {
      throw new Error('未检测到Maven或Gradle项目配置文件');
    }

    // 获取源文件列表
    const sourceFiles = await glob('**/*.java', { 
      cwd: projectPath,
      ignore: ['**/target/**', '**/build/**', '**/node_modules/**']
    });

    const testFiles = await glob('**/test/**/*.java', { cwd: projectPath });
    const configFiles = await glob('**/application*.{yml,yaml,properties}', { cwd: projectPath });

    return {
      projectType,
      javaVersion: '11', // 默认值，实际应该从配置中读取
      dependencies,
      sourceFiles,
      testFiles,
      configFiles
    };
  }

  /**
   * 获取要扫描的文件列表
   */
  private async getFilesToScan(params: ScanProjectParams): Promise<string[]> {
    const patterns = params.includePatterns || ['**/*.java'];
    const excludePatterns = params.excludePatterns || [
      '**/target/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.git/**'
    ];

    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matchedFiles = await glob(pattern, {
        cwd: params.projectPath,
        ignore: excludePatterns
      });
             files.push(...matchedFiles.map((f: string) => join(params.projectPath, f)));
    }

    return [...new Set(files)]; // 去重
  }

  /**
   * 执行特定分类的检查
   */
  private async runCategoryChecks(
    category: ReviewCategory, 
    files: string[], 
    projectPath: string
  ): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    switch (category) {
      case ReviewCategory.CODE_STRUCTURE:
        issues.push(...await this.checkCodeStructure(files));
        break;
      case ReviewCategory.PERFORMANCE:
        issues.push(...await this.checkPerformance(files));
        break;
      case ReviewCategory.SECURITY:
        issues.push(...await this.checkSecurity(files));
        break;
      case ReviewCategory.DATABASE:
        issues.push(...await this.checkDatabase(files));
        break;
      case ReviewCategory.THREAD_SAFETY:
        issues.push(...await this.checkThreadSafety(files));
        break;
      case ReviewCategory.API_DESIGN:
        issues.push(...await this.checkApiDesign(files));
        break;
      case ReviewCategory.EXCEPTION_HANDLING:
        issues.push(...await this.checkExceptionHandling(files));
        break;
      case ReviewCategory.CONFIGURATION:
        issues.push(...await this.checkConfiguration(projectPath));
        break;
      // 其他分类的检查...
    }

    return issues;
  }

  /**
   * 检查代码结构与质量
   */
  private async checkCodeStructure(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      try {
        const content = readFileSync(file, 'utf-8');
        // const lines = content.split('\n'); // 暂时不使用

        // 检查重复编码
        issues.push(...this.checkDuplicateCode(file, content));
        
        // 检查命名规范
        issues.push(...this.checkNamingConventions(file, content));
        
        // 检查设计模式使用
        issues.push(...this.checkDesignPatterns(file, content));
        
        // 检查方法复杂度
        issues.push(...this.checkMethodComplexity(file, content));

      } catch (error: any) {
        this.logger.warn(`无法读取文件 ${file}: ${error.message}`);
      }
    }

    return issues;
  }

  /**
   * 检查性能问题
   */
  private async checkPerformance(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // 检查循环优化
        issues.push(...this.checkLoopOptimization(file, content));
        
        // 检查API调用频率
        issues.push(...this.checkApiCallFrequency(file, content));
        
        // 检查缓存使用
        issues.push(...this.checkCacheUsage(file, content));
        
        // 检查数据库查询优化
        issues.push(...this.checkDatabaseQueryOptimization(file, content));

      } catch (error: any) {
        this.logger.warn(`性能检查失败 ${file}: ${error.message}`);
      }
    }

    return issues;
  }

  /**
   * 检查安全问题
   */
  private async checkSecurity(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of files.filter(f => f.endsWith('.java'))) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // 检查SQL注入
        issues.push(...this.checkSqlInjection(file, content));
        
        // 检查XSS攻击防护
        issues.push(...this.checkXssProtection(file, content));
        
        // 检查权限验证
        issues.push(...this.checkPermissionValidation(file, content));
        
        // 检查输入验证
        issues.push(...this.checkInputValidation(file, content));

      } catch (error: any) {
        this.logger.warn(`安全检查失败 ${file}: ${error.message}`);
      }
    }

    return issues;
  }

  // 具体检查方法的实现...
  private checkDuplicateCode(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现重复代码检查逻辑
    return issues;
  }

  private checkNamingConventions(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现命名规范检查逻辑
    return issues;
  }

  private checkDesignPatterns(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现设计模式检查逻辑
    return issues;
  }

  private checkMethodComplexity(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现方法复杂度检查逻辑
    return issues;
  }

  private checkLoopOptimization(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现循环优化检查逻辑
    return issues;
  }

  private checkApiCallFrequency(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现API调用频率检查逻辑
    return issues;
  }

  private checkCacheUsage(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现缓存使用检查逻辑
    return issues;
  }

  private checkDatabaseQueryOptimization(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现数据库查询优化检查逻辑
    return issues;
  }

  private checkSqlInjection(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现SQL注入检查逻辑
    return issues;
  }

  private checkXssProtection(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现XSS防护检查逻辑
    return issues;
  }

  private checkPermissionValidation(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现权限验证检查逻辑
    return issues;
  }

  private checkInputValidation(_file: string, _content: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    // 实现输入验证检查逻辑
    return issues;
  }

  private async checkDatabase(_files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    // 实现数据库相关检查
    return issues;
  }

  private async checkThreadSafety(_files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    // 实现线程安全检查
    return issues;
  }

  private async checkApiDesign(_files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    // 实现API设计检查
    return issues;
  }

  private async checkExceptionHandling(_files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    // 实现异常处理检查
    return issues;
  }

  private async checkConfiguration(_projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    // 实现配置检查
    return issues;
  }

  /**
   * 生成审查摘要
   */
  private generateSummary(issues: ReviewIssue[], filesScanned: number, reviewTime: number): ReviewSummary {
    const summary: ReviewSummary = {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === IssueSeverity.CRITICAL).length,
      majorIssues: issues.filter(i => i.severity === IssueSeverity.MAJOR).length,
      minorIssues: issues.filter(i => i.severity === IssueSeverity.MINOR).length,
      infoIssues: issues.filter(i => i.severity === IssueSeverity.INFO).length,
      filesScanned,
      reviewTime
    };

    return summary;
  }

  /**
   * 初始化检查规则 (暂时不使用)
   */
  // private initializeRules(): void {
  //   // 这里可以加载外部规则配置
  //   // 暂时使用硬编码规则
  // }
}

// 审查规则接口 (暂时不使用)
// interface ReviewRule {
//   id: string;
//   category: ReviewCategory;
//   severity: IssueSeverity;
//   pattern: RegExp;
//   description: string;
//   suggestion: string;
// } 