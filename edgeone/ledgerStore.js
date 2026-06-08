const COLLECTION_KEYS = {
  records: 'records',
  settings: 'settings',
};

function nowIso() {
  return new Date().toISOString();
}

function toTimestamp(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
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

export function normalizeRecord(record, fallbackNow = nowIso()) {
  const source = record || {};
  const id = String(source.id || crypto.randomUUID());
  const category = String(source.category || 'other');
  const createdAt = source.createdAt || source.created_at || fallbackNow;

  return {
    id,
    amount: Number(source.amount || 0),
    category,
    currency: source.currency || 'VND',
    note: source.note || '',
    tag: category === 'income' ? '' : (source.tag || ''),
    date: source.date || source.record_date || fallbackNow.slice(0, 10),
    time: source.time || source.record_time || '00:00',
    createdAt,
    updatedAt: source.updatedAt || source.updated_at || createdAt || fallbackNow,
  };
}

export async function readJson(kv, key, fallback) {
  const value = await kv.get(key, { type: 'json' });
  return value == null ? fallback : value;
}

export async function readRecords(kv) {
  const records = await readJson(kv, COLLECTION_KEYS.records, []);
  return sortRecords(safeArray(records).map((record) => normalizeRecord(record)));
}

export async function mergeRecords(kv, incomingRecords) {
  const current = await readRecords(kv);
  const merged = new Map(current.map((record) => [record.id, record]));
  const stamp = nowIso();

  for (const incoming of safeArray(incomingRecords)) {
    const next = normalizeRecord(incoming, stamp);
    const existing = merged.get(next.id);

    if (!existing || toTimestamp(next.updatedAt) >= toTimestamp(existing.updatedAt)) {
      merged.set(next.id, next);
    }
  }

  const records = sortRecords([...merged.values()]);
  await kv.put(COLLECTION_KEYS.records, JSON.stringify(records));
  return records;
}

export async function deleteRecord(kv, id) {
  const targetId = String(id || '');
  const current = await readRecords(kv);
  const records = current.filter((record) => record.id !== targetId);
  await kv.put(COLLECTION_KEYS.records, JSON.stringify(records));
  return records;
}

export async function readSettings(kv) {
  const settings = await readJson(kv, COLLECTION_KEYS.settings, {});
  return settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
}

export async function mergeSettings(kv, incomingSettings) {
  const current = await readSettings(kv);
  const stamp = nowIso();
  const next = {
    ...current,
    ...(incomingSettings && typeof incomingSettings === 'object' ? incomingSettings : {}),
    updatedAt: stamp,
  };

  await kv.put(COLLECTION_KEYS.settings, JSON.stringify(next));
  return next;
}

export { COLLECTION_KEYS };
