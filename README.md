# Code Review MCP

🔍 一个专为Java Spring Boot项目设计的代码审查MCP服务器，基于详细的代码质量检查清单提供全面的代码审查功能。

## 🌟 特性

### 📋 全面的代码审查分类

基于专业的代码审查清单，支持以下13个主要分类的检查：

1. **代码结构与质量** - 重复编码、设计模式、命名规范
2. **性能优化** - 循环优化、API调用、缓存使用、数据库查询
3. **开发与线程安全** - 线程池、并发控制、异常处理
4. **安全问题** - SQL注入、XSS攻击、权限检查、输入验证
5. **接口设计** - 参数验证、返回格式、版本控制
6. **服务间关系** - 服务定义、调用效率、注册发现
7. **数据库操作** - 事务管理、连接池、索引优化
8. **事务管理** - 事务范围、回滚机制、一致性
9. **环境依赖** - 服务循环依赖、配置管理
10. **配置与部署** - 环境配置、数据库配置、监控
11. **异常处理** - 全局异常、业务异常、日志记录
12. **代码可维护性** - 注释、设计模式、单元测试
13. **第三方依赖管理** - 依赖版本、安全漏洞

### 🛠️ 可用工具

- **scan_project** - 扫描Java Spring Boot项目并执行全面的代码审查
- **generate_report** - 生成代码审查报告，支持JSON、HTML、Markdown格式

### 📊 报告功能

- 支持多种输出格式（JSON、HTML、Markdown）
- 详细的问题分类和严重程度标记
- 质量评分系统（0-100分）
- 改进建议和最佳实践推荐
- 美观的HTML报告界面

## 🚀 安装

```bash
npm install code-review-mcp
```

## 📖 使用方法

### 启动MCP服务器

```bash
npm start
```

或者使用开发模式：

```bash
npm run dev
```

### 使用工具

#### 1. 扫描项目

```json
{
  "tool": "scan_project",
  "params": {
    "projectPath": "/path/to/your/java/project",
    "categories": ["security", "performance", "code_structure"],
    "outputFormat": "json"
  }
}
```

#### 2. 生成报告

```json
{
  "tool": "generate_report",
  "params": {
    "results": [/* 扫描结果 */],
    "format": "html",
    "outputPath": "./code-review-report.html"
  }
}
```

### 参数说明

#### scan_project 参数

- `projectPath` (必需) - 要扫描的项目根目录路径
- `includePatterns` (可选) - 包含的文件模式，默认为 `["**/*.java"]`
- `excludePatterns` (可选) - 排除的文件模式，默认排除 target、build、node_modules 等目录
- `categories` (可选) - 要执行的审查分类，默认执行所有分类
- `outputFormat` (可选) - 输出格式，支持 json、html、markdown
- `reportPath` (可选) - 报告输出路径

#### generate_report 参数

- `results` (必需) - 审查结果数组
- `format` (必需) - 报告格式：json、html、markdown
- `outputPath` (必需) - 报告输出文件路径
- `includeDetails` (可选) - 是否包含详细信息，默认为true

## 🔧 开发

### 项目结构

```
code-review-mcp/
├── src/
│   ├── core/           # 核心MCP服务器
│   ├── tools/          # MCP工具实现
│   ├── processors/     # 代码审查引擎
│   ├── utils/          # 工具类
│   └── types/          # 类型定义
├── tests/              # 测试文件
├── docs/               # 文档
└── package.json
```

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

## 📝 示例

### 基本使用示例

```typescript
import { CodeReviewMCPServer } from 'code-review-mcp';

const server = new CodeReviewMCPServer();
await server.start();
```

### 扫描项目示例

```bash
# 扫描当前目录的Java项目
code-review-mcp scan_project --projectPath . --categories security,performance
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [GitHub Repository](https://github.com/lookfree/code-review-mcp)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Issues](https://github.com/lookfree/code-review-mcp/issues)

## 🏷️ 版本历史

### v1.0.0
- 初始版本
- 支持13种代码审查分类
- 提供项目扫描和报告生成功能
- 支持多种输出格式 