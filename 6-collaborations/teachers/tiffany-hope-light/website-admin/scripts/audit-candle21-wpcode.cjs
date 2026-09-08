// Read-only hook inventory. Never log or store snippet source, which may contain secrets.
const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');
(async () => {
  const { context, page, siteRoot } = await openHopeBoxAdmin();
  try {
    await page.goto(`${siteRoot}/wp-admin/admin.php?page=wpcode`, {waitUntil:'domcontentloaded'});
    const ids = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="page=wpcode-snippet-manager"]')].map(a => new URL(a.href).searchParams.get('snippet_id')).filter(id => /^\d+$/u.test(id || '')))]);
    const rows = [];
    for (const id of ids) {
      await page.goto(`${siteRoot}/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=${id}`, {waitUntil:'domcontentloaded',timeout:45000});
      const row = await page.evaluate(id => {
        const fields = [...document.querySelectorAll('textarea')].filter(e => /code/iu.test(e.name + e.id));
        const editors = [...document.querySelectorAll('.CodeMirror')].map(e => e.CodeMirror?.getValue()).filter(Boolean);
        const code = editors.length ? editors.join('\n') : fields.map(e => e.value).join('\n');
        return {id, codeRead: code.length > 0, bytes: new TextEncoder().encode(code).length,
          wooHooks: [...new Set(code.match(/\bwoocommerce_[a-z_]+\b/gu) || [])],
          stockWrites: /wc_update_product_stock|_stock_status|_manage_stock/u.test(code),
          checkoutReferences: /checkout|add_to_cart|WC\(\)->cart/iu.test(code),
          gatewayReferences: /sunpay|payment_gateways/iu.test(code),
        };
      }, id);
      rows.push(row);
    }
    console.log(JSON.stringify({checkedAt:new Date().toISOString(), mode:'read-only-pattern-inventory', notes:'Visible links only; source was not exported or logged. Pattern scan does not prove compatibility.', snippets:rows},null,2));
  } finally { await context.close(); }
})().catch(() => { console.error('WPCode inventory incomplete. No code or page content recorded.'); process.exitCode=1; });
