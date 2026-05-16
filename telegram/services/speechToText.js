/* global process, Buffer */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  assertOpenAISpeechConfig,
  assertVolcengineSpeechConfig,
  getSpeechToTextConfig,
} from '../config.js';

const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.mp4',
  '.mpeg',
  '.mpga',
  '.m4a',
  '.wav',
  '.webm',
]);

const MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.mp4': 'audio/mp4',
  '.mpeg': 'audio/mpeg',
  '.mpga': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
};

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function getFileExtension(filePath) {
  return path.extname(filePath || '').toLowerCase();
}

async function validateAudioFile(filePath) {
  const extension = getFileExtension(filePath);
  if (!SUPPORTED_AUDIO_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported audio format: ${extension || 'unknown'}`);
  }

  const stat = await fs.stat(filePath);
  if (stat.size <= 0) {
    throw new Error('Audio file is empty');
  }

  if (stat.size > MAX_AUDIO_BYTES) {
    throw new Error('Audio file exceeds 25 MB limit');
  }

  return {
    extension,
    size: stat.size,
  };
}

async function transcribeWithOpenAI(filePath, options = {}) {
  const config = getSpeechToTextConfig();
  assertOpenAISpeechConfig(config);

  const model = options.model || config.openai.model;
  const language = options.language || config.openai.language;
  const prompt = options.prompt || '这是一段中文记账语音，请尽量准确识别金额、币种、用途和备注内容。';
  const extension = getFileExtension(filePath);
  const audioBuffer = await fs.readFile(filePath);

  const formData = new FormData();
  formData.append('model', model);
  formData.append('response_format', 'text');
  formData.append('language', language);
  formData.append('prompt', prompt);
  formData.append('file', new Blob([audioBuffer], { type: MIME_TYPES[extension] }), path.basename(filePath));

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI transcription failed: ${response.status} ${errorText}`);
  }

  const transcript = (await response.text()).trim();
  if (!transcript) {
    throw new Error('Speech-to-text returned empty transcript');
  }

  return transcript;
}

function extractTranscriptFromVolcengineResult(payload) {
  const topLevelText = String(payload?.text || payload?.resp?.text || '').trim();
  if (topLevelText) return topLevelText;

  const resultList = Array.isArray(payload?.result)
    ? payload.result
    : Array.isArray(payload?.resp?.result)
      ? payload.resp.result
      : [];
  const listText = resultList
    .map((item) => String(item?.text || '').trim())
    .filter(Boolean)
    .join('');
  if (listText) return listText;

  const utterances = [
    ...resultList.flatMap((item) => Array.isArray(item?.utterances) ? item.utterances : []),
    ...(Array.isArray(payload?.utterances) ? payload.utterances : []),
    ...(Array.isArray(payload?.resp?.utterances) ? payload.resp.utterances : []),
  ];

  return utterances
    .map((item) => String(item?.text || '').trim())
    .filter(Boolean)
    .join('');
}

function createRequestId() {
  return crypto.randomUUID();
}

function extractVolcengineError(payload) {
  const candidates = [
    payload?.message,
    payload?.msg,
    payload?.error,
    payload?.err_msg,
    payload?.result,
    payload?.resp?.message,
    payload?.resp?.msg,
    payload?.resp?.error,
    payload?.resp?.err_msg,
  ];

  for (const candidate of candidates) {
    const text = typeof candidate === 'string' ? candidate.trim() : '';
    if (text) return text;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return 'unknown error';
  }
}

function getVolcengineResponseMeta(payload) {
  const resp = payload?.resp && typeof payload.resp === 'object' ? payload.resp : null;

  return {
    code: String(
      payload?.code ??
      resp?.code ??
      '',
    ),
    id: String(
      payload?.id ??
      resp?.id ??
      '',
    ).trim(),
    message: String(
      payload?.message ??
      resp?.message ??
      '',
    ).trim(),
  };
}

function createVolcengineHeaders(config, requestId) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer; ${config.volcengine.token}`,
    'X-Api-Request-Id': requestId,
  };
}

async function fetchAudioAsBase64(audioUrl) {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download Telegram audio: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

async function transcribeBase64WithVolcengine(base64Audio, options = {}) {
  const config = getSpeechToTextConfig();
  assertVolcengineSpeechConfig(config);
  const requestId = options.requestId || createRequestId();

  const submitBody = {
    app: {
      appid: config.volcengine.appId,
      token: config.volcengine.token,
      cluster: options.cluster || config.volcengine.cluster,
    },
    user: {
      uid: options.userId || 'bookkeeper-telegram',
    },
    audio: {
      format: options.format || 'ogg',
      codec: options.codec || 'opus',
      rate: Number(options.rate || 16000),
      bits: Number(options.bits || 16),
      channel: Number(options.channel || 1),
      data: base64Audio,
    },
    request: {
      reqid: requestId,
    },
  };

  const submitResponse = await fetch(config.volcengine.submitUrl, {
    method: 'POST',
    headers: createVolcengineHeaders(config, requestId),
    body: JSON.stringify(submitBody),
  });

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text();
    throw new Error(`Volcengine submit failed: ${submitResponse.status} ${errorText}`);
  }

  const submitPayload = await submitResponse.json();
  const submitMeta = getVolcengineResponseMeta(submitPayload);
  if (!['0', '1000'].includes(submitMeta.code) || !submitMeta.id) {
    throw new Error(`Volcengine submit error: ${extractVolcengineError(submitPayload)}`);
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < config.volcengine.pollingTimeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, config.volcengine.pollingIntervalMs));

    const queryBody = {
      appid: config.volcengine.appId,
      token: config.volcengine.token,
      cluster: options.cluster || config.volcengine.cluster,
      id: submitMeta.id,
    };

    const queryResponse = await fetch(config.volcengine.queryUrl, {
      method: 'POST',
      headers: createVolcengineHeaders(config, requestId),
      body: JSON.stringify(queryBody),
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      throw new Error(`Volcengine query failed: ${queryResponse.status} ${errorText}`);
    }

    const queryPayload = await queryResponse.json();
    const queryMeta = getVolcengineResponseMeta(queryPayload);
    if (['2000', '1001'].includes(queryMeta.code)) {
      continue;
    }

    if (!['0', '1000'].includes(queryMeta.code)) {
      throw new Error(`Volcengine query error: ${extractVolcengineError(queryPayload)}`);
    }

    const transcript = extractTranscriptFromVolcengineResult(queryPayload);
    if (!transcript) {
      throw new Error('Volcengine returned empty transcript');
    }
    return {
      text: transcript,
      requestId,
    };
  }

  throw new Error('Volcengine transcription timed out');
}

async function transcribeAudioUrlWithVolcengine(audioUrl, options = {}) {
  const base64Audio = await fetchAudioAsBase64(audioUrl);
  return transcribeBase64WithVolcengine(base64Audio, options);
}

export async function transcribeAudioFile(filePath, options = {}) {
  await validateAudioFile(filePath);

  const provider = options.provider || process.env.TELEGRAM_STT_PROVIDER || 'volcengine';
  if (provider === 'openai') {
    const text = await transcribeWithOpenAI(filePath, options);

    return {
      ok: true,
      text,
      meta: {
        provider,
        filePath,
      },
    };
  }

  if (provider === 'volcengine') {
    const extension = getFileExtension(filePath).replace('.', '');
    const codec = extension === 'ogg' ? 'opus' : options.codec;
    const data = await fs.readFile(filePath);
    const tempUrl = `data:audio/${extension};base64,${data.toString('base64')}`;
    return transcribeAudioUrl(tempUrl, {
      ...options,
      format: extension || options.format,
      codec,
    });
  }

  throw new Error(`Unsupported speech-to-text provider: ${provider}`);
}

export async function transcribeAudioUrl(audioUrl, options = {}) {
  const provider = options.provider || process.env.TELEGRAM_STT_PROVIDER || 'volcengine';

  if (provider === 'volcengine') {
    const result = await transcribeAudioUrlWithVolcengine(audioUrl, options);

    return {
      ok: true,
      text: result.text,
      meta: {
        provider,
        audioUrl,
        requestId: result.requestId,
      },
    };
  }

  throw new Error(`Unsupported speech-to-text provider: ${provider}`);
}

export async function transcribeAudioBase64(base64Audio, options = {}) {
  const provider = options.provider || process.env.TELEGRAM_STT_PROVIDER || 'volcengine';

  if (provider === 'volcengine') {
    const result = await transcribeBase64WithVolcengine(base64Audio, options);

    return {
      ok: true,
      text: result.text,
      meta: {
        provider,
        requestId: result.requestId,
      },
    };
  }

  throw new Error(`Unsupported speech-to-text provider: ${provider}`);
}

export { SUPPORTED_AUDIO_EXTENSIONS, MAX_AUDIO_BYTES };
