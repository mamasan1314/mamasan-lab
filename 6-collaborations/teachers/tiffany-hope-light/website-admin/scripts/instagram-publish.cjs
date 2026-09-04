#!/usr/bin/env node
'use strict';

// Compatibility module only. Tests may still import the canonical adapter through this path,
// but direct publishing from the client workspace is retired: it bypasses the Manus job,
// payload binding and approval receipt.

const path = require('node:path');
const fs = require('node:fs');

const adapterPath = path.resolve(
  __dirname,
  '..', '..', '..', '..', '..', '..',
  'Manus', 'tools', 'social-publishing', 'platforms', 'instagram', 'adapter',
  'scripts', 'instagram-publish.cjs',
);
if (!fs.existsSync(adapterPath)) {
  throw new Error(
    '找不到 Manus Instagram adapter。mamasan-lab 與 Manus 必須放在同一個 Fourth-Life 目錄下；預期位置：'
      + adapterPath,
  );
}
const adapter = require(adapterPath);

module.exports = adapter;

if (require.main === module) {
  console.error('此入口已退役：客戶工作區不得直接持有憑證或繞過核准封套發布。');
  console.error('請從 Manus/tools/social-publishing 使用 social.mjs new → prepare → approve → claim → publish。');
  process.exitCode = 1;
}
