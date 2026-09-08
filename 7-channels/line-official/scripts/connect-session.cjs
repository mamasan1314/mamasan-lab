const { loadAccount, loadTool } = require('../lib/tool.cjs');

loadTool().runConnect(loadAccount()).catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: String(error.message || error).replace(/\s+/gu, ' ').trim(),
  }, null, 2));
  process.exitCode = 1;
});
