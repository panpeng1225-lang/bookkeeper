/* global process */

import { assertTelegramBotConfig, getTelegramBotConfig } from '../config.js';
import { callTelegramApi } from '../services/telegramApi.js';

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

async function main() {
  const config = getTelegramBotConfig();
  assertTelegramBotConfig(config);

  const webhookBase = readArg('--base-url');
  const webhookPath = readArg('--path') || '/api/telegram-webhook';
  if (!webhookBase) {
    console.error('Usage: npm.cmd run telegram:set-webhook -- --base-url <https-url> [--path /api/telegram-webhook]');
    process.exitCode = 1;
    return;
  }

  const normalizedPath = webhookPath.startsWith('/') ? webhookPath : `/${webhookPath}`;
  const webhookUrl = `${webhookBase.replace(/\/$/, '')}${normalizedPath}`;
  const payload = {
    url: webhookUrl,
  };

  if (config.webhookSecret) {
    payload.secret_token = config.webhookSecret;
  }

  const result = await callTelegramApi('setWebhook', payload);
  console.log(JSON.stringify({
    ok: true,
    webhookUrl,
    result,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
