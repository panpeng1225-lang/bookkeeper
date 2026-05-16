/* global Buffer */

import path from 'node:path';
import { assertTelegramBotConfig, getTelegramBotConfig } from '../config.js';

function getTelegramApiBase(config = getTelegramBotConfig()) {
  return `https://api.telegram.org/bot${config.botToken}`;
}

function getTelegramFileBase(config = getTelegramBotConfig()) {
  return `https://api.telegram.org/file/bot${config.botToken}`;
}

export async function callTelegramApi(method, payload) {
  const config = getTelegramBotConfig();
  assertTelegramBotConfig(config);

  const response = await fetch(`${getTelegramApiBase(config)}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API ${method} failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API ${method} error: ${data.description || 'unknown error'}`);
  }

  return data.result;
}

export async function sendTelegramMessage(chatId, text) {
  return callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
  });
}

export async function getTelegramFile(fileId) {
  return callTelegramApi('getFile', {
    file_id: fileId,
  });
}

export async function getTelegramFileUrl(fileId) {
  const config = getTelegramBotConfig();
  assertTelegramBotConfig(config);

  const file = await getTelegramFile(fileId);
  if (!file?.file_path) {
    throw new Error('Telegram file path not found');
  }

  return `${getTelegramFileBase(config)}/${file.file_path}`;
}

export async function downloadTelegramFile(fileId) {
  const file = await getTelegramFile(fileId);
  if (!file?.file_path) {
    throw new Error('Telegram file path not found');
  }

  const response = await fetch(`${getTelegramFileBase()}/${file.file_path}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download Telegram file: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    arrayBuffer,
    filePath: file.file_path,
  };
}

export async function downloadTelegramFileAsBase64(fileId) {
  const { arrayBuffer, filePath } = await downloadTelegramFile(fileId);
  const extension = path.extname(filePath || '').replace('.', '').toLowerCase();
  const normalizedFormat = extension === 'oga' ? 'ogg' : extension;

  return {
    base64: Buffer.from(arrayBuffer).toString('base64'),
    filePath,
    format: normalizedFormat || 'ogg',
  };
}
