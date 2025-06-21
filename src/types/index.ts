/**
 * 代码审查MCP服务器类型定义
 */

// 审查项目接口
export interface ReviewItem {
  分类: string;
  检查项: string;
  严重程度: '高' | '中' | '低';
  排期: number | string;
  状态: '未开始' | '进行中' | '已完成' | '';
}

// 代码审查参数接口
export interface CodeReviewParams {
  code: string;
  language?: string;
  categories?: string[];
  severity?: '高' | '中' | '低' | 'all';
  includeDetails?: boolean;
}

// 审查结果接口
export interface ReviewResult {
  success: boolean;
  totalItems: number;
  reviewedItems: number;
  issues: ReviewIssue[];
  summary: ReviewSummary;
  suggestions: string[];
}

// 审查问题接口
export interface ReviewIssue {
  category: string;
  checkItem: string;
  severity: '高' | '中' | '低';
  description: string;
  codeSnippet?: string;
  lineNumber?: number;
  suggestion: string;
  priority: number;
}

// 审查摘要接口
export interface ReviewSummary {
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  categoryCounts: Record<string, number>;
  overallScore: number;
  recommendations: string[];
}

// MCP工具接口
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (params: any) => Promise<any>;
}

// MCP配置接口
export interface MCPConfig {
  server: {
    name: string;
    version: string;
  };
  excel: {
    filePath: string;
    sheetName?: string;
  };
  review: {
    defaultLanguage: string;
    enableDetailedAnalysis: boolean;
    maxCodeLength: number;
  };
}

// 工具参数类型
export interface GetReviewChecklistParams {
  category?: string;
  severity?: '高' | '中' | '低' | 'all';
  status?: '未开始' | '进行中' | '已完成' | 'all';
}

export interface AnalyzeCodeParams {
  code: string;
  language?: string;
  categories?: string[];
  severity?: '高' | '中' | '低' | 'all';
  includeDetails?: boolean;
}

export interface GetCategoriesParams {
  includeCount?: boolean;
}

export interface SearchReviewItemsParams {
  keyword: string;
  category?: string;
  severity?: '高' | '中' | '低' | 'all';
}