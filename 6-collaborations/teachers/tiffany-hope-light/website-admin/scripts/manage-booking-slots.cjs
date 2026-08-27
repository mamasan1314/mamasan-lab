const fs = require('node:fs');
const path = require('node:path');
const { openHopeBoxAdmin } = require('../lib/hopebox-session.cjs');

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function emit(result, error = false) {
  const serialized = JSON.stringify(result, null, 2);
  const outputFile = argumentValue('--output');
  if (outputFile) {
    fs.writeFileSync(path.resolve(outputFile), `${serialized}\n`, 'utf8');
  }
  (error ? console.error : console.log)(serialized);
}

function parseTime(value) {
  const match = String(value).match(/^(\d{2}):(\d{2})$/u);
  if (!match) throw new Error(`Invalid time: ${value}`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error(`Invalid time: ${value}`);
  return hour * 60 + minute;
}

function normalizeRange(value) {
  const match = String(value).match(
    /^(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})$/u,
  );
  if (!match) throw new Error(`Invalid time range: ${value}`);
  const start = parseTime(match[1]);
  const end = parseTime(match[2]);
  if (end <= start) throw new Error(`End must be later than start: ${value}`);
  return {
    value: `${match[1]}-${match[2]}`,
    start,
    end,
  };
}

function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
}

function loadPlan(planFile) {
  if (!planFile) {
    throw new Error(
      'A plan is required. Use --plan <path-to-json> and add --apply only after reviewing the dry run.',
    );
  }
  const resolved = path.resolve(planFile);
  const plan = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  if (plan.timezone !== 'Asia/Taipei') {
    throw new Error('HopeLight booking plans must use timezone Asia/Taipei.');
  }
  const slotMinutes = Number(plan.slotMinutes || 0);
  if (!Number.isInteger(slotMinutes) || slotMinutes < 1) {
    throw new Error('plan.slotMinutes must be a positive integer.');
  }
  if (!plan.dates || typeof plan.dates !== 'object' || Array.isArray(plan.dates)) {
    throw new Error('plan.dates must be an object keyed by ISO date.');
  }

  const dates = {};
  for (const [date, rawRanges] of Object.entries(plan.dates)) {
    validateDate(date);
    if (!Array.isArray(rawRanges) || rawRanges.length < 1) {
      throw new Error(`Date ${date} must contain at least one time range.`);
    }
    const ranges = rawRanges.map(normalizeRange).sort((a, b) => a.start - b.start);
    for (let index = 0; index < ranges.length; index += 1) {
      const range = ranges[index];
      if (range.end - range.start !== slotMinutes) {
        throw new Error(
          `${date} ${range.value} is not exactly ${slotMinutes} minutes.`,
        );
      }
      if (index > 0 && ranges[index - 1].end > range.start) {
        throw new Error(`${date} contains overlapping time ranges.`);
      }
    }
    const unique = [...new Set(ranges.map((range) => range.value))];
    if (unique.length !== ranges.length) {
      throw new Error(`${date} contains duplicate time ranges.`);
    }
    dates[date] = unique;
  }

  const dateKeys = Object.keys(dates).sort();
  if (dateKeys.length < 1) throw new Error('The plan does not contain any dates.');
  const spanDays =
    (new Date(`${dateKeys.at(-1)}T12:00:00Z`) -
      new Date(`${dateKeys[0]}T12:00:00Z`)) /
    86400000;
  if (spanDays > 120) throw new Error('A single plan cannot span more than 120 days.');

  return {
    file: resolved,
    name: cleanText(plan.name || path.basename(resolved)),
    timezone: plan.timezone,
    slotMinutes,
    dates,
    pending: Array.isArray(plan.pending) ? plan.pending : [],
  };
}

async function collectAdminSchedule(page) {
  return page.locator('.jt-future-day').evaluateAll((days) => {
    const statusFromText = (text) => {
      if (text.includes('販售中')) return 'available';
      if (text.includes('已暫停')) return 'blocked';
      if (text.includes('付款保留')) return 'held';
      if (text.includes('已售完')) return 'sold';
      return 'unknown';
    };
    const schedule = {};
    for (const day of days) {
      const date = day.querySelector('input[name="booking_date"]')?.value;
      if (!date) continue;
      schedule[date] = [...day.querySelectorAll('.jt-future-times form')]
        .map((form) => {
          const action = form.querySelector('input[name="jt_action"]')?.value;
          const text = (form.querySelector('button')?.innerText || '')
            .replace(/\s+/gu, ' ')
            .trim();
          const match = text.match(/(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/u);
          if (action !== 'slot_status' || !match) return null;
          return {
            range: `${match[1]}-${match[2]}`,
            status: statusFromText(text),
          };
        })
        .filter(Boolean);
    }
    return schedule;
  });
}

function reviewExisting(planDates, adminSchedule, merge) {
  const datesToCreate = {};
  const alreadySatisfied = [];
  const conflicts = [];

  for (const [date, expected] of Object.entries(planDates)) {
    const actual = adminSchedule[date] || [];
    const available = actual
      .filter((slot) => slot.status === 'available')
      .map((slot) => slot.range)
      .sort();
    const allRanges = actual.map((slot) => slot.range).sort();
    const expectedSorted = [...expected].sort();
    const exactAvailable =
      JSON.stringify(available) === JSON.stringify(expectedSorted) &&
      JSON.stringify(allRanges) === JSON.stringify(expectedSorted);

    if (exactAvailable) {
      alreadySatisfied.push(date);
      continue;
    }
    if (actual.length === 0) {
      datesToCreate[date] = expected;
      continue;
    }
    if (merge) {
      const unavailableExpected = actual.filter(
        (slot) => expected.includes(slot.range) && slot.status !== 'available',
      );
      if (unavailableExpected.length > 0) {
        conflicts.push({ date, reason: 'expected range is not available', actual });
        continue;
      }
      const missing = expected.filter(
        (range) => !actual.some((slot) => slot.range === range),
      );
      if (missing.length > 0) datesToCreate[date] = missing;
      else alreadySatisfied.push(date);
      continue;
    }
    conflicts.push({
      date,
      reason: 'existing schedule differs from plan; rerun with --merge only if extras must be preserved',
      actual,
      expected,
    });
  }

  return { datesToCreate, alreadySatisfied, conflicts };
}

async function submitDates(page, datesToCreate) {
  const dateKeys = Object.keys(datesToCreate).sort();
  if (dateKeys.length === 0) return { submittedDates: [], notices: [] };
  const form = page.locator('form.jt-slot-builder');
  await form.locator('[name="from_date"]').fill(dateKeys[0]);
  await form.locator('[name="from_date"]').dispatchEvent('change');
  await form.locator('[name="to_date"]').fill(dateKeys.at(-1));
  await form.locator('[name="to_date"]').dispatchEvent('change');
  await page.waitForTimeout(500);

  for (const [date, ranges] of Object.entries(datesToCreate)) {
    const times = form.locator(`[name="times_by_date[${date}]"]`);
    const enabled = form.locator(`[name="dates_enabled[${date}]"]`);
    if ((await times.count()) !== 1 || (await enabled.count()) !== 1) {
      throw new Error(`The slot builder did not render ${date}.`);
    }
    await times.evaluate((node, value) => {
      node.value = value;
    }, ranges.join('\n'));
    await enabled.evaluate((node) => {
      node.value = '1';
    });
  }

  const formCount = await form.count();
  if (formCount !== 1) {
    throw new Error(
      `The slot builder disappeared before submission (${page.url()}).`,
    );
  }
  await Promise.all([
    page
      .waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 })
      .catch(() => null),
    form.evaluate((node) => node.requestSubmit()),
  ]);
  await page.waitForTimeout(500);
  const notices = (await page.locator('.notice,.updated,.error').allInnerTexts())
    .map(cleanText)
    .filter(Boolean)
    .filter((text) => /時段|建立|成功|錯誤|失敗/iu.test(text));
  return { submittedDates: dateKeys, notices };
}

async function collectPublicSchedule(page, publicUrl) {
  await page.goto(publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(
    () => typeof window.HopeBooking === 'object' && window.HopeBooking.nonce,
    null,
    { timeout: 15000 },
  );
  const response = await page.evaluate(async () => {
    const body = new URLSearchParams({
      nonce: window.HopeBooking.nonce,
      action: 'jt_booking_slots',
    });
    const raw = await fetch(window.HopeBooking.ajaxUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body,
    });
    return raw.json();
  });
  if (!response.success || !Array.isArray(response.data?.slots)) {
    throw new Error('The public booking endpoint did not return a slot list.');
  }
  const schedule = {};
  for (const slot of response.data.slots) {
    if (!schedule[slot.date]) schedule[slot.date] = [];
    schedule[slot.date].push({
      range: String(slot.range).replace(/\s*[–-]\s*/u, '-'),
      status: String(slot.status),
    });
  }
  return schedule;
}

function verifySchedule(planDates, schedule, surface, allowExtras) {
  const problems = [];
  for (const [date, expected] of Object.entries(planDates)) {
    const actual = schedule[date] || [];
    const available = actual
      .filter((slot) => slot.status === 'available')
      .map((slot) => slot.range)
      .sort();
    const expectedSorted = [...expected].sort();
    const missing = expectedSorted.filter((range) => !available.includes(range));
    const extras = available.filter((range) => !expectedSorted.includes(range));
    const unavailable = actual.filter(
      (slot) => expected.includes(slot.range) && slot.status !== 'available',
    );
    if (missing.length || unavailable.length || (!allowExtras && extras.length)) {
      problems.push({ date, missing, extras, unavailable });
    }
  }
  if (problems.length) {
    throw new Error(`${surface} verification failed: ${JSON.stringify(problems)}`);
  }
  return { ok: true, checkedDates: Object.keys(planDates).length };
}

async function main() {
  const plan = loadPlan(argumentValue('--plan'));
  const apply = process.argv.includes('--apply');
  const merge = process.argv.includes('--merge');
  const session = await openHopeBoxAdmin({
    headless: !process.argv.includes('--visible'),
    credentialFile: argumentValue('--credential'),
    browserPath: argumentValue('--browser'),
    profileDir: argumentValue('--profile'),
  });
  const { context, page, siteRoot } = session;

  try {
    const adminUrl = `${siteRoot}/wp-admin/admin.php?page=jt-booking&tab=slots`;
    await page.goto(adminUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const publicHref = await page
      .getByRole('link', { name: /查看前台預約/u })
      .getAttribute('href');
    const publicUrl = new URL(publicHref, siteRoot).href;
    const before = await collectAdminSchedule(page);
    const review = reviewExisting(plan.dates, before, merge);
    if (review.conflicts.length) {
      throw new Error(`Preflight conflicts: ${JSON.stringify(review.conflicts)}`);
    }

    const rangeCount = Object.values(plan.dates).reduce(
      (total, ranges) => total + ranges.length,
      0,
    );
    const baseResult = {
      ok: true,
      mode: apply ? 'apply' : 'dry-run',
      checkedAt: new Date().toISOString(),
      loginMode: session.loginMode,
      plan: {
        name: plan.name,
        timezone: plan.timezone,
        slotMinutes: plan.slotMinutes,
        dateCount: Object.keys(plan.dates).length,
        rangeCount,
        dates: plan.dates,
        pending: plan.pending,
      },
      preflight: {
        alreadySatisfied: review.alreadySatisfied,
        datesToCreate: review.datesToCreate,
        conflicts: [],
      },
    };

    if (!apply) {
      emit(baseResult);
      return;
    }

    const applied = await submitDates(page, review.datesToCreate);
    await page.goto(adminUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const adminAfter = await collectAdminSchedule(page);
    const adminVerification = verifySchedule(
      plan.dates,
      adminAfter,
      'Admin schedule',
      merge,
    );
    const publicAfter = await collectPublicSchedule(page, publicUrl);
    const publicVerification = verifySchedule(
      plan.dates,
      publicAfter,
      'Public booking form',
      merge,
    );

    emit({
      ...baseResult,
      applied,
      verification: {
        admin: adminVerification,
        public: publicVerification,
        publicPath: (() => {
          const url = new URL(publicUrl);
          return url.pathname;
        })(),
      },
    });
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  emit(
    {
      ok: false,
      error: cleanText(error.message || error).slice(0, 4000),
    },
    true,
  );
  process.exitCode = 1;
});
