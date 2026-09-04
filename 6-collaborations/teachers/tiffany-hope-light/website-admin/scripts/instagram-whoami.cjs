#!/usr/bin/env node
'use strict';

// Compatibility entry point only. Identity checks are part of the canonical Manus adapter.

const path = require('node:path');

const adapterPath = path.resolve(
  __dirname,
  '..', '..', '..', '..', '..', '..',
  'Manus', 'tools', 'social-publishing', 'platforms', 'instagram', 'adapter',
  'scripts', 'instagram-whoami.cjs',
);
const adapter = require(adapterPath);

function legacyArgs(args) {
  if (args.includes('--env-file')) return args;
  return ['--env-file', path.resolve(__dirname, '..', 'env'), ...args];
}

module.exports = adapter;

if (require.main === module) adapter.runCli(legacyArgs(process.argv.slice(2)));
