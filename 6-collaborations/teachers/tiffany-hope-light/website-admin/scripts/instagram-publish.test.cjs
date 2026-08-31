'use strict';

// 離線測試。只驗證結果檔的形狀與安全性質，不連線、不發布。

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createResultWriter, safeErrorClass } = require('./instagram-publish.cjs');

function tempPath() {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'ig-result-')),
    'result.json',
  );
}

test('沒有 --result-json 時不寫任何檔案', () => {
  const writer = createResultWriter(null);
  assert.equal(writer.enabled, false);
  writer.update({ stage: 'published', mediaId: '1' });
  assert.equal(writer.state.stage, 'published');
});

test('結果檔是完整且可解析的 JSON，且不留暫存檔', () => {
  const target = tempPath();
  const writer = createResultWriter(target);
  writer.update({ stage: 'container_created', containerId: '123' });
  const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.stage, 'container_created');
  assert.equal(parsed.containerId, '123');
  assert.ok(Date.parse(parsed.updatedAt));
  const leftovers = fs.readdirSync(path.dirname(target)).filter((name) => name.endsWith('.tmp'));
  assert.deepEqual(leftovers, []);
});

test('結果檔沒有任何機密欄位', () => {
  const target = tempPath();
  const writer = createResultWriter(target);
  writer.update({ stage: 'published', mediaId: '9', permalink: 'https://www.instagram.com/p/x/' });
  const raw = fs.readFileSync(target, 'utf8');
  for (const forbidden of ['accessToken', 'access_token', 'appSecret', 'app_secret', 'Bearer', 'cookie']) {
    assert.equal(raw.includes(forbidden), false, forbidden + ' 不得出現在結果檔');
  }
});

test('送出後結果遺失會被分類為 publish_outcome_unknown，不是失敗', () => {
  const writer = createResultWriter(null);
  writer.update({ stage: 'publishing', publishAttempted: true });
  assert.equal(safeErrorClass(writer.state), 'publish_outcome_unknown');
});

test('尚未送出的失敗依容器是否建立分類', () => {
  const before = createResultWriter(null);
  assert.equal(safeErrorClass(before.state), 'failed_before_container');
  const after = createResultWriter(null);
  after.update({ containerId: '5' });
  assert.equal(safeErrorClass(after.state), 'failed_after_container');
});

test('已取得 media ID 就不再算不確定', () => {
  const writer = createResultWriter(null);
  writer.update({ publishAttempted: true, mediaId: '77' });
  assert.notEqual(safeErrorClass(writer.state), 'publish_outcome_unknown');
});

test('require 這個模組不會觸發任何網路動作', () => {
  const source = fs.readFileSync(path.join(__dirname, 'instagram-publish.cjs'), 'utf8');
  assert.ok(source.includes('if (require.main === module)'));
});
