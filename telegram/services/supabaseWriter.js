import { createClient } from '@supabase/supabase-js';
import {
  assertTelegramLedgerApiConfig,
  assertTelegramSupabaseConfig,
  getTelegramStorageConfig,
  getTelegramSupabaseConfig,
} from '../config.js';

let cachedClient = null;

function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const config = getTelegramSupabaseConfig();
  assertTelegramSupabaseConfig(config);
  cachedClient = createClient(config.url, config.anonKey);
  return cachedClient;
}

function normalizeRecord(row) {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    currency: row.currency,
    note: row.note || '',
    tag: row.tag || '',
    date: row.record_date,
    time: row.record_time || '00:00',
    createdAt: row.created_at,
  };
}

function shouldUseLedgerApi() {
  const config = getTelegramStorageConfig();
  return config.driver === 'edgeone-kv' || config.driver === 'api' || Boolean(config.ledgerApiBase);
}

function createTelegramRecord(record) {
  const stamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    amount: Number(record.amount || 0),
    category: record.category || 'other',
    currency: record.currency || 'VND',
    note: record.note || '',
    tag: record.category === 'income' ? '' : (record.tag || ''),
    date: record.date,
    time: record.time || '00:00',
    createdAt: stamp,
    updatedAt: stamp,
  };
}

async function saveToLedgerApi(record) {
  const config = getTelegramStorageConfig();
  assertTelegramLedgerApiConfig(config);

  const payload = createTelegramRecord(record);
  const base = config.ledgerApiBase.replace(/\/+$/, '');
  const response = await fetch(`${base}/api/records`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items: [payload] }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.ok === false) {
    throw new Error(`Ledger API save failed: ${data.error || response.status}`);
  }

  const saved = Array.isArray(data.items)
    ? data.items.find((item) => item.id === payload.id)
    : null;

  return saved || payload;
}

export async function saveTelegramRecord(record) {
  if (shouldUseLedgerApi()) {
    return saveToLedgerApi(record);
  }

  const supabase = getSupabaseClient();

  const payload = {
    amount: record.amount,
    category: record.category,
    currency: record.currency,
    note: record.note,
    tag: record.category === 'income' ? '' : (record.tag || ''),
    record_date: record.date,
    record_time: record.time,
  };

  const { data, error } = await supabase
    .from('records')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return normalizeRecord(data);
}
