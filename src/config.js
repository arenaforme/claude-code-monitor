/**
 * @file 监控器配置文件
 * @author cj_claude
 * @date 2025-11-12
 * @description Claude Code 监控器的配置项
 */

const os = require('os');

/**
 * 获取 Claude Code 可执行文件路径（跨平台）
 */
function getClaudeCommand() {
  const platform = os.platform();
  if (platform === 'win32') {
    // Windows: 通常在用户目录的 AppData 或 PATH 中
    return 'claude';  // 依赖 PATH 环境变量
  } else if (platform === 'darwin') {
    // macOS: Homebrew 安装路径
    return '/opt/homebrew/bin/claude';
  } else {
    // Linux: 通常在 /usr/local/bin
    return '/usr/local/bin/claude';
  }
}

module.exports = {
  // Claude Code 可执行文件路径（自动检测平台）
  claudeCommand: getClaudeCommand(),

  // 监控配置
  monitor: {
    // 是否启用自动回复
    autoResponse: true,

    // 是否显示详细日志
    verbose: true,

    // 是否启用系统通知
    systemNotification: true,
  },

  // 检测规则（遵循 DRY 原则，集中管理所有规则）
  // 注意：规则按顺序匹配，更具体的规则应该放在前面
  detectionRules: [
    {
      // 规则 1: 通用菜单选择（任何带 ❯ 1. Yes 的菜单）- 最优先
      name: 'menu_selection_yes',
      // 匹配任何包含 "❯ 1. Yes" 的菜单（不管前面是什么问题）
      pattern: /❯\s*1\.\s*Yes/i,
      response: '\r',  // 尝试使用 \r (回车符) 而不是 \n (换行符)
      requireConfirmation: false,
      message: '检测到菜单选择提示，自动按回车确认'
    },
    {
      // 规则 2: 标准的 y/n 确认
      name: 'yes_no_confirmation',
      pattern: /\(y\/n\)|\[y\/n\]|yes\/no/i,
      response: 'y\n',
      requireConfirmation: false,
      message: '检测到 y/n 确认提示，自动回复 "y"'
    },
    // 可以添加更多规则
  ],

  // 通知配置
  notification: {
    title: 'Claude Code 监控器',
    sound: true, // macOS 系统通知声音
  }
};
