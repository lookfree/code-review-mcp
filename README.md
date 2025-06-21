# 代码审查MCP

基于MCP模板实现的代码审查服务器，专注于Java Spring Boot项目代码质量检查。

## 功能特点

- 全面的代码质量检查
- 详细的代码审查报告生成
- 支持多种输出格式（JSON、HTML、Markdown）
- 针对Java Spring Boot项目优化
- 基于MCP（Model Context Protocol）实现

## 项目结构

```
code-review-mcp/
├── src/
│   ├── core/           # 核心MCP服务器
│   ├── tools/          # MCP工具实现
│   ├── processors/     # 代码审查引擎
│   │   └── checkers/   # 代码检查器
│   ├── utils/          # 工具类
│   └── types/          # 类型定义
├── tests/              # 测试文件
├── docs/               # 文档
└── package.json
```

## 在Cursor中配置使用

要在Cursor中配置并使用这个MCP服务，请按照以下步骤操作：

### 1. 克隆仓库

```bash
git clone https://github.com/lookfree/code-review-mcp.git
cd code-review-mcp
```

### 2. 安装依赖并构建

```bash
npm install
npm run build
```

### 3. 在Cursor中配置

1. 打开Cursor IDE
2. 点击左下角的设置图标，选择"设置"
3. 在设置中找到"MCP"或"模型上下文协议"部分
4. 点击"添加MCP"按钮
5. 输入以下信息：
   - 名称：代码审查MCP
   - 命令：`node <克隆仓库路径>/dist/index.js`
   - 描述：基于MCP的Java Spring Boot项目代码审查工具

注意：请将`<克隆仓库路径>`替换为你实际的仓库路径。

### 4. 使用MCP

配置完成后，你可以在Cursor中使用以下命令来调用这个MCP：

```
/mcp 代码审查MCP
```

然后你可以使用以下工具：

1. `scan_project` - 扫描Java项目并执行代码审查
2. `generate_report` - 生成审查报告

例如：

```
/mcp 代码审查MCP
请帮我审查这个Java项目的代码质量，项目路径是 /path/to/your/java/project
```

## 🖥️ Cursor IDE 配置

要在 Cursor IDE 中使用此 MCP 工具，请按照以下步骤配置：

1. 打开 Cursor IDE
2. 点击左下角的设置图标，选择 "Settings"
3. 在搜索框中输入 "MCP"
4. 找到 "MCP: Custom MCPs" 设置
5. 点击 "Edit in settings.json"
6. 在配置文件中添加以下内容：

```json
"mcp.customMCPs": [
  {
    "name": "Code Review",
    "command": "npx code-review-mcp",
    "description": "Java Spring Boot代码审查工具",
    "models": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]
  }
]
```

7. 保存配置文件
8. 重启 Cursor IDE

### 使用方法

配置完成后，您可以在 Cursor IDE 的对话框中直接调用代码审查功能：

1. 在对话框中输入 `/mcp Code Review` 或点击对话框底部的 MCP 按钮选择 "Code Review"
2. 输入您的代码审查需求，例如：
   - "扫描当前项目并检查安全问题"
   - "生成代码质量报告"
   - "检查我的Spring Boot项目中的性能问题"

MCP 工具将自动执行相应的代码审查任务并返回结果。

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
