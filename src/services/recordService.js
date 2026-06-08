import { supabase } from '../config/supabase';
import {
  deleteApiRecord,
  fetchApiRecords,
  fetchApiSettings,
  putApiRecords,
  putApiSettings,
  shouldUseLedgerApi,
} from './ledgerApi';

const RECORDS_KEY = 'bookkeeper_records';
const SETTINGS_KEY = 'bookkeeper_settings';
const EXCHANGE_RATE_KEY = 'bookkeeper_exchange_rate';

const useLedgerApi = shouldUseLedgerApi(!!supabase);
const useSupabase = !useLedgerApi && !!supabase;

function nowIso() {
  return new Date().toISOString();
}

function sortRecords(records) {
  return [...records].sort((a, b) => {
    const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateCompare) return dateCompare;
    const timeCompare = String(b.time || '').localeCompare(String(a.time || ''));
    if (timeCompare) return timeCompare;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

function normalizeRecord(record) {
  const createdAt = record.createdAt || record.created_at || nowIso();
  const category = record.category || 'other';

  return {
    id: record.id,
    amount: Number(record.amount),
    category,
    currency: record.currency || 'VND',
    note: record.note || '',
    tag: category === 'income' ? '' : (record.tag || ''),
    date: record.date || record.record_date,
    time: record.time || record.record_time || '00:00',
    createdAt,
    updatedAt: record.updatedAt || record.updated_at || createdAt,
  };
}

async function fetchAllFromSupabase() {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(normalizeRecord);
}

async function addToSupabase(record) {
  const { data, error } = await supabase
    .from('records')
    .insert([{
      amount: record.amount,
      category: record.category,
      currency: record.currency,
      note: record.note,
      tag: record.category === 'income' ? '' : (record.tag || ''),
      record_date: record.date,
      record_time: record.time,
    }])
    .select()
    .single();
  if (error) throw error;
  return normalizeRecord(data);
}

async function updateInSupabase(id, record) {
  const { data, error } = await supabase
    .from('records')
    .update({
      amount: record.amount,
      category: record.category,
      currency: record.currency,
      note: record.note,
      tag: record.category === 'income' ? '' : (record.tag || ''),
      record_date: record.date,
      record_time: record.time,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeRecord(data);
}

async function deleteFromSupabase(id) {
  const { error } = await supabase.from('records').delete().eq('id', id);
  if (error) throw error;
}

function loadRecordsFromCache() {
  try {
    const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    return sortRecords(records.map(normalizeRecord));
  } catch {
    return [];
  }
}

function saveRecordsToCache(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(sortRecords(records)));
}

function loadSettingsFromCache() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSettingsToCache(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function fetchAllFromLedgerApi() {
  const records = (await fetchApiRecords()).map(normalizeRecord);
  saveRecordsToCache(records);
  return sortRecords(records);
}

async function addToLedgerApi(record) {
  const stamp = nowIso();
  const newRecord = normalizeRecord({
    ...record,
    id: crypto.randomUUID(),
    tag: record.category === 'income' ? '' : (record.tag || ''),
    createdAt: stamp,
    updatedAt: stamp,
  });

  const records = (await putApiRecords([newRecord])).map(normalizeRecord);
  saveRecordsToCache(records);
  return records.find((item) => item.id === newRecord.id) || newRecord;
}

async function updateInLedgerApi(id, record) {
  const current = loadRecordsFromCache().find((item) => item.id === id) || {};
  const updatedRecord = normalizeRecord({
    ...current,
    ...record,
    id,
    tag: record.category === 'income' ? '' : (record.tag || ''),
    updatedAt: nowIso(),
  });

  const records = (await putApiRecords([updatedRecord])).map(normalizeRecord);
  saveRecordsToCache(records);
  return records.find((item) => item.id === id) || updatedRecord;
}

async function deleteFromLedgerApi(id) {
  const records = (await deleteApiRecord(id)).map(normalizeRecord);
  saveRecordsToCache(records);
}

export async function getRecords() {
  if (useLedgerApi) {
    try {
      return await fetchAllFromLedgerApi();
    } catch (error) {
      console.warn('Failed to load remote records, using local cache:', error);
      return loadRecordsFromCache();
    }
  }

  if (useSupabase) return fetchAllFromSupabase();
  return loadRecordsFromCache();
}

export async function addRecord(record) {
  if (useLedgerApi) return addToLedgerApi(record);
  if (useSupabase) return addToSupabase(record);

  const records = loadRecordsFromCache();
  const stamp = nowIso();
  const newRecord = normalizeRecord({
    ...record,
    id: crypto.randomUUID(),
    createdAt: stamp,
    updatedAt: stamp,
  });
  saveRecordsToCache([newRecord, ...records]);
  return newRecord;
}

export async function updateRecord(id, record) {
  if (useLedgerApi) return updateInLedgerApi(id, record);
  if (useSupabase) return updateInSupabase(id, record);

  const records = loadRecordsFromCache();
  const idx = records.findIndex((item) => item.id === id);
  if (idx < 0) throw new Error('Record not found');

  records[idx] = normalizeRecord({
    ...records[idx],
    ...record,
    id,
    updatedAt: nowIso(),
  });
  saveRecordsToCache(records);
  return records[idx];
}

export async function deleteRecord(id) {
  if (useLedgerApi) return deleteFromLedgerApi(id);
  if (useSupabase) return deleteFromSupabase(id);

  saveRecordsToCache(loadRecordsFromCache().filter((record) => record.id !== id));
}

export function getSettings() {
  return loadSettingsFromCache();
}

export async function syncSettings() {
  if (!useLedgerApi) return loadSettingsFromCache();

  try {
    const remoteSettings = await fetchApiSettings();
    const merged = { ...loadSettingsFromCache(), ...remoteSettings };
    saveSettingsToCache(merged);
    if (Number(merged.exchangeRate || 0) > 0) {
      localStorage.setItem(EXCHANGE_RATE_KEY, String(merged.exchangeRate));
    }
    return merged;
  } catch (error) {
    console.warn('Failed to load remote settings, using local cache:', error);
    return loadSettingsFromCache();
  }
}

export function saveSettings(settings) {
  const next = {
    ...loadSettingsFromCache(),
    ...settings,
    updatedAt: nowIso(),
  };
  saveSettingsToCache(next);

  if (useLedgerApi) {
    putApiSettings(next).catch((error) => {
      console.warn('Failed to save remote settings:', error);
    });
  }
}
