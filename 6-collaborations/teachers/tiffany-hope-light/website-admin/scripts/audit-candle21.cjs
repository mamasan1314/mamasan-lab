// Read-only baseline. Never emit raw HTML, API responses, nonces or customer data.
const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');

async function main() {
  const { context, page, siteRoot } = await openHopeBoxAdmin();
  const report = { checkedAt: new Date().toISOString(), mode: 'read-only', checks: {} };
  try {
    for (const [key, route] of Object.entries({
      status: 'admin.php?page=wc-status', plugins: 'plugins.php',
      themes: 'themes.php', upload: 'plugin-install.php?tab=upload',
      shipping: 'admin.php?page=wc-settings&tab=shipping',
      payments: 'admin.php?page=wc-settings&tab=checkout',
      features: 'admin.php?page=wc-settings&tab=advanced&section=features',
      snippets: 'admin.php?page=wpcode',
      checkoutPages: 'admin.php?page=wc-settings&tab=advanced',
    })) {
      try {
        const response = await page.goto(`${siteRoot}/wp-admin/${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
        report.checks[key] = await page.evaluate(({ key, status }) => {
          const clean = s => (s || '').replace(/\s+/gu, ' ').trim();
          const out = { httpStatus: status };
          if (key === 'status') {
            out.environment = [...document.querySelectorAll('table tr')].map(row => {
              const cells = row.querySelectorAll('td');
              return { label: clean(cells[0]?.textContent), value: clean(cells[cells.length - 1]?.textContent) };
            }).filter(r => /^(WordPress|WooCommerce|PHP|WC|Child theme|子佈景|佈景主題|主題|HPOS|Order datastore|訂單資料儲存|頁面快取|External object cache)/iu.test(r.label)
              && !/URL|路徑|目錄|資料庫|Database|prefix/iu.test(r.label));
          }
          if (key === 'plugins') out.plugins = [...document.querySelectorAll('#the-list tr')].map(r => ({
            name: clean(r.querySelector('.plugin-title strong')?.textContent), active: r.classList.contains('active'),
            version: clean(r.querySelector('.plugin-version-author-uri')?.textContent).match(/(?:Version|版本)\s*([\d.]+)/u)?.[1] || '',
          })).filter(r => r.name);
          if (key === 'upload') out.formAvailable = !!document.querySelector('#pluginzip');
          if (key === 'themes') out.themes = [...document.querySelectorAll('.theme')].map(r => ({ name: clean(r.querySelector('.theme-name')?.textContent), active: r.classList.contains('active') }));
          if (key === 'shipping') out.zoneCount = document.querySelectorAll('.wc-shipping-zone-name').length;
          if (key === 'payments') out.gateways = [...document.querySelectorAll('tr[data-gateway_id]')].map(r => ({ id: r.dataset.gateway_id, enabled: !!r.querySelector('.woocommerce-input-toggle--enabled') }));
          if (key === 'features') out.features = [...document.querySelectorAll('input[type=checkbox],input[type=radio]')].filter(e => /hpos|custom_orders|attribution/iu.test(e.name + e.id)).map(e => ({ name: e.name, value: e.value, checked: e.checked }));
          if (key === 'snippets') out.snippets = [...document.querySelectorAll('.wp-list-table tbody tr')].map(r => ({ name: clean(r.querySelector('.row-title')?.textContent), id: r.querySelector('input[type=checkbox]')?.value })).filter(r => r.name);
          if (key === 'checkoutPages') {
            out.pages = [...document.querySelectorAll('select[id$="_page_id"]')].map(e => ({ field: e.id, id: Number(e.value) }));
            out.hostingLinks = [...document.querySelectorAll('#adminmenu a')].filter(e => /主機|備份|Backup|Hosting|WPCode|程式碼片段/iu.test(e.textContent)).map(e => ({ label: clean(e.textContent), url: e.href.replace(/([?&])_wpnonce=[^&]*/gu, '') }));
          }
          return out;
        }, { key, status: response?.status() });
      } catch { report.checks[key] = { error: 'Read unavailable; no page content recorded.' }; }
    }
    report.api = await page.evaluate(async () => {
      const nonce = window.wpApiSettings?.nonce;
      if (!nonce) return { available: false };
      const result = {};
      for (const route of ['payment_gateways', 'shipping/zones']) {
        const r = await fetch('/wp-json/wc/v3/' + route, { headers: { 'X-WP-Nonce': nonce } });
        if (!r.ok) { result[route] = { status: r.status }; continue; }
        const body = await r.json();
        result[route] = body.map(row => route === 'payment_gateways' ? { id: row.id, title: row.title, enabled: row.enabled } : { id: row.id, name: row.name });
      }
      const ids = [...document.querySelectorAll('select[id$="_page_id"]')].filter(e => /cart|checkout/u.test(e.id)).map(e => ({ field: e.id, id: Number(e.value) }));
      result.checkoutPages = [];
      for (const {field, id} of ids) {
        const r = await fetch('/wp-json/wp/v2/pages/' + id + '?context=edit', { headers: { 'X-WP-Nonce': nonce } });
        if (!r.ok) { result.checkoutPages.push({ field, id, status: r.status }); continue; }
        const p = await r.json(); const content = p.content?.raw || '';
        result.checkoutPages.push({ field, id, classicCart: content.includes('[woocommerce_cart]'), classicCheckout: content.includes('[woocommerce_checkout]'), blockCart: content.includes('wp:woocommerce/cart'), blockCheckout: content.includes('wp:woocommerce/checkout') });
      }
      return result;
    });
    console.log(JSON.stringify(report, null, 2));
  } finally { await context.close(); }
}
main().catch(() => { console.error('Candle21 audit could not complete; no sensitive error details recorded.'); process.exitCode = 1; });
