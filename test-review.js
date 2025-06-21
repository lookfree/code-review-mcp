#!/usr/bin/env node

/**
 * 代码审查测试脚本
 * 用于测试代码审查MCP的功能
 */

import { scanProject } from './dist/tools/scanProject.js';
import { generateReport } from './dist/tools/generateReport.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('🚀 开始测试代码审查功能...\n');
  
  try {
    // 测试项目扫描
    console.log('📋 步骤1: 扫描示例Java项目');
    const sampleProjectPath = path.join(__dirname, 'examples', 'sample-java-project');
    
    const scanRequest = {
      params: {
        name: 'scan_project',
        arguments: {
          projectPath: sampleProjectPath,
          categories: ['security', 'performance', 'code_structure'],
          outputFormat: 'json'
        }
      }
    };
    
    const scanResult = await scanProject(scanRequest);
    console.log('扫描结果:', JSON.stringify(scanResult, null, 2));
    
    if (!scanResult.isError) {
      const reviewData = JSON.parse(scanResult.content[0].text);
      
      // 测试报告生成
      console.log('\n📊 步骤2: 生成审查报告');
      const reportRequest = {
        params: {
          name: 'generate_report',
          arguments: {
            results: [reviewData],
            format: 'html',
            outputPath: path.join(__dirname, 'test-report.html'),
            includeDetails: true
          }
        }
      };
      
      const reportResult = await generateReport(reportRequest);
      console.log('报告生成结果:', JSON.stringify(reportResult, null, 2));
    }
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTest(); 