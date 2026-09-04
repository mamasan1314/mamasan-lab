#!/usr/bin/env node
'use strict';

// Compatibility entry point only.
// The canonical Instagram publishing adapter lives in Manus. Keeping this shim preserves the
// existing `npm run instagram:publish` command without leaving a second implementation here.

const path = require('node:path');

const adapterPath = path.resolve(
  __dirname,
  '..', '..', '..', '..', '..', '..',
  'Manus', 'tools', 'social-publishing', 'platforms', 'instagram', 'adapter',
  'scripts', 'instagram-publish.cjs',
);
const adapter = require(adapterPath);

function legacyArgs(args) {
  if (args.includes('--env-file')) return args;
  return ['--env-file', path.resolve(__dirname, '..', 'env'), ...args];
}

module.exports = adapter;

if (require.main === module) adapter.runCli(legacyArgs(process.argv.slice(2)));
