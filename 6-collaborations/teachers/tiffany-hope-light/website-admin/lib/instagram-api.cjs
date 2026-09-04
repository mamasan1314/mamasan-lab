'use strict';

// Compatibility facade only. Generic Instagram Graph API mechanics live in Manus.

const path = require('node:path');
const fs = require('node:fs');

const adapterPath = path.resolve(
  __dirname,
  '..', '..', '..', '..', '..', '..',
  'Manus', 'tools', 'social-publishing', 'platforms', 'instagram', 'adapter',
  'lib', 'instagram-api.cjs',
);
if (!fs.existsSync(adapterPath)) {
  throw new Error(
    '找不到 Manus Instagram adapter。mamasan-lab 與 Manus 必須放在同一個 Fourth-Life 目錄下；預期位置：'
      + adapterPath,
  );
}
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
