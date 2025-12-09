/**
 * @file 自动回复器
 * @author cj_claude
 * @date 2025-11-12
 * @description 负责自动回复和通知用户（遵循 SRP 单一职责原则）
 */

const notifier = require('node-notifier');
const { execSync } = require('child_process');

class AutoResponder {
  constructor(config) {
    this.config = config;
    this.respondedRules = new Set(); // 防止重复响应同一规则
  }

  /**
   * 处理检测到的规则
   * @param {Object} rule - 匹配的规则
   * @param {Function} sendInputCallback - 发送输入的回调函数
   */
  async handle(rule, sendInputCallback) {
    // 生成规则唯一标识（避免短时间内重复触发）
    const ruleId = `${rule.name}_${Date.now()}`;

    // 显示提醒消息
    this._showAlert(rule);

    // 发送系统通知
    if (this.config.monitor.systemNotification) {
      this._sendSystemNotification(rule);
    }

    // 自动回复
    if (this.config.monitor.autoResponse) {
      if (rule.requireConfirmation) {
        // 需要用户确认
        await this._confirmAndRespond(rule, sendInputCallback);
      } else {
        // 直接自动回复
        this._autoRespond(rule, sendInputCallback);
      }
    }
  }

  /**
   * 在终端显示醒目提醒
   */
  _showAlert(rule) {
    const border = '='.repeat(60);
    console.log('\n');
    console.log(`\x1b[33m${border}\x1b[0m`); // 黄色边框
    console.log(`\x1b[33m🔔 监控提醒\x1b[0m`);
    console.log(`\x1b[36m规则: ${rule.name}\x1b[0m`);
    console.log(`\x1b[36m消息: ${rule.message}\x1b[0m`);
    if (this.config.monitor.autoResponse && !rule.requireConfirmation) {
      console.log(`\x1b[32m动作: 自动回复 "${rule.response.trim()}"\x1b[0m`);
    }
    console.log(`\x1b[33m${border}\x1b[0m`);
    console.log('\n');
  }

  /**
   * 发送 macOS 系统通知
   */
  _sendSystemNotification(rule) {
    try {
      // 使用 node-notifier（跨平台方案）
      notifier.notify({
        title: this.config.notification.title,
        message: rule.message,
        sound: this.config.notification.sound,
        timeout: 5
      });

      // 备用：macOS 原生通知（更可靠）
      const script = `display notification "${rule.message}" with title "${this.config.notification.title}"`;
      execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
    } catch (error) {
      // 静默失败，不影响主流程
      if (this.config.monitor.verbose) {
        console.error('系统通知发送失败:', error.message);
      }
    }
  }

  /**
   * 直接自动回复
   */
  _autoRespond(rule, sendInputCallback) {
    // 添加短暂延迟，确保菜单完全渲染
    setTimeout(() => {
      sendInputCallback(rule.response);
      console.log(`\x1b[32m✅ 已自动回复\x1b[0m\n`);
    }, 800);  // 增加到 800ms
  }

  /**
   * 需要用户确认后才回复
   */
  async _confirmAndRespond(rule, sendInputCallback) {
    console.log(`\x1b[33m⚠️  此规则需要您确认是否自动回复\x1b[0m`);
    console.log(`回复内容: "${rule.response.trim()}"`);
    console.log(`按 Enter 确认，或 Ctrl+C 取消`);

    // 等待用户按键
    process.stdin.once('data', () => {
      sendInputCallback(rule.response);
      console.log(`\x1b[32m✅ 已发送回复\x1b[0m\n`);
    });
  }

  /**
   * 重置响应记录（可用于定时清理）
   */
  reset() {
    this.respondedRules.clear();
  }
}

module.exports = AutoResponder;
