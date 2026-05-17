import { createClient } from '@supabase/supabase-js';
import {
  assertTelegramSupabaseConfig,
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

export async function saveTelegramRecord(record) {
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
