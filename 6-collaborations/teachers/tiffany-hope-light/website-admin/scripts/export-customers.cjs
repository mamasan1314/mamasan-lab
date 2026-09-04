// 唯讀匯出 HopeBox 的顧客與訂單資料到本機 JSON。
// 不修改網站任何資料；輸出檔含個資，固定寫進已被 Git 忽略的 crm/data/。
const fs = require('node:fs');
const path = require('node:path');
const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');

const DATA_DIR = path.resolve(__dirname, '..', 'crm', 'data');

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function emitResult(result, error = false) {
  const serialized = JSON.stringify(result, null, 2);
  (error ? console.error : console.log)(serialized);
}

// WooCommerce 的管理介面自己就是用 wc-analytics 這組 REST 端點，
// 因此帶著登入 Cookie 與 wp_rest nonce 就能唯讀查詢，不需要另外申請 API 金鑰。
async function readNonce(page, siteRoot) {
  await page.goto(`${siteRoot}/wp-admin/admin.php?page=wc-admin&path=/customers`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await page.waitForTimeout(2500);
  return page.evaluate(() => {
    const candidates = [
      window.wpApiSettings && window.wpApiSettings.nonce,
      window.wcSettings && window.wcSettings.nonce,
      window.wcSettings && window.wcSettings.admin && window.wcSettings.admin.nonce,
    ];
    return candidates.find((value) => typeof value === 'string' && value) || null;
  });
}

async function fetchAll(page, siteRoot, endpoint, nonce, extraQuery = '') {
  const collected = [];
  let pageNumber = 1;
  let totalPages = 1;

  while (pageNumber <= totalPages && pageNumber <= 50) {
    const url = `${siteRoot}/wp-json/${endpoint}?per_page=100&page=${pageNumber}${extraQuery}`;
    const result = await page.evaluate(
      async ({ requestUrl, requestNonce }) => {
        const response = await fetch(requestUrl, {
          credentials: 'include',
          headers: { 'X-WP-Nonce': requestNonce },
        });
        const text = await response.text();
        let body = null;
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
        return {
          status: response.status,
          totalPages: Number(response.headers.get('x-wp-totalpages') || 0),
          total: Number(response.headers.get('x-wp-total') || 0),
          body,
          raw: body ? null : text.slice(0, 300),
        };
      },
      { requestUrl: url, requestNonce: nonce },
    );

    if (result.status !== 200 || !Array.isArray(result.body)) {
      return { ok: false, status: result.status, detail: result.raw, items: collected };
    }

    collected.push(...result.body);
    totalPages = result.totalPages || 1;
    pageNumber += 1;
  }

  return { ok: true, items: collected };
}

function normalizeCustomer(row) {
  return {
    id: row.id ?? null,
    userId: row.user_id ?? null,
    name: row.name || '',
    username: row.username || '',
    email: row.email || '',
    phone: '',
    city: row.city || '',
    state: row.state || '',
    country: row.country || '',
    postcode: row.postcode || '',
    registered: row.date_registered || null,
    lastActive: row.date_last_active || null,
    ordersCount: row.orders_count ?? 0,
    totalSpend: Number(row.total_spend || 0),
    avgOrderValue: Number(row.avg_order_value || 0),
    isGuest: !row.user_id,
  };
}

function normalizeOrder(row) {
  const billing = row.billing || {};
  const lineItems = Array.isArray(row.line_items) ? row.line_items : [];
  return {
    id: row.id ?? null,
    number: String(row.number || row.id || ''),
    status: row.status || '',
    dateCreated: row.date_created || row.date_created_gmt || null,
    datePaid: row.date_paid || null,
    total: Number(row.total || 0),
    currency: row.currency || 'TWD',
    paymentMethod: row.payment_method_title || row.payment_method || '',
    customerId: row.customer_id ?? null,
    customerName: [billing.first_name, billing.last_name].filter(Boolean).join(' ').trim(),
    email: billing.email || '',
    phone: billing.phone || '',
    items: lineItems.map((item) => ({
      name: item.name || '',
      quantity: item.quantity ?? 0,
      total: Number(item.total || 0),
    })),
  };
}

async function main() {
  const session = await openHopeBoxAdmin({
    headless: !process.argv.includes('--visible'),
    credentialFile: argumentValue('--credential'),
    browserPath: argumentValue('--browser'),
    profileDir: argumentValue('--profile'),
  });

  const { context, page, siteRoot, loginMode } = session;
  try {
    const nonce = await readNonce(page, siteRoot);
    if (!nonce) {
      throw new Error(
        'Could not read a wp_rest nonce from the WooCommerce admin page. Try --visible to inspect.',
      );
    }

    const customers = await fetchAll(
      page,
      siteRoot,
      'wc-analytics/reports/customers',
      nonce,
      '&orderby=date_last_active&order=desc',
    );

    let orders = await fetchAll(page, siteRoot, 'wc-analytics/orders', nonce);
    let ordersEndpoint = 'wc-analytics/orders';
    if (!orders.ok || orders.items.length === 0) {
      const fallback = await fetchAll(page, siteRoot, 'wc/v3/orders', nonce, '&status=any');
      if (fallback.ok && fallback.items.length > 0) {
        orders = fallback;
        ordersEndpoint = 'wc/v3/orders';
      }
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });
    const exportedAt = new Date().toISOString();
    const payload = {
      exportedAt,
      siteRoot,
      loginMode,
      sources: { customers: 'wc-analytics/reports/customers', orders: ordersEndpoint },
      customers: customers.items.map(normalizeCustomer),
      orders: orders.items.map(normalizeOrder),
    };

    const outputFile = path.join(DATA_DIR, 'customers-export.json');
    fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    emitResult({
      ok: true,
      loginMode,
      exportedAt,
      outputFile,
      customers: {
        ok: customers.ok,
        count: payload.customers.length,
        guests: payload.customers.filter((entry) => entry.isGuest).length,
        detail: customers.ok ? null : customers.detail,
      },
      orders: {
        ok: orders.ok,
        endpoint: ordersEndpoint,
        count: payload.orders.length,
        detail: orders.ok ? null : orders.detail,
      },
    });
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  emitResult(
    {
      ok: false,
      error: String(error.message || error).replace(/\s+/gu, ' ').trim().slice(0, 800),
    },
    true,
  );
  process.exitCode = 1;
});
