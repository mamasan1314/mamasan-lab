'use strict';

// Compatibility facade only. Generic Instagram Graph API mechanics live in Manus.

const path = require('node:path');

const adapterPath = path.resolve(
  __dirname,
  '..', '..', '..', '..', '..', '..',
  'Manus', 'tools', 'social-publishing', 'platforms', 'instagram', 'adapter',
  'lib', 'instagram-api.cjs',
);
const adapter = require(adapterPath);
const DEFAULT_ENV_FILE = path.resolve(__dirname, '..', 'env');

function loadApiConfig(options = {}) {
  return adapter.loadApiConfig({ envFile: DEFAULT_ENV_FILE, ...options });
}

module.exports = {
  ...adapter,
  DEFAULT_ENV_FILE,
  loadApiConfig,
};
