#!/usr/bin/env node
/**
 * @file Claude Code 监控器主程序
 * @author cj_claude
 * @date 2025-11-12
 * @description 整合所有模块，启动监控服务（遵循 DIP 依赖倒置原则）
 */

const { Command } = require('commander');
const config = require('./config');
const ClaudeMonitor = require('./monitor');
const Detector = require('./detector');
const AutoResponder = require('./autoResponder');
const notifier = require('node-notifier');
const { execSync } = require('child_process');

// 解析命令行参数
const program = new Command();
program
  .name('claude-monitor')
  .description('Claude Code 监控器 - 自动响应确认提示')
  .version('1.0.0')
  .option('-c, --continue', '继续上次对话（等同于 claude -c）')
  .option('-r, --resume <id>', '恢复指定的对话（等同于 claude -r <id>）')
  .option('-p, --print <id>', '打印指定对话内容（等同于 claude -p <id>）')
  .option('--no-auto', '禁用自动响应，仅提醒')
  .allowUnknownOption(true)  // 允许传递其他参数给 claude
  .parse(process.argv);

class MonitorApp {
  constructor(options = {}) {
    this.config = config;
    this.options = options;
    this.monitor = new ClaudeMonitor(config);
    this.detector = new Detector(config.detectionRules);
    this.responder = new AutoResponder(config);

    // 根据命令行参数调整配置
    if (options.auto === false) {
      this.config.monitor.autoResponse = false;
    }

    // 输出缓冲，用于避免重复检测
    this.lastTriggerTime = 0;
  }

  /**
   * 启动监控应用
   */
  start() {
    this._printBanner();
    this._setupMonitorListeners();

    // 构建传递给 Claude Code 的参数
    const claudeArgs = this._buildClaudeArgs();

    // 启动 Claude Code
    this.monitor.start(claudeArgs);

    // 处理 Ctrl+C 退出
    this._setupExitHandlers();
  }

  /**
   * 构建 Claude Code 命令行参数
   */
  _buildClaudeArgs() {
    const args = [];
    const opts = this.options;

    // 继续上次对话
    if (opts.continue) {
      args.push('-c');
    }

    // 恢复指定对话
    if (opts.resume) {
      args.push('-r', opts.resume);
    }

    // 打印对话内容
    if (opts.print) {
      args.push('-p', opts.print);
    }

    // 添加其他未知参数（透传给 claude）
    const unknownArgs = program.args;
    if (unknownArgs.length > 0) {
      args.push(...unknownArgs);
    }

    return args;
  }

  /**
   * 获取当前运行模式描述
   */
  _getModeDescription() {
    const opts = this.options;
    if (opts.continue) return '继续上次对话';
    if (opts.resume) return `恢复对话 ${opts.resume}`;
    if (opts.print) return `打印对话 ${opts.print}`;
    return '新建对话';
  }

  /**
   * 打印启动横幅
   */
  _printBanner() {
    console.clear();
    const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        Claude Code 监控器 v1.0                            ║
║        作者: cj_claude                                    ║
║        日期: 2025-11-12                                   ║
║                                                           ║
║  功能:                                                    ║
║  ✅ 自动监控 Claude Code 输出                            ║
║  ✅ 智能检测确认提示                                     ║
║  ✅ 自动回复 yes                                         ║
║  ✅ macOS 系统通知                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `;
    console.log('\x1b[36m%s\x1b[0m', banner);
    console.log(`🎯 运行模式: ${this._getModeDescription()}`);
    console.log(`📋 已加载 ${this.detector.getRules().length} 条检测规则`);
    console.log(`⚙️  自动回复: ${this.config.monitor.autoResponse ? '✅ 启用' : '❌ 禁用'}`);
    console.log(`🔔 系统通知: ${this.config.monitor.systemNotification ? '✅ 启用' : '❌ 禁用'}\n`);
  }

  /**
   * 设置监控器事件监听
   */
  _setupMonitorListeners() {
    // 监听输出，检测关键词
    this.monitor.on('output', (output) => {
      this._handleOutput(output);
    });

    // 监听快捷键切换自动响应
    this.monitor.on('toggle-auto-response', () => {
      this._toggleAutoResponse();
    });

    // 监听进程启动
    this.monitor.on('started', () => {
      console.log('✅ Claude Code 已启动，监控中...');
      console.log('💡 按 Ctrl+T 切换自动响应开关\n');
      console.log('─'.repeat(60));
    });

    // 监听进程退出
    this.monitor.on('exit', (code) => {
      console.log('\n👋 监控已结束');
      process.exit(code);
    });

    // 监听启动错误
    this.monitor.on('start-error', (error) => {
      console.error('\n💡 请检查:');
      console.error('   1. Claude Code 是否已安装？运行: which claude');
      console.error('   2. 是否需要调整 config.js 中的 claudeCommand 路径？');
      process.exit(1);
    });
  }

  /**
   * 切换自动响应状态
   */
  _toggleAutoResponse() {
    this.config.monitor.autoResponse = !this.config.monitor.autoResponse;
    const isEnabled = this.config.monitor.autoResponse;

    // 终端提示
    const terminalMsg = isEnabled
      ? '\n\x1b[42m\x1b[30m ✅ 自动响应已开启 \x1b[0m\n'
      : '\n\x1b[41m\x1b[37m ⏸️  自动响应已关闭 \x1b[0m\n';
    process.stdout.write(terminalMsg);

    // 系统通知弹窗
    const title = 'Claude Code 监控器';
    const statusText = isEnabled ? '已开启' : '已关闭';
    const message = `自动响应: ${statusText}\n当前状态: ${isEnabled ? '检测到提示时将自动回复' : '检测到提示时仅提醒，不自动回复'}`;

    try {
      // node-notifier 通知
      notifier.notify({
        title: title,
        message: message,
        sound: true,
        timeout: 3
      });

      // macOS 原生通知（更可靠）
      const script = `display notification "${message}" with title "${title}"`;
      execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
    } catch (error) {
      // 静默失败
    }
  }

  /**
   * 处理输出并检测关键词
   */
  _handleOutput(output) {
    // 获取整个缓冲区的内容
    const currentBuffer = this.monitor.getBuffer();

    // 检测最近的 2000 字符（而不是只检测新增的片段）
    // 这样可以避免菜单提示被分批输出导致检测失败
    const recentOutput = currentBuffer.slice(-2000);

    // 检测最近的输出内容
    const matchedRule = this.detector.detect(recentOutput);

    if (matchedRule) {
      // 防止重复触发：检查是否刚刚触发过这个规则
      const ruleKey = `${matchedRule.name}_${Date.now()}`;
      const timeSinceLastTrigger = Date.now() - (this.lastTriggerTime || 0);

      // 如果距离上次触发超过 2 秒，才执行
      if (timeSinceLastTrigger > 2000) {
        this.lastTriggerTime = Date.now();

        // 找到匹配规则，触发自动回复
        this.responder.handle(matchedRule, (input) => {
          this.monitor.sendInput(input);
        });
      }
    }
  }

  /**
   * 设置退出处理
   */
  _setupExitHandlers() {
    // Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\n⏹️  收到中断信号，正在退出...');
      this.monitor.stop();
      process.exit(0);
    });

    // 终端关闭
    process.on('SIGTERM', () => {
      this.monitor.stop();
      process.exit(0);
    });
  }
}

// 启动应用
if (require.main === module) {
  const options = program.opts();
  const app = new MonitorApp(options);
  app.start();
}

module.exports = MonitorApp;
