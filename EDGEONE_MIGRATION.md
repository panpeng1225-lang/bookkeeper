# Bookkeeper EdgeOne Migration

## Target Architecture

- Static frontend: EdgeOne Pages.
- API backend: EdgeOne Pages Functions under `edge-functions/api`.
- Storage: EdgeOne Pages KV namespace bound as `LEDGER_KV`.
- Primary record API: `/api/records`.
- Compatibility alias: `/api/transactions`.
- Settings API: `/api/settings`.
- Health check: `/api/health`.

## Current Data Inventory

- Remote collection to migrate:
  - `records` from Supabase table `records`.
- Local-only caches/settings:
  - `bookkeeper_records` is now cache/fallback only.
  - `bookkeeper_settings` stores app settings cache.
  - `bookkeeper_exchange_rate` is synced from/to remote settings.
  - `bookkeeper_vision_key` stays local because it is a personal API key.
- Static config, not migrated as KV collections:
  - categories are defined in `src/config/categories.js`.
  - tag values are stored as the `tag` field on each record.
- Not present in this app at this stage:
  - accounts
  - budgets
  - recurring records

## Implemented API

### `/api/records`

- `GET`: returns `{ ok, collection, count, items }`.
- `PUT`: accepts an array, `{ items }`, or `{ record }`.
- `DELETE`: deletes by `?id=...`.
- `OPTIONS`: CORS preflight.

PUT is merge-based:

- Existing KV records are read before writing.
- Records are merged by `id`.
- Incoming records only replace existing records when `incoming.updatedAt >= existing.updatedAt`.
- This prevents an old browser snapshot from deleting newer remote records.

### `/api/settings`

- `GET`: returns `{ ok, collection, settings }`.
- `PUT`: shallow merges settings.
- `DELETE`: clears settings.
- `OPTIONS`: CORS preflight.

### `/api/health`

Returns KV status and record count:

```json
{
  "ok": true,
  "storage": "edgeone-kv",
  "records": 181,
  "hasSettings": true
}
```

If KV is not bound, it returns:

```json
{
  "ok": false,
  "error": "Missing EdgeOne KV binding: expected LEDGER_KV"
}
```

## Frontend Storage Rules

- EdgeOne API is the primary storage driver when no Supabase env is present, or when `VITE_STORAGE_DRIVER=edgeone-kv`.
- Same-origin API base is the default: frontend requests `/api/records`.
- `VITE_LEDGER_API_BASE` can override the API base for cross-domain testing.
- Startup remote sync only updates local cache.
- User actions write remote:
  - add -> `PUT /api/records` with one new record
  - edit -> `PUT /api/records` with one updated record
  - delete -> `DELETE /api/records?id=...`
- The app never pushes the whole local cache to remote on startup.

## Telegram Write Target

Telegram still has the existing Vercel/serverless webhook path available, but the writer now supports EdgeOne API.

To make Telegram write EdgeOne KV instead of Supabase, set:

```bash
TELEGRAM_STORAGE_DRIVER=edgeone-kv
TELEGRAM_LEDGER_API_BASE=https://<edgeone-domain>
```

Keep these existing Telegram/ASR env vars:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_DEFAULT_CURRENCY`
- `VOLCENGINE_SPEECH_APPID`
- `VOLCENGINE_SPEECH_TOKEN`

Do not print secret values in chat or logs.

## Migration Commands

Export old Supabase data:

```bash
node --env-file=.env.local scripts/exportSupabaseRecords.js
```

Import into EdgeOne KV after `LEDGER_KV` is bound:

```bash
$env:LEDGER_API_BASE='https://<edgeone-domain>'
npm.cmd run migration:import:edgeone
```

Verify old snapshot protection:

```bash
npm.cmd run verify:ledger-merge
```

## Current Migration Status

Completed:

- Code storage audit.
- EdgeOne KV API implementation.
- Frontend storage driver implementation.
- Telegram writer support for EdgeOne API.
- Supabase export script.
- EdgeOne import script.
- Old snapshot merge guard test.
- Local `lint` passed.
- Local `build` passed.
- Supabase export completed with `181` records.
- EdgeOne project created:
  - project name: `bookkeeper`
  - project id: `pages-nwjoloizkfpz`
  - latest deployment id: `dp04i5b3igbf`
- EdgeOne KV namespace created:
  - namespace: `ledger`
  - binding variable: `LEDGER_KV`
- KV binding verified:
  - `/api/health` returned `ok: true`
- Supabase data imported into EdgeOne KV:
  - local export count: `181`
  - remote API count: `181`
- API verification:
  - `/api/records` returns JSON
  - `/api/health` returns `records: 181`
- Race protection verified against live EdgeOne API:
  - `npm.cmd run verify:edgeone-api-race`
  - test creates a temporary record, PUTs an old snapshot, confirms the temporary record survives, then deletes it
- Telegram writer path verified:
  - local Telegram writer test wrote one temporary record to EdgeOne API and deleted it
- Vercel Telegram webhook production env updated:
  - `TELEGRAM_STORAGE_DRIVER=edgeone-kv`
  - `TELEGRAM_LEDGER_API_BASE=https://bookkeeper-wms4ylwb.edgeone.cool`
- Vercel production redeployed:
  - deployment id: `dpl_AwCVW7Z5kgWC5aUFQwKX219LWYDH`
  - alias: `https://bookkeeper-red.vercel.app`

## Final Verification Checklist

- Done: `/api/health` returns `ok: true`.
- Done: `/api/records` returns JSON, not the frontend HTML.
- Done: `/api/records.count` equals exported Supabase count: `181`.
- Done: run old snapshot race test against API:
  - GET old records.
  - Add a new record.
  - PUT old snapshot.
  - Confirm the new record still exists.
- Done: configure Telegram writer to EdgeOne API.
- Done: local Telegram writer path test.
- Still needs manual device validation:
  - Add one record on desktop, refresh, record still exists.
  - Open the same EdgeOne URL on mobile, new desktop record is visible.
  - Add one record on mobile, refresh desktop, mobile record is visible.
  - Send one real Telegram text/voice record.
  - Confirm Telegram-created record appears on desktop and mobile.
