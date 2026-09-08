// Receives a short-lived Sites credential on stdin. No credential is logged or written to disk.
const { spawnSync } = require('node:child_process');
const readline = require('node:readline');
const path = require('node:path');
const cwd = path.resolve(process.argv[2]);
if (!process.stdin.isTTY || !process.stdin.setRawMode) { console.error('A terminal with echo disabled is required.'); process.exit(1); }
process.stdin.setRawMode(true);
const rl = readline.createInterface({ input: process.stdin, terminal: false });
console.log('Awaiting ephemeral source credential (terminal echo disabled).');
rl.once('line', line => {
  rl.close();
  try {
    const credential = JSON.parse(line);
    if (credential.auth_mode !== 'http_extra_header' || !credential.remote_url.startsWith('https://git.chatgpt-team.site/')) throw new Error('Unsupported source credential');
    const env = { ...process.env, GIT_CONFIG_COUNT: '2', GIT_CONFIG_KEY_0: 'http.extraHeader',
      GIT_CONFIG_VALUE_0: `Authorization: Bearer ${credential.token}`, GIT_CONFIG_KEY_1: 'credential.helper', GIT_CONFIG_VALUE_1: '', GIT_TERMINAL_PROMPT: '0' };
    for (const key of Object.keys(env)) if (key.startsWith('GIT_TRACE')) delete env[key];
    const result = spawnSync('git', ['push', credential.remote_url, `HEAD:refs/heads/${credential.branch}`], { cwd, env, encoding: 'utf8', windowsHide: true });
    delete env.GIT_CONFIG_VALUE_0; credential.token = ''; line = '';
    // Suppress Git error text as defense in depth; return only the result code.
    if (result.status !== 0) { console.error(`Sites source push failed (exit ${result.status}).`); process.exitCode = 1; }
    else { console.log('Sites source push succeeded.'); }
  } catch { console.error('Sites source push could not complete. No credential details recorded.'); process.exitCode = 1; }
});
