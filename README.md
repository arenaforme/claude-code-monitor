# Claude Code 监控器

> 🤖 自动监控 Claude Code 运行并智能处理确认提示

**作者**: cj_claude
**日期**: 2025-11-12
**版本**: v1.0.0

---

## 📖 项目简介

这是一个专为 macOS 设计的 Claude Code 监控工具，能够：

- ✅ **实时监控** Claude Code 的所有输出
- ✅ **智能检测** 需要用户确认的提示（如 yes/no）
- ✅ **自动回复** 预设的确认内容
- ✅ **系统通知** 通过 macOS 通知中心提醒用户
- ✅ **零侵入** 不修改 Claude Code 本身，作为独立进程运行

### 设计原则

本项目严格遵循以下编程原则：

- **KISS（简单至上）**: 代码简洁直观，易于理解和维护
- **YAGNI（精益求精）**: 只实现必需功能，避免过度设计
- **DRY（杜绝重复）**: 配置集中管理，逻辑复用
- **SOLID**:
  - **SRP**: 每个模块职责单一（监控/检测/响应分离）
  - **OCP**: 可通过配置扩展检测规则，无需修改代码
  - **DIP**: 主程序依赖抽象接口，模块间低耦合

---

## 🚀 快速开始

### 前置要求

- **操作系统**: macOS (其他系统需调整配置)
- **Node.js**: >= 14.0
- **Claude Code**: 已安装并可通过命令行访问

验证 Claude Code 安装：
```bash
which claude
# 应输出：/usr/local/bin/claude 或 /opt/homebrew/bin/claude
```

### 安装步骤

1. **安装依赖**
```bash
cd /Users/jianchen/develop/claude/other/monitor
npm install
```

2. **配置 Claude Code 路径**

编辑 `src/config.js`，确认 `claudeCommand` 指向正确的 Claude Code 可执行文件：

```javascript
module.exports = {
  // 根据你的安装位置调整
  claudeCommand: 'claude',  // 或 '/usr/local/bin/claude'
  // ...
};
```

3. **启动监控器**

```bash
npm start
```

或直接运行：
```bash
node src/index.js
```

---

## 📚 使用方法

### 基础用法

启动监控器后，它会自动启动 Claude Code 并开始监控：

```bash
npm start
```

你会看到类似的输出：
```
╔═══════════════════════════════════════════════════════════╗
║        Claude Code 监控器 v1.0                            ║
║        作者: cj_claude                                    ║
╚═══════════════════════════════════════════════════════════╝

📋 已加载 2 条检测规则
⚙️  自动回复: ✅ 启用
🔔 系统通知: ✅ 启用

🚀 正在启动 Claude Code...
✅ Claude Code 已启动，监控中...
```

### 传递参数给 Claude Code

```bash
npm start -- --help
npm start -- /path/to/project
```

### 当检测到确认提示时

监控器会：

1. **终端提醒**：显示醒目的黄色边框提示
```
============================================================
🔔 监控提醒
规则: yes_no_confirmation
消息: 检测到确认提示，自动回复 "yes"
动作: 自动回复 "yes"
============================================================
```

2. **macOS 通知**：弹出系统通知
3. **自动回复**：向 Claude Code 发送 `yes\n`

---

## ⚙️ 配置说明

### 核心配置项

编辑 `src/config.js` 进行自定义：

```javascript
module.exports = {
  // Claude Code 命令
  claudeCommand: 'claude',

  // 监控选项
  monitor: {
    autoResponse: true,          // 是否自动回复
    verbose: true,               // 是否显示详细日志
    systemNotification: true,    // 是否启用系统通知
  },

  // 检测规则（可自定义）
  detectionRules: [
    {
      name: 'yes_no_confirmation',
      pattern: /\(y\/n\)|\[y\/n\]|yes\/no|continue\?/i,
      response: 'yes\n',
      requireConfirmation: false,  // true: 需要手动确认后才发送
      message: '检测到确认提示，自动回复 "yes"'
    }
  ]
};
```

### 添加自定义规则

在 `detectionRules` 数组中添加新规则：

```javascript
{
  name: 'custom_rule',
  pattern: /你的正则表达式/i,
  response: '自动回复内容\n',
  requireConfirmation: false,
  message: '提示消息'
}
```

**规则字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 规则唯一标识 |
| `pattern` | RegExp/string | 匹配模式（正则或字符串） |
| `response` | string | 自动回复内容（记得加 `\n` 换行） |
| `requireConfirmation` | boolean | 是否需要手动确认 |
| `message` | string | 触发时的提示消息 |

---

## 📂 项目结构

```
monitor/
├── package.json              # 项目配置
├── README.md                 # 本文档
└── src/
    ├── index.js             # 主程序入口（整合所有模块）
    ├── monitor.js           # 进程监控器（启动和管理 Claude Code）
    ├── detector.js          # 关键词检测器（模式匹配）
    ├── autoResponder.js     # 自动回复器（发送输入和通知）
    └── config.js            # 配置文件（集中管理所有配置）
```

### 模块职责（遵循 SRP 原则）

| 模块 | 职责 | 输入 | 输出 |
|------|------|------|------|
| `monitor.js` | 管理 Claude Code 子进程 | 命令行参数 | 输出流事件 |
| `detector.js` | 检测输出中的关键词 | 文本内容 | 匹配的规则 |
| `autoResponder.js` | 处理提醒和自动回复 | 规则对象 | 终端提示/系统通知 |
| `index.js` | 协调各模块工作 | 用户命令 | 监控服务 |

---

## 🛠️ 高级用法

### 禁用自动回复（仅提醒）

修改 `src/config.js`:

```javascript
monitor: {
  autoResponse: false,  // 改为 false
  verbose: true,
  systemNotification: true,
}
```

这样只会提醒你，不会自动回复。

### 需要手动确认的规则

```javascript
{
  name: 'dangerous_operation',
  pattern: /delete|remove|危险操作/i,
  response: 'yes\n',
  requireConfirmation: true,  // 设为 true
  message: '检测到危险操作，请手动确认'
}
```

当触发此规则时，会提示你按 Enter 确认。

### 调试模式

查看更详细的日志：

```bash
npm run dev
```

---

## 🔧 常见问题

### 1. 提示 "启动 Claude Code 失败"

**原因**：找不到 Claude Code 可执行文件

**解决方法**：
```bash
# 1. 查找 Claude Code 路径
which claude

# 2. 如果找到，复制路径到 config.js
# 例如: claudeCommand: '/opt/homebrew/bin/claude'

# 3. 如果没找到，检查 Claude Code 是否已安装
```

### 2. 系统通知不显示

**原因**：macOS 通知权限未授予

**解决方法**：
1. 打开 **系统设置 > 通知**
2. 找到 **Terminal** 或 **iTerm**
3. 启用通知权限

### 3. 没有检测到提示

**原因**：检测规则不匹配

**解决方法**：
1. 查看 Claude Code 的实际输出格式
2. 修改 `config.js` 中的 `pattern` 正则表达式
3. 启用 `verbose: true` 查看详细日志

### 4. 自动回复了错误的内容

**原因**：规则误匹配

**解决方法**：
1. 设置 `requireConfirmation: true` 需要手动确认
2. 调整正则表达式使其更精确
3. 临时禁用 `autoResponse: false`

---

## 🎯 使用场景

### 场景 1: 长时间运行的任务

当 Claude Code 执行长任务（如大规模重构）时，你可以：

1. 启动监控器
2. 离开电脑做其他事
3. 收到系统通知后回来查看
4. 所有确认提示已自动处理

### 场景 2: 批量操作

需要执行多次确认的批量操作时：

```bash
npm start
# 监控器会自动处理所有 yes/no 提示
```

### 场景 3: 调试和测试

关闭自动回复，只观察提示：

```javascript
autoResponse: false  // 仅提醒，不自动回复
```

---

## 🔄 未来扩展

根据实际使用需求，可以轻松扩展以下功能（遵循 **OCP** 开放封闭原则）：

- [ ] Web 界面（浏览器查看监控日志）
- [ ] 日志记录到文件
- [ ] 更复杂的规则（基于上下文判断）
- [ ] 支持多个 Claude Code 实例
- [ ] 配置文件热重载
- [ ] 统计和分析功能

---

## 📝 开发说明

### 本地开发

```bash
# 安装依赖
npm install

# 运行
node src/index.js

# 测试特定场景
node src/index.js --help
```

### 代码风格

- 使用 JSDoc 注释
- 遵循 Node.js 最佳实践
- 模块化设计，单一职责

### 添加新功能

1. 在对应模块中添加方法
2. 更新 `config.js` 添加配置项
3. 在 `index.js` 中集成
4. 更新本文档

---

## 📄 许可证

MIT License

---

## 🙏 致谢

本项目设计遵循了以下原则和最佳实践：

- **KISS**: 简单至上，代码易读易懂
- **YAGNI**: 只实现必需功能，避免过度设计
- **DRY**: 配置集中管理，避免重复
- **SOLID**: 模块化设计，高内聚低耦合

---

## 📞 支持

如有问题或建议，请查看：

- 📖 本 README 的常见问题章节
- 💻 源代码注释
- 🔧 `config.js` 配置说明

---

**享受自动化的便利！🚀**
