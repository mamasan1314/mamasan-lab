#!/usr/bin/env node

const path = require('node:path');
const {
  DEFAULT_CREDENTIAL_FILE,
  inspectInstagramAccount,
  loadInstagramCredentials,
} = require('../lib/instagram-session.cjs');

function optionValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const credentialFile = path.resolve(
    optionValue(args, '--credential') ||
      process.env.INSTAGRAM_CREDENTIAL_FILE ||
      DEFAULT_CREDENTIAL_FILE,
  );
  const visible = args.includes('--visible');
  const waitForVerification = args.includes('--wait-for-verification');
  const browserPath = optionValue(args, '--browser');
  const profileRoot = optionValue(args, '--profile-root');
  const accounts = loadInstagramCredentials(credentialFile);
  const results = [];

  for (const account of accounts) {
    results.push(
      await inspectInstagramAccount(account, {
        browserPath,
        profileRoot,
        headless: !visible && !waitForVerification,
        waitForVerificationMs: waitForVerification ? 300000 : 0,
      }),
    );
  }

  const report = {
    auditType: 'instagram-read-only-access',
    auditedAt: new Date().toISOString(),
    constraints: {
      messagesOpened: false,
      messagesSent: false,
      commentsChanged: false,
      settingsChanged: false,
      credentialsPrinted: false,
    },
    accounts: results,
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (results.some((result) => result.login !== 'success')) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({
      auditType: 'instagram-read-only-access',
      status: 'failed-before-account-check',
      errorType: error && error.name ? String(error.name) : 'Error',
    })}\n`,
  );
  process.exitCode = 1;
});
