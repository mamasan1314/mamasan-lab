---
name: manage-hopelight-booking
description: Safely manage Tiffany's HopeLight or HopeBox WordPress appointment availability with the repository's reusable login session and booking-plan tool. Use for requests to open, add, check, merge, pause, or verify HopeLight booking dates and time slots, including all-day schedules, two-hour units, online-only periods, the HopeLight 預約 admin, and hopebox.com.tw appointment settings.
---

# Manage HopeLight Booking

Use the repository's deterministic booking tool. Do not recreate the login flow or post forms manually.

## Locate the tool

Work in `6-collaborations/teachers/tiffany-hope-light/website-admin` and read its `README.md` before website access. Use:

- `scripts/run-booking-tool.ps1` as the cross-session entry point.
- `scripts/manage-booking-slots.cjs` for validation, preflight, apply, and verification.
- `lib/hopebox-session.cjs` for the authorized local login session.
- `plans/` for traceable JSON plans. Never store credentials, cookies, nonces, or customer data there.

## Normalize the request

1. Use `Asia/Taipei` unless the user explicitly supplies another timezone and approves the conversion.
2. Convert each stated start time into an explicit range using the approved unit. For a two-hour unit, `14:30` becomes `14:30-16:30`.
3. Treat `全天` as ambiguous because HopeLight has no global all-day definition. Require an approved opening and closing time or reuse a documented value explicitly approved for the current request.
4. Keep non-contiguous ranges separate. Reject overlaps and invalid dates.
5. Do not infer hours for a date range that only says online, overseas, or unavailable. The current site has no online-only switch; obtain approved hours and public wording or record the item under `pending`.
6. Do not change service names, durations, prices, WooCommerce products, or payment settings while managing availability.

## Build a plan

Create a JSON file under `plans/`:

```json
{
  "name": "Tiffany availability",
  "timezone": "Asia/Taipei",
  "slotMinutes": 120,
  "dates": {
    "2026-09-04": ["12:00-14:00", "14:00-16:00"]
  },
  "pending": []
}
```

Use ISO dates and `HH:MM-HH:MM` ranges. The tool requires every range to equal `slotMinutes` and rejects duplicates or overlaps.

## Execute safely

Run a dry run first:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\run-booking-tool.ps1' -Plan 'plans\plan-name.json'
```

Review `preflight.conflicts`, `alreadySatisfied`, and `datesToCreate`. Stop on conflicts. Use `-Merge` only when the user explicitly wants missing ranges added while preserving extra existing ranges; never merge across blocked, held, or sold expected ranges.

Apply only after the user has authorized the exact dates and times:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\run-booking-tool.ps1' -Plan 'plans\plan-name.json' -Apply -Output 'booking-apply-result-local.json'
```

Require all of the following before reporting success:

- The backend reports the intended number of newly created ranges.
- `verification.admin.ok` is `true` for every planned date.
- `verification.public.ok` is `true` for every planned date.
- No service, payment, booking, or unrelated website setting changed.

The local result file is Git-ignored. Report applied dates, range count, interpretation decisions, and pending items. Never describe an ambiguous or unverified range as completed.

## Handle failures

- If automation fails before form submission, rerun the dry run and confirm no changes before retrying.
- If submission succeeds but verification fails, stop and inspect the affected dates; do not blindly resubmit.
- Preserve existing booked, held, sold, or blocked slots. Do not delete or reopen them without explicit authorization.
- After bulk changes, verify the public booking endpoint through the tool rather than relying only on an admin notice.
