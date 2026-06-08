const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ledger-Write-Token',
};

export function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...CORS_HEADERS,
    },
  });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function readJsonBody(request) {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
}

export function getLedgerKv(env) {
  const kv = env?.LEDGER_KV || env?.APP_KV || env?.BOOKKEEPER_KV;
  if (!kv) {
    throw new Error('Missing EdgeOne KV binding: expected LEDGER_KV');
  }
  return kv;
}
