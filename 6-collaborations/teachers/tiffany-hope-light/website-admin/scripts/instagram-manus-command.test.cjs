'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { buildInvocation, splitProfile } = require('./instagram-manus-command.cjs');

test('Hope Light profile 只翻成 Manus 的 talent/channel，不接觸 Vault', () => {
  const invocation = buildInvocation('stats', ['--profile', 'hopelight', '--tsv'], {
    manusCli: 'C:\\fixture\\Manus\\social.mjs',
  });
  assert.deepEqual(invocation.args.slice(1), [
    'stats', '--talent', 'tiffany', '--channel', 'instagram-hopelight-ig', '--tsv',
  ]);
  assert.doesNotMatch(JSON.stringify(invocation), /token|secret|vault:/iu);
});

test('Moment profile 指到自己的 channel', () => {
  const invocation = buildInvocation('capabilities', ['--profile', 'moment'], {
    manusCli: 'C:\\fixture\\Manus\\social.mjs',
  });
  assert.ok(invocation.args.includes('instagram-hopelight-moment'));
});

test('相容層不猜預設帳號，也不把 Darren 帳號帶回客戶 repo', () => {
  assert.throws(() => splitProfile([]), /請明示/u);
  assert.throws(() => splitProfile(['--profile', 'darrenfiy']), /只轉接 hopelight 與 moment/u);
  assert.throws(() => splitProfile(['--profile', 'hopelight', '--profile', 'moment']), /請明示一個/u);
  assert.throws(
    () => splitProfile(['--profile', 'hopelight', '--talent', 'darrenfiy', '--channel', 'instagram']),
    /不能從客戶工作區覆寫/u,
  );
  assert.throws(
    () => splitProfile(['--profile', 'hopelight', '--env-file', 'somewhere']),
    /不能從客戶工作區覆寫/u,
  );
});
