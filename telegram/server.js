/* global process, Buffer */

import http from 'node:http';
import { assertTelegramBotConfig, getTelegramBotConfig } from './config.js';
import { handleTelegramUpdate } from './handlers/telegramWebhook.js';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf8');
  if (!bodyText) return {};
  return JSON.parse(bodyText);
}

async function startServer() {
  const config = getTelegramBotConfig();
  assertTelegramBotConfig(config);

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/health') {
        sendJson(res, 200, { ok: true });
        return;
      }

      const isWebhookRoute = req.url === '/telegram/webhook' || req.url === '/api/telegram-webhook';
      if (req.method !== 'POST' || !isWebhookRoute) {
        sendJson(res, 404, { ok: false, error: 'NOT_FOUND' });
        return;
      }

      if (config.webhookSecret) {
        const secret = req.headers['x-telegram-bot-api-secret-token'];
        if (secret !== config.webhookSecret) {
          sendJson(res, 401, { ok: false, error: 'INVALID_SECRET' });
          return;
        }
      }

      const update = await readJsonBody(req);
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
  });

  server.listen(config.port, config.host, () => {
    console.log(`Telegram bot server listening on http://${config.host}:${config.port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
