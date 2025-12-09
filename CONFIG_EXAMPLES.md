# 示例配置文件

这是一个更详细的配置示例，展示了更多可能的规则和选项。

## 使用方法

1. 复制此文件内容到 `src/config.js`
2. 根据你的需求修改
3. 重启监控器

```javascript
/**
 * @file 监控器配置文件 - 高级示例
 * @author cj_claude
 * @date 2025-11-12
 */

module.exports = {
  // Claude Code 可执行文件路径
  claudeCommand: 'claude',

  // 监控配置
  monitor: {
    // 是否启用自动回复
    autoResponse: true,

    // 是否显示详细日志
    verbose: true,

    // 是否启用系统通知
    systemNotification: true,
  },

  // 检测规则（按优先级排序）
  detectionRules: [
    // 规则 1: 标准的 yes/no 确认
    {
      name: 'yes_no_confirmation',
      pattern: /\(y\/n\)|\[y\/n\]|yes\/no|continue\?/i,
      response: 'yes\n',
      requireConfirmation: false,
      message: '检测到确认提示，自动回复 "yes"'
    },

    // 规则 2: 批准类提示
    {
      name: 'approve_prompt',
      pattern: /approve|confirm|proceed/i,
      response: 'yes\n',
      requireConfirmation: false,
      message: '检测到批准提示'
    },

    // 规则 3: 删除操作（需要手动确认）
    {
      name: 'delete_confirmation',
      pattern: /delete|remove|删除/i,
      response: 'yes\n',
      requireConfirmation: true,  // 需要手动确认！
      message: '⚠️ 检测到删除操作，请手动确认'
    },

    // 规则 4: Git 相关操作
    {
      name: 'git_push',
      pattern: /git push|推送到远程/i,
      response: 'yes\n',
      requireConfirmation: false,
      message: '检测到 Git push 操作'
    },

    // 规则 5: 安装依赖
    {
      name: 'install_dependencies',
      pattern: /npm install|yarn install|安装依赖/i,
      response: 'yes\n',
      requireConfirmation: false,
      message: '检测到依赖安装提示'
    },

    // 可以继续添加更多规则...
  ],

  // 通知配置
  notification: {
    title: 'Claude Code 监控器',
    sound: true,
  }
};
```

## 常用规则模板

### 模板 1: 简单字符串匹配

```javascript
{
  name: 'rule_name',
  pattern: 'simple text',  // 不区分大小写
  response: 'your response\n',
  requireConfirmation: false,
  message: '描述信息'
}
```

### 模板 2: 正则表达式匹配

```javascript
{
  name: 'rule_name',
  pattern: /pattern1|pattern2|pattern3/i,  // i = 不区分大小写
  response: 'your response\n',
  requireConfirmation: false,
  message: '描述信息'
}
```

### 模板 3: 需要手动确认

```javascript
{
  name: 'dangerous_rule',
  pattern: /dangerous keyword/i,
  response: 'yes\n',
  requireConfirmation: true,  // 关键：需要按 Enter 确认
  message: '⚠️ 危险操作，请确认'
}
```

## 测试你的规则

1. 修改配置文件
2. 重启监控器：`npm start`
3. 观察监控器的输出
4. 根据实际效果调整规则

## 调试技巧

启用详细日志：

```javascript
monitor: {
  verbose: true,  // 查看所有检测和回复过程
}
```
