/* global process */

import assert from 'node:assert/strict';
import { mergeRecords, readRecords } from '../edgeone/ledgerStore.js';

function createMemoryKv() {
  const store = new Map();

  return {
    async get(key, options = {}) {
      const value = store.get(key) ?? null;
      if (value == null) return null;
      if (options.type === 'json') return JSON.parse(value);
      return value;
    },
    async put(key, value) {
      store.set(key, String(value));
    },
    async delete(key) {
      store.delete(key);
    },
  };
}

async function main() {
  const kv = createMemoryKv();

  await mergeRecords(kv, [{
    id: 'record_a',
    amount: 10,
    category: 'food',
    currency: 'VND',
    date: '2026-06-08',
    time: '10:00',
    createdAt: '2026-06-08T03:00:00.000Z',
    updatedAt: '2026-06-08T03:00:00.000Z',
  }]);

  const staleSnapshot = await readRecords(kv);

  await mergeRecords(kv, [{
    id: 'record_b',
    amount: 20,
    category: 'transport',
    currency: 'VND',
    date: '2026-06-08',
    time: '11:00',
    createdAt: '2026-06-08T04:00:00.000Z',
    updatedAt: '2026-06-08T04:00:00.000Z',
  }]);

  await mergeRecords(kv, staleSnapshot);

  const finalRecords = await readRecords(kv);
  assert.equal(finalRecords.length, 2);
  assert.ok(finalRecords.some((record) => record.id === 'record_a'));
  assert.ok(finalRecords.some((record) => record.id === 'record_b'));

  await mergeRecords(kv, [{
    id: 'record_a',
    amount: 99,
    category: 'food',
    currency: 'VND',
    date: '2026-06-08',
    time: '10:00',
    createdAt: '2026-06-08T03:00:00.000Z',
    updatedAt: '2026-06-08T02:00:00.000Z',
  }]);

  const afterOldUpdate = await readRecords(kv);
  assert.equal(afterOldUpdate.find((record) => record.id === 'record_a').amount, 10);

  console.log('Ledger KV merge guard passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
