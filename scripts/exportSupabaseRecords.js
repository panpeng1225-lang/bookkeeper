/* global process */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const OUTPUT_FILE = path.resolve('migration/ledger-migration-data.json');

function readEnv(name, fallback = '') {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return String(value).trim().replace(/\\r\\n/g, '').replace(/\\n/g, '');
}

function normalizeRecord(row) {
  const createdAt = row.created_at || new Date().toISOString();

  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category || 'other',
    currency: row.currency || 'VND',
    note: row.note || '',
    tag: row.category === 'income' ? '' : (row.tag || ''),
    date: row.record_date,
    time: row.record_time || '00:00',
    createdAt,
    updatedAt: row.updated_at || createdAt,
  };
}

async function main() {
  const supabaseUrl = readEnv('TELEGRAM_SUPABASE_URL', readEnv('VITE_SUPABASE_URL'));
  const supabaseAnonKey = readEnv('TELEGRAM_SUPABASE_ANON_KEY', readEnv('VITE_SUPABASE_ANON_KEY'));

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  const records = (data || []).map(normalizeRecord);
  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'supabase.records',
    counts: {
      records: records.length,
      settings: 0,
    },
    records,
    settings: {},
  };

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Exported ${records.length} records to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
