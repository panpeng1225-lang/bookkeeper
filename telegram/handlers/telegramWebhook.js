import { getTelegramBotConfig } from '../config.js';
import { parseRecordText } from '../services/parseRecordText.js';
import { transcribeAudioBase64 } from '../services/speechToText.js';
import { saveTelegramRecord } from '../services/supabaseWriter.js';
import {
  downloadTelegramFileAsBase64,
  sendTelegramMessage,
} from '../services/telegramApi.js';

function getMessageFromUpdate(update) {
  return update?.message || update?.edited_message || null;
}

function formatSavedReply(record, transcript = '') {
  const lines = [
    '已记入账本：',
    `金额：${record.amount}`,
    `币种：${record.currency}`,
    `用途：${record.category}`,
    `备注：${record.note || '无'}`,
  ];

  if (transcript && transcript !== record.note) {
    lines.push(`原始转写：${transcript}`);
  }

  return lines.join('\n');
}

function getCommandReply(text) {
  const input = String(text || '').trim().toLowerCase();
  if (input === '/start' || input === '/help') {
    return [
      '记账机器人已连接。',
      '你现在可以直接发送：',
      '1. 一条文字记账，例如：中午吃饭 35 块',
      '2. 一条语音记账',
      '当前会自动写入账本，并回你本次保存结果。',
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

async function saveParsedRecord(parsed) {
  return saveTelegramRecord(parsed.record);
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

  if (!parsed.ok) {
    await safeSendTelegramMessage(message.chat.id, `未能识别记账内容：${parsed.message}`);
    return;
  }

  const savedRecord = await saveParsedRecord(parsed);
  await safeSendTelegramMessage(message.chat.id, formatSavedReply(savedRecord));
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

    if (!parsed.ok) {
      await safeSendTelegramMessage(message.chat.id, `未能识别记账内容：${parsed.message}`);
      return;
    }

    const savedRecord = await saveParsedRecord(parsed);
    await safeSendTelegramMessage(
      message.chat.id,
      formatSavedReply(savedRecord, transcription.text),
    );
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

  await safeSendTelegramMessage(message.chat.id, '当前只支持文字和语音记账。');
  return { ok: true, type: 'unsupported' };
}
