'use strict';

// Hope Light 的舊 npm 指令相容層。這裡只把舊 profile 名稱翻成公司 channel；
// 不知道 Vault 在哪、不讀密文，也不把 Darren 自己的帳號帶回客戶工作區。

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PROFILE_CHANNELS = Object.freeze({
  hopelight: { talent: 'tiffany', channel: 'instagram-hopelight-ig' },
  moment: { talent: 'tiffany', channel: 'instagram-hopelight-moment' },
});

function defaultManusCli() {
  return path.resolve(
    __dirname,
    '..', '..', '..', '..', '..', '..',
    'Manus', 'tools', 'social-publishing', 'social.mjs',
  );
}

function splitProfile(args) {
  const indexes = args.flatMap((arg, index) => arg === '--profile' ? [index] : []);
  if (indexes.length !== 1) {
    throw new Error('請明示一個 Hope Light profile：--profile hopelight 或 --profile moment。');
  }
  const index = indexes[0];
  const profile = args[index + 1];
  if (!profile || profile.startsWith('--')) {
    throw new Error('--profile 後面需要 hopelight 或 moment。');
  }
  const selection = PROFILE_CHANNELS[String(profile).toLowerCase()];
  if (!selection) {
    throw new Error(
      '這個客戶工作區只轉接 hopelight 與 moment。其他帳號請直接使用 Manus social.mjs。',
    );
  }
  const rest = [...args.slice(0, index), ...args.slice(index + 2)];
  const reserved = rest.find((arg) =>
    ['--talent', '--channel', '--env-file', '--credential-env'].includes(arg));
  if (reserved) {
    throw new Error(reserved + ' 由相容層固定，不能從客戶工作區覆寫。');
  }
  return {
    selection,
    rest,
  };
}

function buildInvocation(command, args = [], { manusCli = defaultManusCli() } = {}) {
  if (!['whoami', 'stats', 'capabilities'].includes(command)) {
    throw new Error('不支援的 Manus 相容指令：' + command);
  }
  const { selection, rest } = splitProfile(args);
  return {
    command: process.execPath,
    args: [
      manusCli,
      command,
      '--talent', selection.talent,
      '--channel', selection.channel,
      ...rest,
    ],
    cwd: path.dirname(manusCli),
  };
}

function run(command, args = process.argv.slice(2)) {
  const invocation = buildInvocation(command, args);
  if (!fs.existsSync(invocation.args[0])) {
    throw new Error(
      '找不到 Manus social-publishing 引擎。mamasan-lab 與 Manus 必須位於同一個 Fourth-Life 目錄。',
    );
  }
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: invocation.cwd,
    env: process.env,
    shell: false,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.signal) throw new Error('Manus 指令被訊號中止：' + result.signal);
  process.exitCode = result.status ?? 1;
  return process.exitCode;
}

function runCli(command, args = process.argv.slice(2)) {
  try {
    return run(command, args);
  } catch (error) {
    console.error('Instagram 指令失敗：' + error.message);
    process.exitCode = 1;
    return 1;
  }
}

module.exports = { PROFILE_CHANNELS, buildInvocation, run, runCli, splitProfile };
