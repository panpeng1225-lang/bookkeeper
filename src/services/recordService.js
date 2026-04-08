import { supabase } from '../config/supabase';

// ── Supabase 实现 ──────────────────────────────

async function fetchAllFromSupabase() {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(normalize);
}

async function addToSupabase(record) {
  const { data, error } = await supabase
    .from('records')
    .insert([{
      amount: record.amount,
      category: record.category,
      currency: record.currency,
      note: record.note,
      record_date: record.date,
      record_time: record.time,
    }])
    .select()
    .single();
  if (error) throw error;
  return normalize(data);
}

async function updateInSupabase(id, record) {
  const { data, error } = await supabase
    .from('records')
    .update({
      amount: record.amount,
      category: record.category,
      currency: record.currency,
      note: record.note,
      record_date: record.date,
      record_time: record.time,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalize(data);
}

async function deleteFromSupabase(id) {
  const { error } = await supabase.from('records').delete().eq('id', id);
  if (error) throw error;
}

// Supabase 行 → 统一格式
function normalize(row) {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    currency: row.currency || 'VND',
    note: row.note || '',
    date: row.record_date,
    time: row.record_time || '00:00',
    createdAt: row.created_at,
  };
}

// ── localStorage 回退（未配置 Supabase 时） ────

const LS_KEY = 'bookkeeper_records';

function loadFromLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToLS(records) {
  localStorage.setItem(LS_KEY, JSON.stringify(records));
}

// ── 对外统一接口 ───────────────────────────────

const useSupabase = !!supabase;

export async function getRecords() {
  if (useSupabase) return fetchAllFromSupabase();
  return loadFromLS();
}

export async function addRecord(record) {
  if (useSupabase) return addToSupabase(record);
  const records = loadFromLS();
  const newRec = { ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  records.unshift(newRec);
  saveToLS(records);
  return newRec;
}

export async function updateRecord(id, record) {
  if (useSupabase) return updateInSupabase(id, record);
  const records = loadFromLS();
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...record };
    saveToLS(records);
    return records[idx];
  }
  throw new Error('Record not found');
}

export async function deleteRecord(id) {
  if (useSupabase) return deleteFromSupabase(id);
  const records = loadFromLS().filter(r => r.id !== id);
  saveToLS(records);
}

// ── 设置（默认币种等） ─────────────────────────

const SETTINGS_KEY = 'bookkeeper_settings';

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
