/* global process */

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
    throw new Error('Missing LEDGER_API_BASE');
  }

  const before = await requestJson(base, '/api/records');
  const staleSnapshot = Array.isArray(before.items) ? before.items : [];
  const testId = `edgeone_race_test_${crypto.randomUUID()}`;
  const stamp = new Date().toISOString();

  const testRecord = {
    id: testId,
    amount: 1,
    category: 'other',
    currency: 'VND',
    note: 'edgeone migration race test',
    tag: '',
    date: stamp.slice(0, 10),
    time: stamp.slice(11, 16),
    createdAt: stamp,
    updatedAt: stamp,
  };

  await requestJson(base, '/api/records', {
    method: 'PUT',
    body: JSON.stringify({ items: [testRecord] }),
  });

  await requestJson(base, '/api/records', {
    method: 'PUT',
    body: JSON.stringify({ items: staleSnapshot }),
  });

  const afterRace = await requestJson(base, '/api/records');
  const survived = Array.isArray(afterRace.items) && afterRace.items.some((item) => item.id === testId);

  await requestJson(base, `/api/records?id=${encodeURIComponent(testId)}`, {
    method: 'DELETE',
  });

  const afterCleanup = await requestJson(base, '/api/health');

  if (!survived) {
    throw new Error('Race guard failed: stale snapshot removed the newer test record');
  }

  console.log(`EdgeOne API race guard passed. finalRemoteCount=${afterCleanup.records}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
