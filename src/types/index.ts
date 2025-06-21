/**
 * 代码审查MCP类型定义
 * 基于图片中的审查清单定义相关类型
 */

// 基础类型
export interface ReviewResult {
  success: boolean;
  message?: string;
  issues: ReviewIssue[];
  summary: ReviewSummary;
}

export interface ReviewIssue {
  category: ReviewCategory;
  severity: IssueSeverity;
  type: string;
  description: string;
  file: string;
  line?: number;
  column?: number;
  suggestion?: string;
  ruleId: string;
}

export interface ReviewSummary {
  totalIssues: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  infoIssues: number;
  filesScanned: number;
  reviewTime: number;
}

// 审查分类（基于图片中的分类）
export enum ReviewCategory {
  CODE_STRUCTURE = 'code_structure',           // 代码结构与质量
  PERFORMANCE = 'performance',                 // 性能优化
  THREAD_SAFETY = 'thread_safety',            // 开发与线程安全
  SECURITY = 'security',                       // 安全问题
  API_DESIGN = 'api_design',                   // 接口设计
  SERVICE_RELATION = 'service_relation',       // 服务间关系
  DATABASE = 'database',                       // 数据库操作
  TRANSACTION = 'transaction',                 // 事务管理
  ENVIRONMENT = 'environment',                 // 环境依赖
  CONFIGURATION = 'configuration',             // 配置与部署
  EXCEPTION_HANDLING = 'exception_handling',   // 异常处理
  MAINTAINABILITY = 'maintainability',         // 代码可维护性
  THIRD_PARTY = 'third_party'                  // 第三方依赖管理
}

// 问题严重程度
export enum IssueSeverity {
  CRITICAL = 'critical',  // 严重问题
  MAJOR = 'major',        // 重要问题
  MINOR = 'minor',        // 一般问题
  INFO = 'info'           // 信息提示
}

// 项目扫描参数
export interface ScanProjectParams {
  projectPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  categories?: ReviewCategory[];
  outputFormat?: 'json' | 'html' | 'markdown';
  reportPath?: string;
}

// Java项目信息
export interface JavaProjectInfo {
  projectType: 'maven' | 'gradle';
  javaVersion: string;
  dependencies: JavaDependency[];
  sourceFiles: string[];
  testFiles: string[];
  configFiles: string[];
}

// 代码分析结果
export interface CodeAnalysisResult {
  file: string;
  issues: ReviewIssue[];
  metrics: {
    linesOfCode: number;
    complexity: number;
    maintainabilityIndex: number;
  };
}

// 报告生成参数
export interface ReportGenerationParams {
  results: ReviewResult[];
  format: 'json' | 'html' | 'markdown';
  outputPath: string;
  includeDetails?: boolean;
}

// 审查报告
export interface ReviewReport {
  projectName: string;
  scanTime: string;
  summary: ReviewSummary;
  issues: ReviewIssue[];
  recommendations: string[];
  qualityScore: number;
}

// MCP工具接口
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (request: any) => Promise<any>;
}

// 特定检查参数
export interface CheckParams {
  projectPath: string;
  files?: string[];
  severity?: IssueSeverity;
}

// 工具配置
export interface MCPConfig {
  server: {
    name: string;
    version: string;
  };
  review: {
    rules: ReviewRuleConfig[];
    thresholds: QualityThresholds;
  };
}

export interface ReviewRuleConfig {
  ruleId: string;
  category: ReviewCategory;
  enabled: boolean;
  severity: IssueSeverity;
  pattern?: string;
  description: string;
}

export interface QualityThresholds {
  maxCriticalIssues: number;
  maxMajorIssues: number;
  maxMinorIssues: number;
}

// Java项目相关类型（更新版本）
export interface JavaProjectInfo {
  projectType: 'maven' | 'gradle';
  springBootVersion?: string;
  javaVersion: string;
  dependencies: JavaDependency[];
  sourceFiles: string[];
  testFiles: string[];
  configFiles: string[];
}

export interface JavaDependency {
  groupId: string;
  artifactId: string;
  version: string;
  scope?: string;
}

// 代码分析结果
export interface CodeAnalysisResult {
  file: string;
  classes: JavaClass[];
  methods: JavaMethod[];
  annotations: JavaAnnotation[];
  imports: string[];
  complexity: number;
}

export interface JavaClass {
  name: string;
  type: 'class' | 'interface' | 'enum';
  modifiers: string[];
  annotations: JavaAnnotation[];
  methods: JavaMethod[];
  fields: JavaField[];
  lineStart: number;
  lineEnd: number;
}

export interface JavaMethod {
  name: string;
  returnType: string;
  parameters: JavaParameter[];
  modifiers: string[];
  annotations: JavaAnnotation[];
  complexity: number;
  lineStart: number;
  lineEnd: number;
}

export interface JavaField {
  name: string;
  type: string;
  modifiers: string[];
  annotations: JavaAnnotation[];
  line: number;
}

export interface JavaParameter {
  name: string;
  type: string;
  annotations: JavaAnnotation[];
}

export interface JavaAnnotation {
  name: string;
  attributes: Record<string, any>;
  line: number;
}

// 报告生成相关
export interface ReviewReport {
  projectName: string;
  scanTime: string;
  summary: ReviewSummary;
  issues: ReviewIssue[];
  recommendations: string[];
  qualityScore: number;
}

export interface ReportGenerationParams {
  results: ReviewResult[];
  format: 'json' | 'html' | 'markdown';
  outputPath: string;
  includeDetails?: boolean;
} 