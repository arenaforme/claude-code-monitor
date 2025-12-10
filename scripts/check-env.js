#!/usr/bin/env node
/**
 * @file 安装前环境检查脚本
 * @description 检测 C++ 编译工具是否已安装，给出友好提示
 */

const { execSync } = require('child_process');
const os = require('os');

function checkBuildTools() {
  const platform = os.platform();

  console.log('🔍 检查编译环境...');

  try {
    if (platform === 'darwin') {
      // macOS: 检查 Xcode 命令行工具
      execSync('xcode-select -p', { stdio: 'ignore' });
    } else if (platform === 'win32') {
      // Windows: 检查 Visual Studio Build Tools
      execSync('where cl.exe', { stdio: 'ignore' });
    } else {
      // Linux: 检查 gcc
      execSync('which gcc', { stdio: 'ignore' });
    }
    console.log('✅ 编译环境检查通过\n');
  } catch {
    console.error('\n');
    console.error('═'.repeat(60));
    console.error('⚠️  缺少 C++ 编译工具！');
    console.error('═'.repeat(60));
    console.error('\nnode-pty 是原生模块，需要 C++ 编译器来构建。\n');

    if (platform === 'darwin') {
      console.error('📦 macOS 安装方法:');
      console.error('   xcode-select --install\n');
    } else if (platform === 'win32') {
      console.error('📦 Windows 安装方法 (管理员权限运行):');
      console.error('   npm install -g windows-build-tools\n');
      console.error('   或从以下地址下载 Visual Studio Build Tools:');
      console.error('   https://visualstudio.microsoft.com/visual-cpp-build-tools/\n');
    } else {
      console.error('📦 Linux 安装方法:');
      console.error('   Debian/Ubuntu: sudo apt install build-essential');
      console.error('   CentOS/RHEL:   sudo yum groupinstall "Development Tools"\n');
    }

    console.error('安装完成后，请重新运行 npm install\n');
    console.error('═'.repeat(60));
    process.exit(1);
  }
}

checkBuildTools();
