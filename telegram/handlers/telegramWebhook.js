import { getTelegramBotConfig } from '../config.js';
import { parseRecordText } from '../services/parseRecordText.js';
import { transcribeAudioBase64 } from '../services/speechToText.js';
import {
  downloadTelegramFileAsBase64,
  sendTelegramMessage,
} from '../services/telegramApi.js';

function getMessageFromUpdate(update) {
  return update?.message || update?.edited_message || null;
}

function formatParsedReply(parsed, transcript = '') {
  if (!parsed.ok) {
    return `未能识别记账内容：${parsed.message}`;
  }

  const lines = [
    '我识别到：',
    `金额：${parsed.record.amount}`,
    `币种：${parsed.record.currency}`,
    `用途：${parsed.record.category}`,
    `备注：${parsed.record.note}`,
  ];

  if (transcript && transcript !== parsed.record.note) {
    lines.splice(1, 0, `转写：${transcript}`);
  }

  return lines.join('\n');
}

function getCommandReply(text) {
  const input = String(text || '').trim().toLowerCase();
  if (input === '/start' || input === '/help') {
    return [
      '记账测试机器人已连接。',
      '你现在可以直接发送：',
      '1. 一条文字记账，例如：中午吃饭 35 块',
      '2. 一条语音记账',
      '当前阶段只回复解析结果，还不会写入账本数据库。',
    ].join('\n');
  }

  return '';
}

async function safeSendTelegramMessage(chatId, text) {
  if (!chatId || !text) return;

  try {
    await sendTelegramMessage(chatId, text);
  } catch (error) {
    console.error('Failed to reply to Telegram:', error);
  }
}

async function handleTextMessage(message) {
  const config = getTelegramBotConfig();
  const commandReply = getCommandReply(message.text || '');
  if (commandReply) {
    await safeSendTelegramMessage(message.chat.id, commandReply);
    return;
  }

  const parsed = parseRecordText(message.text || '', {
    defaultCurrency: config.defaultCurrency,
  });

  await safeSendTelegramMessage(message.chat.id, formatParsedReply(parsed));
}

async function handleVoiceMessage(message) {
  const config = getTelegramBotConfig();
  const voiceFileId = message.voice?.file_id || message.audio?.file_id;
  if (!voiceFileId) {
    await safeSendTelegramMessage(message.chat.id, '没有找到可识别的语音文件。');
    return;
  }

  try {
    const { base64, format } = await downloadTelegramFileAsBase64(voiceFileId);
    const transcription = await transcribeAudioBase64(base64, {
      format,
      codec: format === 'ogg' ? 'opus' : undefined,
      defaultCurrency: config.defaultCurrency,
      userId: String(message.from?.id || message.chat.id),
    });
    const parsed = parseRecordText(transcription.text, {
      defaultCurrency: config.defaultCurrency,
    });

    await safeSendTelegramMessage(message.chat.id, formatParsedReply(parsed, transcription.text));
  } catch (error) {
    const messageText = String(error?.message || error);
    await safeSendTelegramMessage(message.chat.id, `语音识别失败：${messageText}`);
  }
}

export async function handleTelegramUpdate(update) {
  const message = getMessageFromUpdate(update);
  if (!message?.chat?.id) {
    return { ok: true, ignored: 'NO_MESSAGE' };
  }

  if (typeof message.text === 'string' && message.text.trim()) {
    await handleTextMessage(message);
    return { ok: true, type: 'text' };
  }

  if (message.voice || message.audio) {
    await handleVoiceMessage(message);
    return { ok: true, type: 'voice' };
  }

  await safeSendTelegramMessage(message.chat.id, '当前只支持文字和语音记账测试。');
  return { ok: true, type: 'unsupported' };
}
