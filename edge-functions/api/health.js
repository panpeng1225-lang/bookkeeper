import { getLedgerKv, jsonResponse, optionsResponse } from '../../edgeone/http.js';
import { readRecords, readSettings } from '../../edgeone/ledgerStore.js';

export async function onRequest({ request, env }) {
  try {
    if (request.method === 'OPTIONS') return optionsResponse();
    if (request.method !== 'GET') return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);

    const kv = getLedgerKv(env);
    const records = await readRecords(kv);
    const settings = await readSettings(kv);

    return jsonResponse({
      ok: true,
      storage: 'edgeone-kv',
      records: records.length,
      hasSettings: Object.keys(settings).length > 0,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'INTERNAL_ERROR' }, 500);
  }
}
