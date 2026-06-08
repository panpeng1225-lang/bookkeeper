import { getLedgerKv, jsonResponse, optionsResponse, readJsonBody } from '../../edgeone/http.js';
import { deleteRecord, mergeRecords, readRecords } from '../../edgeone/ledgerStore.js';

function getDeleteId(request) {
  const url = new URL(request.url);
  return url.searchParams.get('id') || '';
}

function getIncomingRecords(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.items)) return body.items;
  if (body?.record) return [body.record];
  return [];
}

export async function onRequest({ request, env }) {
  try {
    if (request.method === 'OPTIONS') return optionsResponse();

    const kv = getLedgerKv(env);

    if (request.method === 'GET') {
      const items = await readRecords(kv);
      return jsonResponse({ ok: true, collection: 'records', count: items.length, items });
    }

    if (request.method === 'PUT') {
      const body = await readJsonBody(request);
      const incoming = getIncomingRecords(body);
      const items = await mergeRecords(kv, incoming);
      return jsonResponse({ ok: true, collection: 'records', count: items.length, items });
    }

    if (request.method === 'DELETE') {
      const id = getDeleteId(request);
      if (!id) return jsonResponse({ ok: false, error: 'MISSING_ID' }, 400);

      const items = await deleteRecord(kv, id);
      return jsonResponse({ ok: true, collection: 'records', count: items.length, items });
    }

    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'INTERNAL_ERROR' }, 500);
  }
}
