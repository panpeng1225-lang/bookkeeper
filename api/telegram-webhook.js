/* global Buffer */

import { getTelegramBotConfig } from '../telegram/config.js';
import { handleTelegramUpdate } from '../telegram/handlers/telegramWebhook.js';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf8');
  if (!bodyText) return {};
  return JSON.parse(bodyText);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      sendJson(res, 200, { ok: true, route: 'telegram-webhook' });
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
      return;
    }

    const config = getTelegramBotConfig();
    if (config.webhookSecret) {
      const secret = req.headers['x-telegram-bot-api-secret-token'];
      if (secret !== config.webhookSecret) {
        sendJson(res, 401, { ok: false, error: 'INVALID_SECRET' });
        return;
      }
    }

    const update = await readRequestBody(req);
    const result = await handleTelegramUpdate(update);
    sendJson(res, 200, result);
  } catch (error) {
    console.error(error);
    sendJson(res, 200, {
      ok: true,
      degraded: true,
      error: error?.message || 'INTERNAL_ERROR',
    });
  }
}
