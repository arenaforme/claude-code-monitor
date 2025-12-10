# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Claude Code 监控器：监控 Claude Code CLI 输出并自动响应确认提示（如 yes/no 选项）。使用 node-pty 创建伪终端，保持完整的交互体验。

**环境要求**: macOS, Node.js >= 14.0

## 核心命令

```bash
# 安装依赖
npm install

# 启动监控器（新建对话）
npm start

# 继续上次对话
npm start -- -c
npm start -- --continue

# 恢复指定对话
npm start -- -r <session-id>

# 打印对话内容
npm start -- -p <session-id>

# 禁用自动响应（仅提醒）
npm start -- --no-auto

# 组合使用
npm start -- -c --no-auto

# 传递其他参数给 Claude Code
npm start -- /path/to/project

# 调试模式
npm run dev
```

## 命令行参数

| 参数 | 说明 |
|------|------|
| `-c, --continue` | 继续上次对话（等同于 `claude -c`） |
| `-r, --resume <id>` | 恢复指定的对话（等同于 `claude -r <id>`） |
| `-p, --print <id>` | 打印指定对话内容（等同于 `claude -p <id>`） |
| `--no-auto` | 禁用自动响应，仅提醒 |
| `--help` | 显示帮助信息 |
| `--version` | 显示版本号 |

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+T` | 切换自动响应开关（运行时动态切换） |
| `Ctrl+C` | 退出监控器 |

## 架构设计

### 模块职责（单一职责原则）

**4 个核心模块的协作关系**:

1. **index.js** - 主程序协调器
   - 初始化并协调所有模块
   - 绑定事件流: 输出 → 检测 → 响应
   - 防重复触发机制（2秒防抖）
   - 检测最近 2000 字符的缓冲区（避免分批输出导致遗漏）

2. **monitor.js** - PTY 进程管理器
   - 使用 `node-pty` 启动 Claude Code（必须用 PTY，普通子进程无法交互）
   - 转发用户输入/输出，保持原生终端体验
   - 处理终端大小调整和进程生命周期

3. **detector.js** - 模式匹配引擎
   - 清理 ANSI 转义序列后进行匹配
   - 按顺序测试规则（第一个匹配的规则生效）
   - 支持正则和字符串匹配

4. **autoResponder.js** - 响应执行器
   - 显示终端提醒 + macOS 系统通知
   - 自动回复或等待用户确认（基于规则配置）
   - 800ms 延迟发送（确保菜单完全渲染）

### 数据流

```
用户启动 → index.js 初始化
              ↓
         monitor.js 启动 PTY
              ↓
       Claude Code 输出流
              ↓
       detector.js 模式匹配
              ↓
      autoResponder.js 响应
              ↓
         PTY 写入响应
```

### 配置驱动设计（开放封闭原则）

**所有行为配置在 `src/config.js`**，添加新规则无需修改代码：

```javascript
{
  claudeCommand: '/opt/homebrew/bin/claude',  // Claude Code 安装路径
  monitor: {
    autoResponse: true,        // 禁用则仅提醒
    verbose: true,
    systemNotification: true
  },
  detectionRules: [
    {
      name: 'menu_selection_yes',
      pattern: /❯\s*1\.\s*Yes/i,      // 匹配菜单选项
      response: '\n',                  // 按回车确认
      requireConfirmation: false,      // 无需手动确认
      message: '检测到菜单选择提示'
    },
    {
      name: 'yes_no_confirmation',
      pattern: /\(y\/n\)|\[y\/n\]/i,
      response: 'y\n',                 // 必须带换行符
      requireConfirmation: false,
      message: '检测到 y/n 确认提示'
    }
  ]
}
```

## 关键实现细节

### PTY vs 普通子进程
**必须使用 node-pty 的原因**:
- Claude Code 检测 TTY 环境才启用交互模式
- 保留颜色和格式化输出
- 支持原生的 Ctrl+C、箭头键等终端操作

### 规则匹配逻辑
1. **顺序敏感**: 更具体的规则放前面（菜单选择 > 通用 y/n）
2. **防重复触发**: 2 秒内同一规则只触发一次
3. **缓冲区策略**: 检测最近 2000 字符（避免菜单分批输出导致遗漏）
4. **ANSI 清理**: 移除颜色代码后再匹配

### 响应格式要求
```javascript
// ✅ 正确
response: 'y\n'      // y + 换行符（LF）
response: '\r'       // 回车符（CR，用于菜单选择）
response: '\n'       // 仅换行符（某些菜单）

// ❌ 错误
response: 'y'        // 缺少换行，无法提交
```

**换行符选择指南**:
- `\n` (LF): 用于文本输入提示（如 y/n 确认）
- `\r` (CR): 用于菜单选项确认（Claude Code 菜单系统）
- 如不确定，可先用 `\n` 测试，不生效再改用 `\r`

### macOS 系统通知
使用双重策略确保可靠性：
1. node-notifier (跨平台)
2. osascript (macOS 原生，更可靠)

需要在"系统设置 > 通知"中允许终端应用发送通知。

## 配置修改

### 查找并配置 Claude Code 路径
```bash
# 1. 查找 claude 可执行文件位置
which claude

# 2. 编辑 src/config.js
claudeCommand: '/your/path/to/claude'
```

### 添加自定义规则
在 `detectionRules` 数组中追加：
```javascript
{
  name: 'custom_rule',
  pattern: /your pattern/i,
  response: 'your_response\n',
  requireConfirmation: false,  // 危险操作设为 true
  message: '描述信息'
}
```

### 调试模式
```javascript
// 仅提醒，不自动回复（测试规则匹配）
monitor: { autoResponse: false }

// 查看详细日志
monitor: { verbose: true }
```

## 注意事项

1. **规则顺序决定优先级**：具体规则放前面
2. **响应必须以换行符结尾**：`\n` 或 `\r`（根据交互类型选择）
3. **修改配置需要重启监控器**
4. **危险操作使用 `requireConfirmation: true`** 强制手动确认

## 调试技巧

### 查看缓冲区内容
如果规则无法匹配,可在 `index.js` 的 `_handleOutput` 方法中添加调试代码:

```javascript
_handleOutput(output) {
  const recentOutput = this.monitor.getBuffer().slice(-2000);

  // 临时调试：查看实际接收的内容
  if (this.config.monitor.verbose) {
    console.log('\n[DEBUG] 缓冲区内容:', JSON.stringify(recentOutput.slice(-200)));
  }

  const matchedRule = this.detector.detect(recentOutput);
  // ...
}
```

### 测试规则匹配
启用详细日志并禁用自动响应:
```javascript
// src/config.js
monitor: {
  autoResponse: false,  // 仅提醒，不自动发送
  verbose: true         // 显示详细日志
}
```

### 排查通知问题
```bash
# 测试 osascript 是否可用
osascript -e 'display notification "测试" with title "测试标题"'

# 检查终端通知权限
# 系统设置 > 通知 > Terminal/iTerm
```
