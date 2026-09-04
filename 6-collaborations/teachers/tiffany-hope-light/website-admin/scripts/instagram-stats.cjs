#!/usr/bin/env node

// 唯讀成效盤點：讀取貼文的瀏覽、觸及與互動數。
//
// 刻意不讀的東西（這是界線，不是還沒做）：
//   * 留言內容與留言者身分 —— 只取 comments_count 這個數字。
//   * 私訊。
//   * 任何可識別個人的欄位。
// 理由：這支工具的產出會進公司 repo 當基準紀錄。一旦帶進留言原文，
// 就是把顧客個資 commit 進 Git，而 Git 歷史很難事後清乾淨。
// 要看留言內容請開 Instagram App；那是人的工作，不是這支腳本的。
//
// 不發布、不修改、不建立媒體容器，也不印出權杖。

const { fetchAccountIdentity, graphGet, loadApiConfig } = require('../lib/instagram-api.cjs');

const GRAPH_HOST = 'https://graph.instagram.com';

// 逐篇洞察。同平台不同 media_product_type 支援的 metric 不同，
// 因此先要一整組，被拒就退回最小集合，再不行就標「?」而不是猜 0。
const METRICS_FULL = ['views', 'reach', 'total_interactions', 'saved', 'shares'];
const METRICS_MINIMAL = ['views', 'reach'];

function optionValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function number(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : '?';
}

async function fetchAllMedia(config) {
  const fields = [
    'id',
    'media_type',
    'media_product_type',
    'timestamp',
    'permalink',
    'like_count',
    'comments_count',
    'caption',
  ].join(',');

  let next = `${GRAPH_HOST}/me/media?limit=50&fields=${encodeURIComponent(fields)}`;
  const collected = [];

  // 分頁要走完。只看第一頁在貼文數超過 25 篇之後會安靜地少算，
  // 而少算出來的數字看起來完全正常 —— 這正是最難發現的一種錯。
  while (next && collected.length < 1000) {
    const page = await graphGetAbsolute(next, config);
    collected.push(...(page.data || []));
    next = page.paging?.next || null;
  }
  return collected;
}

async function graphGetAbsolute(url, config) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    const error = new Error(body.error?.message || `HTTP ${response.status}`);
    error.apiCode = body.error?.code;
    throw error;
  }
  return body;
}

async function fetchInsights(mediaId, config, metrics) {
  // metric 是查詢字串參數而不是 fields，因此不能走 lib 的 graphGet。
  const url = `${GRAPH_HOST}/${mediaId}/insights?metric=${metrics.join(',')}`;
  const page = await graphGetAbsolute(url, config);
  const values = {};
  for (const entry of page.data || []) {
    const series = entry.values?.[0]?.value;
    values[entry.name] = series !== undefined ? series : entry.total_value?.value;
  }
  return values;
}

async function insightsWithFallback(media, config) {
  try {
    return await fetchInsights(media.id, config, METRICS_FULL);
  } catch {
    try {
      return await fetchInsights(media.id, config, METRICS_MINIMAL);
    } catch (error) {
      return { _unavailable: error.message };
    }
  }
}

function summarise(rows) {
  const totals = { posts: rows.length, views: 0, reach: 0, likes: 0, comments: 0, saved: 0, shares: 0 };
  const byMonth = new Map();

  for (const row of rows) {
    for (const key of ['views', 'reach', 'likes', 'comments', 'saved', 'shares']) {
      if (typeof row[key] === 'number') totals[key] += row[key];
    }
    const month = row.date.slice(0, 7);
    const bucket = byMonth.get(month) || { month, posts: 0, views: 0, comments: 0 };
    bucket.posts += 1;
    if (typeof row.views === 'number') bucket.views += row.views;
    if (typeof row.comments === 'number') bucket.comments += row.comments;
    byMonth.set(month, bucket);
  }
  return { totals, months: [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)) };
}

async function main() {
  const args = process.argv.slice(2);
  const asTsv = args.includes('--tsv');
  const config = loadApiConfig({ profile: optionValue(args, '--profile') });

  const identity = await fetchAccountIdentity(config);
  const profile = await graphGet('/me', {
    config,
    fields: 'username,followers_count,follows_count,media_count',
  }).catch(() => ({}));

  const media = await fetchAllMedia(config);
  const rows = [];
  for (const item of media) {
    const insight = await insightsWithFallback(item, config);
    rows.push({
      date: String(item.timestamp || '').slice(0, 10),
      type: item.media_product_type || item.media_type,
      views: insight.views,
      reach: insight.reach,
      likes: item.like_count,
      comments: item.comments_count,
      saved: insight.saved,
      shares: insight.shares,
      permalink: item.permalink,
      // 貼文文案是品牌自己寫的，不是顧客資料；只留單行開頭供辨認。
      lead: String(item.caption || '').replace(/\s+/gu, ' ').slice(0, 40),
    });
  }

  const { totals, months } = summarise(rows);

  if (asTsv) {
    console.log(['date', 'type', 'views', 'reach', 'likes', 'comments', 'saved', 'shares', 'permalink', 'lead'].join('\t'));
    for (const r of rows) {
      console.log([r.date, r.type, r.views ?? '?', r.reach ?? '?', r.likes ?? '?', r.comments ?? '?', r.saved ?? '?', r.shares ?? '?', r.permalink, r.lead].join('\t'));
    }
    return;
  }

  console.log(
    config.isProduction
      ? '*** 正式帳號 PRODUCTION — 這是真實客戶帳號（唯讀）***'
      : '--- 沙盒帳號 SANDBOX ---',
  );
  console.log(`帳號        : @${identity.username}（${identity.account_type}）`);
  console.log(`追蹤者      : ${number(profile.followers_count)}　追蹤中：${number(profile.follows_count)}`);
  console.log(`貼文數      : ${identity.media_count}（本次讀到 ${rows.length} 篇）`);
  if (rows.length < (identity.media_count ?? 0)) {
    console.log('注意        : 讀到的篇數少於帳號回報的貼文數，可能有分頁未走完。');
  }
  console.log('');

  console.log('逐篇成效（新到舊）');
  console.log('日期        類型      瀏覽      觸及      讚     留言   收藏   分享');
  console.log('--------------------------------------------------------------------');
  for (const r of rows) {
    console.log(
      `${r.date}  ${String(r.type).padEnd(8)}${number(r.views).padStart(8)}${number(r.reach).padStart(10)}` +
        `${number(r.likes).padStart(8)}${number(r.comments).padStart(7)}${number(r.saved).padStart(7)}${number(r.shares).padStart(7)}  ${r.lead}`,
    );
  }
  console.log('');

  console.log('月彙總');
  console.log('月份      篇數    總瀏覽      單篇平均    留言');
  console.log('----------------------------------------------');
  for (const m of months) {
    const average = m.posts ? Math.round(m.views / m.posts) : 0;
    console.log(
      `${m.month}${String(m.posts).padStart(7)}${number(m.views).padStart(11)}${number(average).padStart(12)}${number(m.comments).padStart(8)}`,
    );
  }
  console.log('');

  console.log('合計');
  console.log('----------------------------------------------');
  console.log(`貼文 ${totals.posts}　瀏覽 ${number(totals.views)}　觸及 ${number(totals.reach)}`);
  console.log(`讚 ${number(totals.likes)}　留言 ${number(totals.comments)}　收藏 ${number(totals.saved)}　分享 ${number(totals.shares)}`);
  console.log('');
  console.log('數字是查詢當下的快照。瀏覽與觸及會隨時間持續累加，跨日比較請以本次執行時間為準。');
}

main().catch((error) => {
  console.error(`成效盤點失敗：${error.message}`);
  if (error.apiCode) console.error(`Meta 錯誤代碼：${error.apiCode}`);
  if (error.apiCode === 190) console.error('代碼 190 通常代表權杖無效或已過期，需要重新產生。');
  process.exitCode = 1;
});
