/* global process */

import fs from 'node:fs/promises';
import path from 'node:path';

const INPUT_FILE = path.resolve('migration/ledger-migration-data.json');

function readEnv(name, fallback = '') {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return String(value).trim();
}

function apiUrl(base, pathName) {
  return `${base.replace(/\/+$/, '')}${pathName}`;
}

async function requestJson(base, pathName, options = {}) {
  const response = await fetch(apiUrl(base, pathName), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.ok === false) {
    throw new Error(`${pathName} failed: ${data.error || response.status}`);
  }

  return data;
}

async function main() {
  const base = readEnv('LEDGER_API_BASE') || readEnv('TELEGRAM_LEDGER_API_BASE');
  if (!base) {
    throw new Error('Missing LEDGER_API_BASE, for example https://your-edgeone-domain');
  }

  const raw = await fs.readFile(INPUT_FILE, 'utf8');
  const payload = JSON.parse(raw);
  const records = Array.isArray(payload.records) ? payload.records : [];
  const settings = payload.settings && typeof payload.settings === 'object' ? payload.settings : {};

  if (Object.keys(settings).length > 0) {
    await requestJson(base, '/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  await requestJson(base, '/api/records', {
    method: 'PUT',
    body: JSON.stringify({ items: records }),
  });

  const verification = await requestJson(base, '/api/health');
  const remoteCount = Number(verification.records || 0);

  console.log(`Imported records: local=${records.length}, remote=${remoteCount}`);
  if (remoteCount < records.length) {
    throw new Error('Remote record count is lower than exported count');
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
