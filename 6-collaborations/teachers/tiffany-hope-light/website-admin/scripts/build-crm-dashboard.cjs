// 讀 crm/data/customers-export.json，產生一份純本機、單一檔案的 CRM 看板。
// 產出的 HTML 含個資，寫成 *.local.html，已被 Git 忽略。
const fs = require('node:fs');
const path = require('node:path');

const CRM_DIR = path.resolve(__dirname, '..', 'crm');
const INPUT = path.join(CRM_DIR, 'data', 'customers-export.json');
const OUTPUT = path.join(CRM_DIR, 'hopelight-crm.local.html');

const STATUS_LABELS = {
  pending: '待付款',
  'on-hold': '待核款',
  processing: '處理中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
  failed: '失敗',
};

function readExport() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`找不到匯出檔：${INPUT}。請先執行 npm run crm:export`);
  }
  return JSON.parse(fs.readFileSync(INPUT, 'utf8'));
}

// 顧客主檔用 Email／電話合併訂單，補上 WooCommerce 顧客表看不到的訪客結帳。
function buildPeople(data) {
  const people = new Map();
  const keyOf = (email, phone, name) =>
    (email || '').toLowerCase() || (phone || '') || `name:${name}`;

  for (const customer of data.customers) {
    const key = keyOf(customer.email, customer.phone, customer.name);
    people.set(key, {
      name: customer.name || '（未填姓名）',
      email: customer.email,
      phone: customer.phone,
      isGuest: customer.isGuest,
      lastActive: customer.lastActive,
      orders: [],
      source: 'woo-customer',
    });
  }

  for (const order of data.orders) {
    const key = keyOf(order.email, order.phone, order.customerName);
    if (!people.has(key)) {
      people.set(key, {
        name: order.customerName || '（未填姓名）',
        email: order.email,
        phone: order.phone,
        isGuest: !order.customerId,
        lastActive: order.dateCreated,
        orders: [],
        source: 'order-only',
      });
    }
    const person = people.get(key);
    if (!person.email && order.email) person.email = order.email;
    if (!person.phone && order.phone) person.phone = order.phone;
    if (!person.name || person.name === '（未填姓名）') {
      person.name = order.customerName || person.name;
    }
    person.orders.push(order);
  }

  return Array.from(people.values())
    .map((person) => {
      const paid = person.orders.filter((order) =>
        ['completed', 'processing'].includes(order.status),
      );
      const openOrders = person.orders.filter((order) =>
        ['on-hold', 'pending'].includes(order.status),
      );
      const dates = person.orders.map((order) => order.dateCreated).filter(Boolean).sort();
      return {
        ...person,
        orderCount: person.orders.length,
        paidTotal: paid.reduce((sum, order) => sum + order.total, 0),
        openCount: openOrders.length,
        openTotal: openOrders.reduce((sum, order) => sum + order.total, 0),
        firstOrder: dates[0] || null,
        lastOrder: dates[dates.length - 1] || null,
        items: Array.from(
          new Set(person.orders.flatMap((order) => order.items.map((item) => item.name))),
        ),
      };
    })
    .sort((a, b) => String(b.lastOrder || '').localeCompare(String(a.lastOrder || '')));
}

function money(value) {
  return `NT$${Math.round(value).toLocaleString('en-US')}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/gu, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]),
  );
}

function shortDate(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

function render(data, people) {
  const orders = data.orders.slice().sort((a, b) =>
    String(b.dateCreated || '').localeCompare(String(a.dateCreated || '')),
  );
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  const paidTotal = orders
    .filter((order) => ['completed', 'processing'].includes(order.status))
    .reduce((sum, order) => sum + order.total, 0);
  const openOrders = orders.filter((order) => ['on-hold', 'pending'].includes(order.status));
  const openTotal = openOrders.reduce((sum, order) => sum + order.total, 0);
  const cancelled = orders.filter((order) => order.status === 'cancelled').length;

  const productTally = new Map();
  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items) {
      const current = productTally.get(item.name) || { qty: 0, total: 0 };
      current.qty += item.quantity;
      current.total += item.total;
      productTally.set(item.name, current);
    }
  }
  const products = Array.from(productTally.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total);

  const statusPill = (status) =>
    `<span class="pill pill-${escapeHtml(status)}">${escapeHtml(
      STATUS_LABELS[status] || status,
    )}</span>`;

  const todoRows = openOrders
    .map(
      (order) => `<tr>
        <td>${shortDate(order.dateCreated)}</td>
        <td class="strong">${escapeHtml(order.customerName)}</td>
        <td>${escapeHtml(order.items.map((item) => item.name).join('、'))}</td>
        <td class="num">${money(order.total)}</td>
        <td>${escapeHtml(order.paymentMethod)}</td>
        <td>${statusPill(order.status)}</td>
      </tr>`,
    )
    .join('\n');

  const peopleRows = people
    .map(
      (person) => `<tr data-search="${escapeHtml(
        [person.name, person.email, person.phone, person.items.join(' ')].join(' ').toLowerCase(),
      )}">
        <td class="strong">${escapeHtml(person.name)}${
          person.isGuest ? '<span class="tag">訪客結帳</span>' : ''
        }</td>
        <td class="contact">
          ${person.email ? `<a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a><br>` : ''}
          ${person.phone ? `<span class="mono">${escapeHtml(person.phone)}</span>` : ''}
        </td>
        <td class="num">${person.orderCount}</td>
        <td class="num">${money(person.paidTotal)}</td>
        <td class="num">${person.openCount ? money(person.openTotal) : '—'}</td>
        <td>${shortDate(person.lastOrder)}</td>
        <td class="items">${escapeHtml(person.items.join('、')) || '—'}</td>
      </tr>`,
    )
    .join('\n');

  const orderRows = orders
    .map(
      (order) => `<tr data-status="${escapeHtml(order.status)}" data-search="${escapeHtml(
        [order.number, order.customerName, order.email, order.phone,
          order.items.map((item) => item.name).join(' ')].join(' ').toLowerCase(),
      )}">
        <td class="mono">#${escapeHtml(order.number)}</td>
        <td>${shortDate(order.dateCreated)}</td>
        <td class="strong">${escapeHtml(order.customerName)}</td>
        <td class="items">${escapeHtml(order.items.map((item) => `${item.name} ×${item.quantity}`).join('、'))}</td>
        <td class="num">${money(order.total)}</td>
        <td>${escapeHtml(order.paymentMethod)}</td>
        <td>${statusPill(order.status)}</td>
      </tr>`,
    )
    .join('\n');

  const productRows = products
    .map(
      (product) => `<tr>
        <td>${escapeHtml(product.name)}</td>
        <td class="num">${product.qty}</td>
        <td class="num">${money(product.total)}</td>
      </tr>`,
    )
    .join('\n');

  const statusBar = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([status, count]) =>
        `<div class="bar-row"><span>${statusPill(status)}</span><div class="bar"><i style="width:${
          (count / orders.length) * 100
        }%" class="bar-${escapeHtml(status)}"></i></div><b>${count}</b></div>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>希望之光 CRM 看板（本機）</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&family=Noto+Sans+TC:wght@300;400;500&family=Noto+Serif+TC:wght@500&display=swap">
<style>
:root{
  --ground:#F1EFF3;--surface:#FBFAFC;--ink:#201C2E;--muted:#6B6480;--line:#DFDAE6;
  --gold:#9E6A1C;--good:#2F7A55;--info:#2B5F9E;--warn:#B4530C;--crit:#9E3434;
  --good-bg:#E4F0E9;--info-bg:#E3EBF6;--warn-bg:#F8E8DC;--crit-bg:#F5E2E2;--muted-bg:#E8E5EC;
  color-scheme:light;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#141120;--surface:#1C1829;--ink:#EAE6F0;--muted:#9A93AC;--line:#2E2942;
  --gold:#D9A24C;--good:#6BC095;--info:#7EA8E0;--warn:#E8934F;--crit:#E28080;
  --good-bg:#1E3A2C;--info-bg:#1E2C42;--warn-bg:#3A2718;--crit-bg:#3A1F1F;--muted-bg:#2A2538;
  color-scheme:dark;
}}
:root[data-theme="dark"]{
  --ground:#141120;--surface:#1C1829;--ink:#EAE6F0;--muted:#9A93AC;--line:#2E2942;
  --gold:#D9A24C;--good:#6BC095;--info:#7EA8E0;--warn:#E8934F;--crit:#E28080;
  --good-bg:#1E3A2C;--info-bg:#1E2C42;--warn-bg:#3A2718;--crit-bg:#3A1F1F;--muted-bg:#2A2538;
  color-scheme:dark;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);
  font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;
  font-weight:300;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:1160px;margin:0 auto;padding:2.5rem 1.5rem 5rem}
header{display:flex;flex-wrap:wrap;gap:1rem;align-items:baseline;justify-content:space-between;margin-bottom:2rem}
h1{font-family:"Noto Serif TC",serif;font-weight:500;font-size:1.75rem;margin:0}
.stamp{font-family:"Jost",sans-serif;font-size:.8125rem;color:var(--muted);letter-spacing:.04em}
.local{display:inline-block;font-family:"Jost",sans-serif;font-size:.6875rem;letter-spacing:.12em;
  text-transform:uppercase;color:var(--crit);border:1px solid var(--crit);border-radius:999px;padding:.1rem .55rem;margin-left:.5rem}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:1px;
  background:var(--line);border:1px solid var(--line);border-radius:6px;overflow:hidden;margin-bottom:2.5rem}
.tile{background:var(--surface);padding:1.1rem 1.25rem}
.tile .k{font-family:"Jost",sans-serif;font-size:.6875rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:block}
.tile .v{font-family:"Jost",sans-serif;font-size:1.75rem;font-variant-numeric:tabular-nums;display:block;line-height:1.3}
.tile .s{font-size:.75rem;color:var(--muted)}
.tile.alert .v{color:var(--warn)}
section{margin-bottom:2.5rem}
h2{font-family:"Noto Serif TC",serif;font-weight:500;font-size:1.125rem;margin:0 0 .35rem;
  display:flex;align-items:baseline;gap:.6rem}
h2 small{font-family:"Jost",sans-serif;font-size:.75rem;color:var(--muted);font-weight:400}
.hint{color:var(--muted);font-size:.8125rem;margin:0 0 1rem}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:6px;overflow:hidden}
.table-wrap{overflow-x:auto}
table{border-collapse:collapse;width:100%;min-width:44rem;font-size:.8125rem}
th,td{padding:.7rem .9rem;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
tbody tr:last-child td{border-bottom:0}
th{font-family:"Jost",sans-serif;font-weight:500;font-size:.6875rem;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);white-space:nowrap;background:var(--ground)}
td.num,th.num{text-align:right;font-family:"Jost",sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap}
.strong{font-weight:500;white-space:nowrap}
.mono{font-family:"Jost",sans-serif;font-variant-numeric:tabular-nums}
.contact{font-size:.75rem;line-height:1.6}
.contact a{color:var(--info);text-decoration:none}
.contact a:hover{text-decoration:underline}
.items{color:var(--muted);max-width:22rem}
.tag{display:inline-block;font-family:"Jost",sans-serif;font-size:.625rem;letter-spacing:.08em;
  color:var(--muted);background:var(--muted-bg);border-radius:3px;padding:.05rem .4rem;margin-left:.4rem;font-weight:400}
.pill{display:inline-block;font-size:.6875rem;padding:.15rem .6rem;border-radius:999px;white-space:nowrap}
.pill-completed{background:var(--good-bg);color:var(--good)}
.pill-processing{background:var(--info-bg);color:var(--info)}
.pill-on-hold{background:var(--warn-bg);color:var(--warn)}
.pill-pending{background:var(--warn-bg);color:var(--warn)}
.pill-cancelled{background:var(--muted-bg);color:var(--muted)}
.pill-refunded,.pill-failed{background:var(--crit-bg);color:var(--crit)}
.bars{padding:1.25rem}
.bar-row{display:grid;grid-template-columns:5.5rem 1fr 2rem;align-items:center;gap:.75rem;margin-bottom:.5rem}
.bar{height:.5rem;background:var(--muted-bg);border-radius:999px;overflow:hidden}
.bar i{display:block;height:100%;border-radius:999px;background:var(--muted)}
.bar-completed{background:var(--good) !important}
.bar-processing{background:var(--info) !important}
.bar-on-hold,.bar-pending{background:var(--warn) !important}
.bar-cancelled{background:var(--muted) !important}
.bar-row b{font-family:"Jost",sans-serif;font-variant-numeric:tabular-nums;text-align:right;font-weight:500}
.controls{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}
input[type=search]{flex:1;min-width:12rem;padding:.55rem .9rem;border:1px solid var(--line);
  border-radius:999px;background:var(--surface);color:var(--ink);font-family:inherit;font-size:.8125rem}
.chip{font-family:"Jost",sans-serif;font-size:.75rem;padding:.4rem .9rem;border:1px solid var(--line);
  border-radius:999px;background:var(--surface);color:var(--muted);cursor:pointer}
.chip[aria-pressed="true"]{border-color:var(--ink);color:var(--ink)}
:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.empty{padding:1.5rem;color:var(--muted);font-size:.8125rem}
footer{border-top:1px solid var(--line);padding-top:1.5rem;color:var(--muted);font-size:.75rem}
.split{display:grid;gap:1.5rem}
@media(min-width:880px){.split{grid-template-columns:1.15fr .85fr}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <h1>希望之光 CRM 看板<span class="local">本機檔案</span></h1>
      <p class="hint" style="margin:.25rem 0 0">資料來源：hopebox.com.tw WooCommerce｜唯讀匯出，本檔不上傳、不進 Git</p>
    </div>
    <p class="stamp">匯出時間 ${escapeHtml(data.exportedAt.replace('T', ' ').slice(0, 16))} UTC</p>
  </header>

  <div class="tiles">
    <div class="tile"><span class="k">顧客</span><span class="v">${people.length}</span><span class="s">${
      people.filter((p) => p.isGuest).length
    } 位訪客結帳</span></div>
    <div class="tile"><span class="k">訂單</span><span class="v">${orders.length}</span><span class="s">${cancelled} 筆已取消</span></div>
    <div class="tile"><span class="k">已成立金額</span><span class="v">${money(paidTotal)}</span><span class="s">已完成＋處理中</span></div>
    <div class="tile alert"><span class="k">待核款</span><span class="v">${openOrders.length}</span><span class="s">${money(openTotal)} 等待確認</span></div>
    <div class="tile"><span class="k">取消率</span><span class="v">${Math.round((cancelled / orders.length) * 100)}%</span><span class="s">${cancelled} / ${orders.length}</span></div>
  </div>

  <section>
    <h2>今天要做的事 <small>待核款與待付款</small></h2>
    <p class="hint">銀行轉帳的訂單需要人工對帳。確認入帳後把訂單改成「處理中」，客人才會收到後續通知。</p>
    <div class="panel"><div class="table-wrap">
      ${
        openOrders.length
          ? `<table>
        <thead><tr><th>日期</th><th>顧客</th><th>品項</th><th class="num">金額</th><th>付款方式</th><th>狀態</th></tr></thead>
        <tbody>${todoRows}</tbody></table>`
          : '<p class="empty">目前沒有待處理的訂單。</p>'
      }
    </div></div>
  </section>

  <div class="split">
    <section>
      <h2>訂單狀態分布</h2>
      <div class="panel"><div class="bars">${statusBar}</div></div>
    </section>
    <section>
      <h2>品項銷售 <small>不含已取消</small></h2>
      <div class="panel"><div class="table-wrap">
        <table style="min-width:0"><thead><tr><th>品項</th><th class="num">數量</th><th class="num">金額</th></tr></thead>
        <tbody>${productRows}</tbody></table>
      </div></div>
    </section>
  </div>

  <section>
    <h2>顧客主檔 <small>訂單以 Email／電話合併，含訪客結帳</small></h2>
    <div class="controls">
      <input type="search" id="peopleSearch" placeholder="搜尋姓名、Email、電話、品項…" aria-label="搜尋顧客">
    </div>
    <div class="panel"><div class="table-wrap">
      <table id="peopleTable">
        <thead><tr><th>顧客</th><th>聯絡方式</th><th class="num">訂單</th><th class="num">已成立</th><th class="num">待核款</th><th>最近訂單</th><th>買過什麼</th></tr></thead>
        <tbody>${peopleRows}</tbody>
      </table>
    </div></div>
  </section>

  <section>
    <h2>所有訂單</h2>
    <div class="controls" id="orderFilters">
      <input type="search" id="orderSearch" placeholder="搜尋訂單編號、顧客、品項…" aria-label="搜尋訂單">
      <button class="chip" data-status="all" aria-pressed="true">全部</button>
      <button class="chip" data-status="on-hold" aria-pressed="false">待核款</button>
      <button class="chip" data-status="processing" aria-pressed="false">處理中</button>
      <button class="chip" data-status="completed" aria-pressed="false">已完成</button>
      <button class="chip" data-status="cancelled" aria-pressed="false">已取消</button>
    </div>
    <div class="panel"><div class="table-wrap">
      <table id="orderTable">
        <thead><tr><th>編號</th><th>日期</th><th>顧客</th><th>品項</th><th class="num">金額</th><th>付款方式</th><th>狀態</th></tr></thead>
        <tbody>${orderRows}</tbody>
      </table>
    </div></div>
  </section>

  <footer>
    <p>這份看板是唯讀快照，不會自動更新。要拿最新資料請重跑 <span class="mono">npm run crm:refresh</span>。<br>
    修改訂單狀態、地址與付款請回 WooCommerce 後台操作——那裡才是正式主檔。</p>
  </footer>
</div>
<script>
(function(){
  function wireSearch(inputId, tableId){
    var input=document.getElementById(inputId);
    var rows=Array.prototype.slice.call(document.querySelectorAll('#'+tableId+' tbody tr'));
    if(!input) return function(){};
    var apply=function(){
      var q=input.value.trim().toLowerCase();
      rows.forEach(function(row){
        var okText=!q||(row.getAttribute('data-search')||'').indexOf(q)>-1;
        var okStatus=!row.dataset.filterHidden;
        row.style.display=(okText&&okStatus)?'':'none';
      });
    };
    input.addEventListener('input',apply);
    return apply;
  }
  wireSearch('peopleSearch','peopleTable');
  var applyOrders=wireSearch('orderSearch','orderTable');
  var chips=Array.prototype.slice.call(document.querySelectorAll('#orderFilters .chip'));
  var orderRows=Array.prototype.slice.call(document.querySelectorAll('#orderTable tbody tr'));
  chips.forEach(function(chip){
    chip.addEventListener('click',function(){
      chips.forEach(function(other){other.setAttribute('aria-pressed',String(other===chip));});
      var want=chip.getAttribute('data-status');
      orderRows.forEach(function(row){
        if(want==='all'||row.getAttribute('data-status')===want){delete row.dataset.filterHidden;}
        else{row.dataset.filterHidden='1';}
      });
      applyOrders();
    });
  });
})();
</script>
</body>
</html>
`;
}

function main() {
  const data = readExport();
  const people = buildPeople(data);
  fs.mkdirSync(CRM_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT, render(data, people), 'utf8');
  console.log(
    JSON.stringify(
      {
        ok: true,
        outputFile: OUTPUT,
        people: people.length,
        orders: data.orders.length,
        exportedAt: data.exportedAt,
      },
      null,
      2,
    ),
  );
}

main();
