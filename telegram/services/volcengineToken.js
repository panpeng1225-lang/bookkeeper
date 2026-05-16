import { assertVolcengineSpeechConfig, getSpeechToTextConfig } from '../config.js';

let cachedToken = null;
let cachedExpiresAt = 0;

function isTokenUsable() {
  if (!cachedToken || !cachedExpiresAt) return false;
  return cachedExpiresAt - Date.now() > 60 * 1000;
}

function normalizeExpiresAt(expiresAt) {
  if (!expiresAt) {
    return Date.now() + 55 * 60 * 1000;
  }

  if (expiresAt > 10_000_000_000) {
    return expiresAt;
  }

  return expiresAt * 1000;
}

export async function getVolcengineSpeechToken() {
  const config = getSpeechToTextConfig();
  assertVolcengineSpeechConfig(config);

  if (config.volcengine.token) {
    return {
      token: config.volcengine.token,
      source: 'env',
    };
  }

  if (isTokenUsable()) {
    return {
      token: cachedToken,
      source: 'cache',
    };
  }

  const response = await fetch(config.volcengine.tokenApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Service: config.volcengine.service,
      Region: config.volcengine.region,
      access_key: config.volcengine.accessKey,
      secret_key: config.volcengine.secretKey,
      token_version: config.volcengine.tokenVersion,
      appkey: config.volcengine.appKey,
      expiration: config.volcengine.tokenExpirationSeconds,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Volcengine token request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  if (payload.status_code !== 20000000 || !payload.token) {
    throw new Error(`Volcengine token error: ${payload.status_text || payload.status_code || 'unknown error'}`);
  }

  cachedToken = payload.token;
  cachedExpiresAt = normalizeExpiresAt(payload.expires_at);

  return {
    token: cachedToken,
    source: 'api',
    expiresAt: cachedExpiresAt,
  };
}

export function resetVolcengineSpeechTokenCache() {
  cachedToken = null;
  cachedExpiresAt = 0;
}
