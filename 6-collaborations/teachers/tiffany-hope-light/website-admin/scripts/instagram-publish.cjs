#!/usr/bin/env node
'use strict';

// Compatibility entry point only.
// The canonical Instagram publishing adapter lives in Manus. Keeping this shim preserves the
// existing `npm run instagram:publish` command without leaving a second implementation here.

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

function legacyArgs(args) {
  if (args.includes('--env-file')) return args;
  return ['--env-file', path.resolve(__dirname, '..', 'env'), ...args];
}

module.exports = adapter;

if (require.main === module) adapter.runCli(legacyArgs(process.argv.slice(2)));
