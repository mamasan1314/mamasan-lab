const { loadAccount, loadTool } = require('../lib/tool.cjs');

loadTool().runAuditCli(loadAccount(), process.argv);
