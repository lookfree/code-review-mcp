# 代码审查MCP

基于MCP模板实现的代码审查服务器，专注于Java Spring Boot项目代码质量检查。

## 功能特点

- 全面的代码质量检查
- 详细的代码审查报告生成
- 支持多种输出格式（JSON、HTML、Markdown）
- 针对Java Spring Boot项目优化
- 基于MCP（Model Context Protocol）实现

## 安装

```bash
npm install code-review-mcp
```

## 使用方法

### 作为命令行工具

```bash
code-review-mcp scan --project=/path/to/project --output=report.html
```

### 作为库引用

```javascript
import { scanProject } from 'code-review-mcp';

const result = await scanProject({
  projectPath: '/path/to/project',
  outputFormat: 'json'
});

console.log(result);
```

## 配置选项

| 选项 | 描述 | 默认值 |
|------|------|--------|
| projectPath | 项目路径 | 当前目录 |
| includePatterns | 包含的文件模式 | ['**/*.java'] |
| excludePatterns | 排除的文件模式 | ['**/test/**'] |
| categories | 检查类别 | 所有类别 |
| outputFormat | 输出格式 | 'json' |
| reportPath | 报告路径 | null |

## 检查类别

- 代码结构
- 性能优化
- 安全检查
- 数据库操作
- 线程安全
- API设计
- 异常处理
- 配置管理

## 贡献指南

欢迎提交Pull Request或Issue来改进本项目。

## 许可证

MIT

## 链接

- [GitHub Repository](https://github.com/lookfree/code-review-mcp)
- [Issues](https://github.com/lookfree/code-review-mcp/issues)
