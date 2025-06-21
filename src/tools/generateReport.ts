/**
 * 报告生成工具
 * 生成代码审查报告并输出到指定路径
 */

import { Logger } from '../utils/Logger.js';
import { ReviewReport, ReportGenerationParams } from '../types/index.js';

// Node.js ES模块导入
import { writeFileSync } from 'fs';
import { dirname } from 'path';

declare const process: any;

/**
 * 生成报告工具函数
 */
export async function generateReport(request: any): Promise<any> {
  const startTime = Date.now();
  const logger = new Logger('GenerateReport');
  
  try {
    logger.info('收到报告生成请求');
    
    // 🔑 关键：兼容性参数提取
    const params = extractParams(request) as ReportGenerationParams;
    logger.debug('提取的参数:', params);
    
    // 参数验证
    validateParams(params);
    
    // 生成报告
    const report = await createReport(params);
    
    // 根据格式生成不同的报告内容
    let reportContent: string;
    switch (params.format) {
      case 'html':
        reportContent = generateHtmlReport(report);
        break;
      case 'markdown':
        reportContent = generateMarkdownReport(report);
        break;
      default:
        reportContent = JSON.stringify(report, null, 2);
    }
    
    // 写入文件
    writeFileSync(params.outputPath, reportContent, 'utf-8');
    
    const duration = Date.now() - startTime;
    logger.info(`报告生成完成，输出到: ${params.outputPath}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `报告已生成并保存到: ${params.outputPath}`,
          format: params.format,
          reportPath: params.outputPath,
          duration
        }, null, 2)
      }]
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`报告生成失败: ${error.message}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          duration
        }, null, 2)
      }],
      isError: true
    };
  }
}

/**
 * 创建报告对象
 */
async function createReport(params: ReportGenerationParams): Promise<ReviewReport> {
  const allIssues = params.results.flatMap(r => r.issues);
  const totalFiles = params.results.reduce((sum, r) => sum + r.summary.filesScanned, 0);
  const totalTime = params.results.reduce((sum, r) => sum + r.summary.reviewTime, 0);
  
  // 计算质量分数 (0-100)
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const majorCount = allIssues.filter(i => i.severity === 'major').length;
  const minorCount = allIssues.filter(i => i.severity === 'minor').length;
  
  let qualityScore = 100;
  qualityScore -= criticalCount * 20; // 严重问题扢20分
  qualityScore -= majorCount * 10;    // 重要问题扢10分
  qualityScore -= minorCount * 5;     // 一般问题扢5分
  qualityScore = Math.max(0, qualityScore);
  
  // 生成建议
  const recommendations = generateRecommendations(allIssues);
  
  return {
    projectName: dirname(process.cwd()).split('/').pop() || 'Unknown Project',
    scanTime: new Date().toISOString(),
    summary: {
      totalIssues: allIssues.length,
      criticalIssues: criticalCount,
      majorIssues: majorCount,
      minorIssues: minorCount,
      infoIssues: allIssues.filter(i => i.severity === 'info').length,
      filesScanned: totalFiles,
      reviewTime: totalTime
    },
    issues: allIssues,
    recommendations,
    qualityScore
  };
}

/**
 * 生成HTML报告
 */
function generateHtmlReport(report: ReviewReport): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码审查报告 - ${report.projectName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .critical { color: #dc3545; }
        .major { color: #fd7e14; }
        .minor { color: #ffc107; }
        .info { color: #17a2b8; }
        .issues { margin-top: 30px; }
        .issue { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #dee2e6; }
        .issue.critical { border-left-color: #dc3545; }
        .issue.major { border-left-color: #fd7e14; }
        .issue.minor { border-left-color: #ffc107; }
        .issue.info { border-left-color: #17a2b8; }
        .recommendations { background: #e7f3ff; padding: 20px; border-radius: 6px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>代码审查报告</h1>
            <h2>${report.projectName}</h2>
            <p>扫描时间: ${new Date(report.scanTime).toLocaleString('zh-CN')}</p>
            <p>质量评分: <strong>${report.qualityScore}/100</strong></p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>总问题数</h3>
                <h2>${report.summary.totalIssues}</h2>
            </div>
            <div class="summary-card">
                <h3 class="critical">严重问题</h3>
                <h2 class="critical">${report.summary.criticalIssues}</h2>
            </div>
            <div class="summary-card">
                <h3 class="major">重要问题</h3>
                <h2 class="major">${report.summary.majorIssues}</h2>
            </div>
            <div class="summary-card">
                <h3 class="minor">一般问题</h3>
                <h2 class="minor">${report.summary.minorIssues}</h2>
            </div>
            <div class="summary-card">
                <h3>扫描文件数</h3>
                <h2>${report.summary.filesScanned}</h2>
            </div>
        </div>
        
        <div class="recommendations">
            <h3>📋 改进建议</h3>
            <ul>
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="issues">
            <h3>🔍 问题详情</h3>
            ${report.issues.map(issue => `
                <div class="issue ${issue.severity}">
                    <h4>${issue.type}</h4>
                    <p><strong>文件:</strong> ${issue.file}</p>
                    ${issue.line ? `<p><strong>行号:</strong> ${issue.line}</p>` : ''}
                    <p><strong>描述:</strong> ${issue.description}</p>
                    ${issue.suggestion ? `<p><strong>建议:</strong> ${issue.suggestion}</p>` : ''}
                    <p><strong>分类:</strong> ${issue.category} | <strong>严重程度:</strong> ${issue.severity}</p>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
}

/**
 * 生成Markdown报告
 */
function generateMarkdownReport(report: ReviewReport): string {
  return `# 代码审查报告

## 项目信息
- **项目名称**: ${report.projectName}
- **扫描时间**: ${new Date(report.scanTime).toLocaleString('zh-CN')}
- **质量评分**: ${report.qualityScore}/100

## 📊 审查摘要

| 指标 | 数量 |
|------|------|
| 总问题数 | ${report.summary.totalIssues} |
| 严重问题 | ${report.summary.criticalIssues} |
| 重要问题 | ${report.summary.majorIssues} |
| 一般问题 | ${report.summary.minorIssues} |
| 信息提示 | ${report.summary.infoIssues} |
| 扫描文件数 | ${report.summary.filesScanned} |
| 扫描耗时 | ${report.summary.reviewTime}ms |

## 📋 改进建议

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔍 问题详情

${report.issues.map(issue => `
### ${issue.type} (${issue.severity})

- **文件**: ${issue.file}
${issue.line ? `- **行号**: ${issue.line}` : ''}
- **描述**: ${issue.description}
${issue.suggestion ? `- **建议**: ${issue.suggestion}` : ''}
- **分类**: ${issue.category}
- **规则ID**: ${issue.ruleId}
`).join('\n')}
`;
}

/**
 * 生成建议
 */
function generateRecommendations(issues: any[]): string[] {
  const recommendations: string[] = [];
  
  // 根据问题类型生成建议
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const securityIssues = issues.filter(i => i.category === 'security').length;
  const performanceIssues = issues.filter(i => i.category === 'performance').length;
  
  if (criticalCount > 0) {
    recommendations.push(`优先解决 ${criticalCount} 个严重问题，这些问题可能影响系统稳定性`);
  }
  
  if (securityIssues > 0) {
    recommendations.push(`加强安全防护，发现 ${securityIssues} 个安全相关问题`);
  }
  
  if (performanceIssues > 0) {
    recommendations.push(`优化性能，发现 ${performanceIssues} 个性能相关问题`);
  }
  
  recommendations.push('建议建立代码审查流程，确保代码质量');
  recommendations.push('考虑集成静态代码分析工具到CI/CD流程中');
  
  return recommendations;
}

/**
 * 兼容性参数提取函数
 */
function extractParams(request: any): any {
  if (request.params?.arguments) {
    return request.params.arguments;
  }
  
  if (request.params) {
    const { name, ...otherParams } = request.params;
    return otherParams;
  }
  
  return {};
}

/**
 * 参数验证函数
 */
function validateParams(params: any): void {
  if (!params.results || !Array.isArray(params.results)) {
    throw new Error('缺少必需的参数: results');
  }
  
  if (!params.format || !['json', 'html', 'markdown'].includes(params.format)) {
    throw new Error('参数 format 必须是 json、html 或 markdown');
  }
  
  if (!params.outputPath) {
    throw new Error('缺少必需的参数: outputPath');
  }
}

/**
 * 工具定义导出
 */
export const toolDefinition = {
  name: 'generate_report',
  description: '📃 生成详细的代码审查报告，支持JSON、HTML和Markdown格式',
  inputSchema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        description: '审查结果数组',
        items: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            issues: { type: 'array' },
            summary: { type: 'object' }
          }
        }
      },
      format: {
        type: 'string',
        enum: ['json', 'html', 'markdown'],
        description: '输出格式'
      },
      outputPath: {
        type: 'string',
        description: '报告输出路径'
      },
      includeDetails: {
        type: 'boolean',
        description: '是否包含详细信息'
      }
    },
    required: ['results', 'format', 'outputPath']
  }
};