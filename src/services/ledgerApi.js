function getApiBase() {
  return (import.meta.env.VITE_LEDGER_API_BASE || '').replace(/\/+$/, '');
}

function apiUrl(path) {
  return `${getApiBase()}${path}`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `API ${response.status}`);
  }

  return data;
}

export function shouldUseLedgerApi(hasSupabase) {
  const driver = import.meta.env.VITE_STORAGE_DRIVER || '';
  if (driver === 'edgeone-kv' || driver === 'api') return true;
  if (driver === 'supabase') return false;
  return !hasSupabase;
}

export async function fetchApiRecords() {
  const data = await requestJson('/api/records');
  return Array.isArray(data.items) ? data.items : [];
}

export async function putApiRecords(records) {
  const data = await requestJson('/api/records', {
    method: 'PUT',
    body: JSON.stringify({ items: records }),
  });
  return Array.isArray(data.items) ? data.items : [];
}

export async function deleteApiRecord(id) {
  const data = await requestJson(`/api/records?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchApiSettings() {
  const data = await requestJson('/api/settings');
  return data.settings && typeof data.settings === 'object' ? data.settings : {};
}

export async function putApiSettings(settings) {
  const data = await requestJson('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
  return data.settings && typeof data.settings === 'object' ? data.settings : {};
}
