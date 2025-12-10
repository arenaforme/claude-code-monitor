# Claude Code Monitor 安装指南

## 系统要求

- **Node.js** >= 14.0
- **Claude Code CLI** 已安装（`claude` 命令可用）
- **C++ 编译工具**（用于编译 node-pty 原生模块）

---

## macOS 安装

### 1. 安装前置依赖

```bash
# 安装 Xcode 命令行工具
xcode-select --install
```

### 2. 安装监控器

```bash
npm install -g claude-code-monitor-1.0.0.tgz
```

### 3. 验证安装

```bash
cm --help
```

### 4. 使用

```bash
# 在任意项目目录下
cd /path/to/your/project

cm          # 新建对话
cm -c       # 继续上次对话
cm -r <id>  # 恢复指定对话
cm --no-auto  # 仅提醒，不自动响应
```

---

## Windows 安装

### 1. 安装前置依赖

**方法一：使用 npm 安装（推荐）**

以管理员身份运行 PowerShell：

```powershell
npm install -g windows-build-tools
```

**方法二：手动安装 Visual Studio Build Tools**

1. 下载 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. 安装时选择 "C++ 生成工具" 工作负载

### 2. 安装监控器

```powershell
npm install -g claude-code-monitor-1.0.0.tgz
```

### 3. 验证安装

```powershell
cm --help
```

### 4. 使用

```powershell
# 在任意项目目录下
cd C:\path\to\your\project

cm          # 新建对话
cm -c       # 继续上次对话
cm -r <id>  # 恢复指定对话
cm --no-auto  # 仅提醒，不自动响应
```

---

## Linux 安装

### 1. 安装前置依赖

```bash
# Debian/Ubuntu
sudo apt install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"

# Arch Linux
sudo pacman -S base-devel
```

### 2. 安装监控器

```bash
npm install -g claude-code-monitor-1.0.0.tgz
```

---

## 命令行参数

| 参数 | 说明 |
|------|------|
| `-c, --continue` | 继续上次对话 |
| `-r, --resume <id>` | 恢复指定对话 |
| `-p, --print <id>` | 打印对话内容 |
| `--no-auto` | 禁用自动响应，仅提醒 |
| `--help` | 显示帮助信息 |
| `--version` | 显示版本号 |

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+T` | 运行时切换自动响应开关 |
| `Ctrl+C` | 退出监控器 |

---

## 卸载

```bash
npm uninstall -g claude-code-monitor
```

---

## 常见问题

### Q: 安装时报 `gyp ERR!` 错误

缺少 C++ 编译工具，请按照上述步骤安装对应平台的编译工具。

### Q: 运行时提示找不到 `claude` 命令

确保 Claude Code CLI 已正确安装并添加到系统 PATH 中。

```bash
# 检查 claude 是否可用
which claude   # macOS/Linux
where claude   # Windows
```

### Q: macOS 上 Homebrew 安装的 claude 路径不对

编辑安装后的配置文件，修改 `claudeCommand` 路径：

```bash
# 查找 claude 实际路径
which claude

# 找到安装目录中的 config.js 并修改
```

### Q: 系统通知不显示

- **macOS**: 系统设置 > 通知 > 允许终端应用发送通知
- **Windows**: 检查通知中心设置
