import { getLedgerKv, jsonResponse, optionsResponse, readJsonBody } from '../../edgeone/http.js';
import { mergeSettings, readSettings } from '../../edgeone/ledgerStore.js';

export async function onRequest({ request, env }) {
  try {
    if (request.method === 'OPTIONS') return optionsResponse();

    const kv = getLedgerKv(env);

    if (request.method === 'GET') {
      const settings = await readSettings(kv);
      return jsonResponse({ ok: true, collection: 'settings', settings });
    }

    if (request.method === 'PUT') {
      const body = await readJsonBody(request);
      const settings = await mergeSettings(kv, body?.settings || body);
      return jsonResponse({ ok: true, collection: 'settings', settings });
    }

    if (request.method === 'DELETE') {
      await kv.put('settings', JSON.stringify({}));
      return jsonResponse({ ok: true, collection: 'settings', settings: {} });
    }

    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'INTERNAL_ERROR' }, 500);
  }
}
