/**
 * @file 关键词检测器
 * @author cj_claude
 * @date 2025-11-12
 * @description 负责检测输出中的关键词模式（遵循 SRP 单一职责原则）
 */

class Detector {
  constructor(rules) {
    this.rules = rules || [];
  }

  /**
   * 检测文本中是否匹配任何规则
   * @param {string} text - 要检测的文本
   * @returns {Object|null} 匹配的规则，如果没有匹配则返回 null
   */
  detect(text) {
    // 先移除所有 ANSI 转义序列（颜色代码等）
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');

    for (const rule of this.rules) {
      if (this._testRule(rule, cleanText)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * 测试单个规则
   * @param {Object} rule - 检测规则
   * @param {string} text - 文本内容
   * @returns {boolean} 是否匹配
   */
  _testRule(rule, text) {
    // 支持正则表达式和字符串匹配
    if (rule.pattern instanceof RegExp) {
      return rule.pattern.test(text);
    } else if (typeof rule.pattern === 'string') {
      return text.toLowerCase().includes(rule.pattern.toLowerCase());
    }
    return false;
  }

  /**
   * 添加新规则（遵循 OCP 开放封闭原则 - 可扩展）
   * @param {Object} rule - 新规则
   */
  addRule(rule) {
    this.rules.push(rule);
  }

  /**
   * 获取所有规则
   */
  getRules() {
    return this.rules;
  }
}

module.exports = Detector;
