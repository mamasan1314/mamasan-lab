// 解析共用的 line-oa 工具在哪裡，並在缺件時明確報錯。
//
// 這個資料夾不保存登入流程，只保存「哪一個帳號」。通用能力在 Manus。

const fs = require('node:fs');
const path = require('node:path');

const HERE = path.resolve(__dirname, '..');

function readJson(file, what) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`讀不到${what}（${file}）：${error.message}`);
  }
}

function resolveToolRoot() {
  const override = process.env.LINE_OA_TOOL_ROOT;
  if (override) return path.resolve(override);
  const workspace = readJson(path.join(HERE, 'workspace.json'), ' workspace.json');
  if (!workspace.lineOaToolRoot) {
    throw new Error('workspace.json 缺少 lineOaToolRoot。');
  }
  return path.resolve(HERE, workspace.lineOaToolRoot);
}

function loadTool() {
  const root = resolveToolRoot();
  if (!fs.existsSync(path.join(root, 'index.cjs'))) {
    throw new Error(
      `找不到共用的 line-oa 工具：${root}\n`
      + '若 Manus 不在預設位置，用環境變數 LINE_OA_TOOL_ROOT 指定。',
    );
  }
  if (!fs.existsSync(path.join(root, 'node_modules', 'playwright-core'))) {
    throw new Error(
      '共用工具還沒安裝相依套件。先執行一次：\n'
      + `    cd ${root}\n`
      + '    npm ci',
    );
  }
  return require(path.join(root, 'index.cjs'));
}

function loadAccount() {
  return readJson(path.join(HERE, 'account.json'), '帳號描述檔 account.json');
}

module.exports = { loadAccount, loadTool, resolveToolRoot };
