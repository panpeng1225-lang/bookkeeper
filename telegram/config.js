/* global process */

function readEnv(name, fallback = '') {
  const value = process.env[name];
  if (value == null || value === '') {
    return fallback;
  }

  return String(value).trim();
}

export function getTelegramBotConfig() {
  return {
    botToken: readEnv('TELEGRAM_BOT_TOKEN', ''),
    webhookSecret: readEnv('TELEGRAM_WEBHOOK_SECRET', ''),
    port: Number(process.env.TELEGRAM_BOT_PORT || 8787),
    host: readEnv('TELEGRAM_BOT_HOST', '0.0.0.0'),
    defaultCurrency: readEnv('TELEGRAM_DEFAULT_CURRENCY', 'RMB'),
  };
}

export function getSpeechToTextConfig() {
  const provider = readEnv('TELEGRAM_STT_PROVIDER', 'volcengine');

  return {
    provider,
    volcengine: {
      appId: readEnv('VOLCENGINE_SPEECH_APPID', ''),
      token: readEnv('VOLCENGINE_SPEECH_TOKEN', ''),
      cluster: readEnv('VOLCENGINE_SPEECH_CLUSTER', 'volc_auc_common'),
      language: readEnv('VOLCENGINE_SPEECH_LANGUAGE', 'zh-CN'),
      useItn: (process.env.VOLCENGINE_SPEECH_USE_ITN || 'true').toLowerCase() === 'true',
      usePunc: (process.env.VOLCENGINE_SPEECH_USE_PUNC || 'false').toLowerCase() === 'true',
      submitUrl: readEnv('VOLCENGINE_SPEECH_SUBMIT_URL', 'https://openspeech.bytedance.com/api/v1/auc/submit'),
      queryUrl: readEnv('VOLCENGINE_SPEECH_QUERY_URL', 'https://openspeech.bytedance.com/api/v1/auc/query'),
      pollingIntervalMs: Number(process.env.VOLCENGINE_SPEECH_POLL_MS || 1500),
      pollingTimeoutMs: Number(process.env.VOLCENGINE_SPEECH_TIMEOUT_MS || 45000),
    },
    openai: {
      apiKey: readEnv('OPENAI_API_KEY', ''),
      model: readEnv('OPENAI_TRANSCRIBE_MODEL', 'gpt-4o-mini-transcribe'),
      language: readEnv('OPENAI_TRANSCRIBE_LANGUAGE', 'zh'),
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
