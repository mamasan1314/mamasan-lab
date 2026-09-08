// 相容入口：登入流程已抽到 Manus/tools/line-oa，這裡只綁定「哪一個帳號」。
//
// 保留這個檔名是因為 README 與交接文件都指向它。實作不在這裡 ——
// 通用能力只維護一份，見 Manus/tools/line-oa/README.md。

const { loadAccount, loadTool } = require('./tool.cjs');

const account = loadAccount();
const tool = loadTool();

module.exports = {
  ACCOUNT_ID: account.accountId,
  DEFAULT_ACCOUNT_URL: tool.accountUrl(account.accountId),
  MANAGER_ORIGIN: tool.MANAGER_ORIGIN,
  account,
  defaultProfileDir: () => tool.defaultProfileDir(account),
  findBrowser: tool.findBrowser,
  isAuthenticatedAccountPage: (page) => tool.isAuthenticatedAccountPage(page, account.accountId),
  openLineOfficialAccountManager: (options = {}) =>
    tool.openLineOfficialAccountManager(account, options),
  waitForAuthenticatedAccountPage: (page, timeoutMs) =>
    tool.waitForAuthenticatedAccountPage(page, account.accountId, timeoutMs),
};
