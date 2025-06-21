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
} from '../types/index.js';

// 导入检查器
import { BaseChecker } from './checkers/BaseChecker.js';
import { CodeStructureChecker } from './checkers/CodeStructureChecker.js';
import { SecurityChecker } from './checkers/SecurityChecker.js';
import { PerformanceChecker } from './checkers/PerformanceChecker.js';
import { DatabaseChecker } from './checkers/DatabaseChecker.js';
import { ThreadSafetyChecker } from './checkers/ThreadSafetyChecker.js';
import { ApiDesignChecker } from './checkers/ApiDesignChecker.js';
import { ExceptionHandlingChecker } from './checkers/ExceptionHandlingChecker.js';
import { ConfigurationChecker } from './checkers/ConfigurationChecker.js';
import { ServiceRelationChecker } from './checkers/ServiceRelationChecker.js';
import { TransactionChecker } from './checkers/TransactionChecker.js';
import { EnvironmentChecker } from './checkers/EnvironmentChecker.js';
import { MaintainabilityChecker } from './checkers/MaintainabilityChecker.js';
import { ThirdPartyChecker } from './checkers/ThirdPartyChecker.js';

export class CodeReviewEngine {
  private logger: Logger;
  private checkers: BaseChecker[] = [];

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('CodeReviewEngine');
    this.initializeCheckers();
  }

  /**
   * 初始化检查器
   */
  private initializeCheckers(): void {
    this.checkers = [
      new CodeStructureChecker(this.logger),
      new SecurityChecker(this.logger),
      new PerformanceChecker(this.logger),
      new DatabaseChecker(this.logger),
      new ThreadSafetyChecker(this.logger),
      new ApiDesignChecker(this.logger),
      new ExceptionHandlingChecker(this.logger),
      new ConfigurationChecker(this.logger),
      new ServiceRelationChecker(this.logger),
      new TransactionChecker(this.logger),
      new EnvironmentChecker(this.logger),
      new MaintainabilityChecker(this.logger),
      new ThirdPartyChecker(this.logger),
    ];
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

      // 根据配置的分类执行检查
      for (const checker of this.checkers) {
        const checkerCategory = checker.getCategory();
        
        // 如果当前检查器的分类在需要检查的分类列表中
        if (categories.includes(checkerCategory)) {
          this.logger.info(`执行 ${checkerCategory} 类检查`);
          const issues = await checker.check(files, params.projectPath);
          allIssues.push(...issues);
        }
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
   * 生成摘要报告
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
}
