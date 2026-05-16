/* global process */

export function getTelegramBotConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
    port: Number(process.env.TELEGRAM_BOT_PORT || 8787),
    host: process.env.TELEGRAM_BOT_HOST || '0.0.0.0',
    defaultCurrency: process.env.TELEGRAM_DEFAULT_CURRENCY || 'RMB',
  };
}

export function getSpeechToTextConfig() {
  const provider = process.env.TELEGRAM_STT_PROVIDER || 'volcengine';

  return {
    provider,
    volcengine: {
      appId: process.env.VOLCENGINE_SPEECH_APPID || '',
      token: process.env.VOLCENGINE_SPEECH_TOKEN || '',
      cluster: process.env.VOLCENGINE_SPEECH_CLUSTER || 'volc_auc_common',
      language: process.env.VOLCENGINE_SPEECH_LANGUAGE || 'zh-CN',
      useItn: (process.env.VOLCENGINE_SPEECH_USE_ITN || 'true').toLowerCase() === 'true',
      usePunc: (process.env.VOLCENGINE_SPEECH_USE_PUNC || 'false').toLowerCase() === 'true',
      submitUrl: process.env.VOLCENGINE_SPEECH_SUBMIT_URL || 'https://openspeech.bytedance.com/api/v1/auc/submit',
      queryUrl: process.env.VOLCENGINE_SPEECH_QUERY_URL || 'https://openspeech.bytedance.com/api/v1/auc/query',
      pollingIntervalMs: Number(process.env.VOLCENGINE_SPEECH_POLL_MS || 1500),
      pollingTimeoutMs: Number(process.env.VOLCENGINE_SPEECH_TIMEOUT_MS || 45000),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
      language: process.env.OPENAI_TRANSCRIBE_LANGUAGE || 'zh',
    },
  };
}

export function assertVolcengineSpeechConfig(config = getSpeechToTextConfig()) {
  const hasOldConsoleAuth = Boolean(config.volcengine.appId && config.volcengine.token);

  if (!hasOldConsoleAuth) {
    throw new Error(
      'Missing Volcengine auth config: provide VOLCENGINE_SPEECH_APPID + VOLCENGINE_SPEECH_TOKEN',
    );
  }
}

export function assertOpenAISpeechConfig(config = getSpeechToTextConfig()) {
  if (!config.openai.apiKey) {
    throw new Error('Missing required environment variable: OPENAI_API_KEY');
  }
}

export function assertTelegramBotConfig(config = getTelegramBotConfig()) {
  if (!config.botToken) {
    throw new Error('Missing required environment variable: TELEGRAM_BOT_TOKEN');
  }
}
