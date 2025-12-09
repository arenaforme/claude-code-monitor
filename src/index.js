#!/usr/bin/env node
/**
 * @file Claude Code 监控器主程序
 * @author cj_claude
 * @date 2025-11-12
 * @description 整合所有模块，启动监控服务（遵循 DIP 依赖倒置原则）
 */

const config = require('./config');
const ClaudeMonitor = require('./monitor');
const Detector = require('./detector');
const AutoResponder = require('./autoResponder');

class MonitorApp {
  constructor() {
    this.config = config;
    this.monitor = new ClaudeMonitor(config);
    this.detector = new Detector(config.detectionRules);
    this.responder = new AutoResponder(config);

    // 输出缓冲，用于避免重复检测
    this.lastTriggerTime = 0;
  }

  /**
   * 启动监控应用
   */
  start() {
    this._printBanner();
    this._setupMonitorListeners();

    // 从命令行参数获取传递给 Claude Code 的参数
    const claudeArgs = process.argv.slice(2);

    // 启动 Claude Code
    this.monitor.start(claudeArgs);

    // 处理 Ctrl+C 退出
    this._setupExitHandlers();
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

    // 监听进程启动
    this.monitor.on('started', () => {
      console.log('✅ Claude Code 已启动，监控中...\n');
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
  const app = new MonitorApp();
  app.start();
}

module.exports = MonitorApp;
