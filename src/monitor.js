/**
 * @file Droid Code 进程监控器 - PTY 版本
 * @author cj_claude
 * @date 2025-11-12
 * @description 使用伪终端（PTY）启动和管理 Droid Code，保持完整的交互体验
 */

const pty = require('node-pty');
const EventEmitter = require('events');
const os = require('os');

class ClaudeMonitor extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.ptyProcess = null;
    this.buffer = '';
  }

  /**
   * 启动 Droid Code 进程（使用 PTY）
   * @param {Array} args - 传递给 Droid Code 的命令行参数
   */
  start(args = []) {
    console.log('🚀 正在启动 Droid Code...');
    console.log(`📍 命令: ${this.config.claudeCommand} ${args.join(' ')}`);
    console.log('─'.repeat(60));

    // 使用 PTY 启动，模拟真实终端
    this.ptyProcess = pty.spawn(this.config.claudeCommand, args, {
      name: 'xterm-color',
      cols: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
      cwd: process.cwd(),
      env: process.env
    });

    this._setupListeners();
    this.emit('started');
  }

  /**
   * 设置 PTY 监听器
   */
  _setupListeners() {
    // 监听 PTY 输出（包含所有内容）
    this.ptyProcess.onData((data) => {
      // 保存到缓冲区供检测使用
      this.buffer += data;

      // 实时输出到控制台（用户可以看到完整的 Claude Code 界面）
      process.stdout.write(data);

      // 触发输出事件，供检测器使用
      this.emit('output', data);
    });

    // 监听 PTY 退出
    this.ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`\n⏹️  Droid Code 已退出，退出码: ${exitCode}`);
      this.emit('exit', exitCode);
    });

    // 将用户输入转发到 PTY
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (key) => {
      // Ctrl+C 处理
      if (key === '\u0003') {
        this.stop();
        process.exit(0);
        return;
      }

      // Ctrl+T 切换自动响应（Toggle）
      if (key === '\u0014') {
        this.emit('toggle-auto-response');
        return;
      }

      // 转发用户输入到 Claude Code
      if (this.ptyProcess) {
        this.ptyProcess.write(key);
      }
    });

    // 处理终端大小变化
    if (process.stdout.isTTY) {
      process.stdout.on('resize', () => {
        if (this.ptyProcess) {
          this.ptyProcess.resize(
            process.stdout.columns || 80,
            process.stdout.rows || 24
          );
        }
      });
    }
  }

  /**
   * 向 Droid Code 发送输入（用于自动回复）
   * @param {string} input - 要发送的输入内容
   */
  sendInput(input) {
    if (this.ptyProcess) {
      if (this.config.monitor.verbose) {
        // 不在这里输出，因为 PTY 会自动显示
      }
      this.ptyProcess.write(input);
      this.emit('input-sent', input);
    } else {
      console.error('❌ 无法发送输入：进程未运行');
    }
  }

  /**
   * 停止 Droid Code 进程
   */
  stop() {
    if (this.ptyProcess) {
      console.log('\n⏸️  正在停止 Droid Code...');
      this.ptyProcess.kill();
      this.ptyProcess = null;

      // 恢复终端模式
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
    }
  }

  /**
   * 获取缓冲的输出内容
   */
  getBuffer() {
    return this.buffer;
  }

  /**
   * 清空缓冲区
   */
  clearBuffer() {
    this.buffer = '';
  }
}

module.exports = ClaudeMonitor;
