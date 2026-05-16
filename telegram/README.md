# Telegram Bot Local Runbook

## 1. 当前阶段目标

当前只做 **阶段 4：Telegram 收消息并回复解析结果**，暂时不写入 Supabase。

当前链路：

1. Telegram 发文字或语音
2. webhook 收到消息
3. 文字直接解析
4. 语音先拿 Telegram 文件 URL，再走火山转写
5. 统一走 `parseRecordText.js`
6. bot 回复：
   - 金额
   - 币种
   - 用途
   - 备注

## 2. 必要环境变量

可直接参考：

```text
telegram/.env.example
```

### Telegram

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_BOT_PORT`
- `TELEGRAM_BOT_HOST`
- `TELEGRAM_DEFAULT_CURRENCY`

### 火山语音转写

旧版控制台模式：

- `VOLCENGINE_SPEECH_APPID`
- `VOLCENGINE_SPEECH_TOKEN`

新版控制台模式：

- `VOLCENGINE_SPEECH_API_KEY`

通用可选项：

- `VOLCENGINE_SPEECH_LANGUAGE`
- `VOLCENGINE_SPEECH_USE_ITN`
- `VOLCENGINE_SPEECH_USE_PUNC`
- `VOLCENGINE_SPEECH_RESOURCE_ID`
- `VOLCENGINE_SPEECH_SUBMIT_URL`
- `VOLCENGINE_SPEECH_QUERY_URL`
- `VOLCENGINE_SPEECH_POLL_MS`
- `VOLCENGINE_SPEECH_TIMEOUT_MS`

## 3. 本地启动

启动 bot 服务：

```bash
npm.cmd run telegram:dev
```

成功后应可访问：

- `GET /health`
- `POST /telegram/webhook`

## 4. 设置 webhook

Telegram 需要一个公网 HTTPS 地址。

设置命令：

```bash
npm.cmd run telegram:set-webhook -- --base-url https://your-public-host
```

默认会把 webhook 设为：

```text
https://your-public-host/api/telegram-webhook
```

如果配置了 `TELEGRAM_WEBHOOK_SECRET`，脚本也会一起设置 `secret_token`。

如果你仍想指向本地 Node server 的老路径，也可以显式传：

```bash
npm.cmd run telegram:set-webhook -- --base-url https://your-public-host --path /telegram/webhook
```

## 5. 阶段 4 验收顺序

1. 本地启动 `telegram:dev`
2. 二选一：
   - 用公网 HTTPS 地址暴露本地服务
   - 或直接把 `api/telegram-webhook` 部署到 Vercel
3. 执行 `telegram:set-webhook`
4. 在 Telegram 里给 bot 发一条文字
5. 确认 bot 回复解析结果
6. 再发一条语音
7. 确认 bot 回复解析结果

## 6. 当前已知限制

- 当前只回复解析结果，不写库
- 当前火山标准版 API 要求音频 URL，因此语音链路依赖 Telegram 文件 URL
- 当前还没做 Telegram 端真实联调验收
- 当前还没做 Supabase 入库

## 7. 下一阶段

阶段 4 验收通过后，才能进入阶段 5：

- 把解析后的记录真正写入 Supabase `records` 表
- 再做“Telegram 发消息 -> 前端账本看到新记录”的验收
## 2026-05-16 Current Stable Webhook Notes

- Preferred production route: Vercel serverless `POST /api/telegram-webhook`
- `vercel.json` now sets `maxDuration: 60` for `api/telegram-webhook.js`, because voice handling may need time for Telegram download plus Volcengine polling
- Secret validation:
  - request header `x-telegram-bot-api-secret-token`
  - compare with `TELEGRAM_WEBHOOK_SECRET`
- Internal business errors should still return HTTP `200` to Telegram, so Telegram does not create a retry storm
- Voice download path:
  - call `getFile`
  - download `https://api.telegram.org/file/bot<TOKEN>/<file_path>`
  - convert binary to Base64 inside this service
- Current Volcengine ASR path:
  - `https://openspeech.bytedance.com/api/v1/auc/submit`
  - `https://openspeech.bytedance.com/api/v1/auc/query`
  - `Authorization: Bearer; <token>`
- If older sections in this file still mention `VOLCENGINE_SPEECH_API_KEY`, `VOLCENGINE_SPEECH_RESOURCE_ID`, or `api/v3/auc/bigmodel`, treat them as obsolete exploration notes, not the current path.
