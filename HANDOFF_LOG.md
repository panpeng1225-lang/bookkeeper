# Handoff Log

## 2026-04-30 / 2026-05-16

### 列表返回逻辑演进

1. `3d36351 fix: restore list return flow after edit`
- 修复“统计页 -> 查看全部 -> 全部记录 -> 编辑 -> 保存修改”后错误返回到统计页的问题。
- 现在从“全部记录”进入编辑时，会记录 `returnPage: 'list'`，保存、取消、删除后都会正确回到“全部记录”页面。

2. `d213082 fix: restore list scroll position after edit`
- 在“回到全部记录页”的基础上继续改进。
- 从“全部记录”进入编辑后，返回时会优先定位到刚刚编辑的记录；如果记录位置无法直接定位，则回退到对应日期分组。
- 目标是避免每次返回都跳回列表顶部。

3. `0c4087b fix: preserve exact list scroll after edit`
- 再次细化返回体验。
- 从“全部记录”进入编辑前，会先保存当时列表的 `scrollTop`。
- 保存或取消后回到“全部记录”时，优先恢复原始滚动位置，尽量保持“编辑前看到的那一屏”不变。
- 只有精确恢复失败时，才退回到“按记录/按日期定位”的兜底逻辑。

### 当前最终行为
- 从“统计”页点击“查看全部”进入“全部记录”后，编辑任意记录并保存，不会跳回统计页。
- 返回“全部记录”后，列表会尽量保持编辑前的视口位置，而不是回到顶部。
- 这套行为主要服务于“往下翻很多页后修改一条记录，再回来继续往下看”的使用场景。

### 本轮涉及文件
- `src/App.jsx`
- `src/pages/ListPage.jsx`
- `src/components/RecordList.jsx`
- `src/components/Charts/DonutChart.jsx`
- `src/pages/ScanPage.jsx`

### 验证结果
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。
- 在受限环境中多次遇到 Vite `spawn EPERM` 时，已按项目固定流程改为在非沙箱环境重跑并通过。

### 已上线版本
- `3d36351`：已推送并确认线上包包含 `returnPage: 'list'` 逻辑。
- `d213082`：已推送并确认线上包包含记录/日期定位恢复逻辑。
- `0c4087b`：已推送并确认线上包包含 `scrollTop` 精确恢复逻辑。

### 部署提醒
- 仍然必须遵守 `DEPLOYMENT_WORKFLOW.md`。
- 不要只看 GitHub 是否已推送，必须检查 Vercel `Deployments` 页面。
- 若最新 commit 没有自动成为 `Current`，需要手动 `Create Deployment`，并确认同时带有 `Production` 与 `Current` 标记。

### 当前代码状态对后续功能的影响
- `App.jsx` 已承担跨页返回状态管理职责，后续如果加 Telegram 入口，不要把消息解析逻辑继续堆进 `App.jsx`。
- `recordService.js` 仍然是唯一的数据写入中枢；新来源写账单时应尽量复用统一的数据结构。
- 当前列表返回逻辑已经较细，后续若新增“外部导入记录”的入口，要注意不要破坏现有返回体验。

### 下一阶段建议
- 先单独规划 Telegram 语音/文字记账链路，不要直接把逻辑塞进现有前端页面。
- 推荐新增独立的消息接收与解析层，再复用 Supabase `records` 表入库。

### 2026-05-16 新增规划文档
- 已新增 [TELEGRAM_VOICE_MVP_PLAN.md](/C:/Users/41434/Desktop/spending_record_App/bookkeeper/TELEGRAM_VOICE_MVP_PLAN.md)
- 这份文档冻结了 Telegram MVP 范围：
  - 单用户
  - 文本 / 语音输入
  - 只保存 `amount / currency / category / note`
  - `category` 仅规则匹配，命不中直接 `other`
  - 不引入 AI 猜分类
- 文档已明确目录结构、模块职责、阶段验收门槛，后续开发应按此计划逐步推进。

### 2026-05-16 阶段 2：纯文本解析器已完成
- 已新增 `telegram/` 目录下的规则解析层：
  - `telegram/services/amountRules.js`
  - `telegram/services/currencyRules.js`
  - `telegram/services/categoryRules.js`
  - `telegram/services/parseRecordText.js`
- 已新增样例验证脚本：
  - `telegram/scripts/verifyParseSamples.js`
- 已在 `package.json` 中增加命令：
  - `npm.cmd run verify:telegram-parser`

### 阶段 2 当前能力
- 输入一句中文文本，可输出结构化结果：
  - `amount`
  - `currency`
  - `category`
  - `note`
  - `date`
  - `time`
  - `tag`
- `category` 仅规则匹配，未命中直接 `other`
- 不使用 AI 分类
- `note` 直接保存原始文本

### 阶段 2 验证结果
- 固定样例集已通过，包括：
  - “中午吃饭 35 块”
  - “打车 120000 越盾”
  - “买奶粉 260 人民币”
  - “超市买东西 89”
  - “交房租 3000”
  - “刚才看电影花了 58 元”
  - “买纸巾 25”
  - “今天中午吃饭三十五块”
  - “刚才打车花了十二万越盾”
- `npm.cmd run verify:telegram-parser` 通过
- `npm.cmd run lint` 通过
- `npm.cmd run build` 通过

### 阶段 2 设计结论
- “买” 这种过宽关键词不能直接作为 `shopping` 规则，否则会误伤很多 `other` 场景。
- 后续新增分类关键词时，应优先加更具体的词，不要轻易加高频泛词。

### 2026-05-16 阶段 3：语音转文字层已搭好
- 已新增：
  - `telegram/config.js`
  - `telegram/services/speechToText.js`
  - `telegram/scripts/verifySpeechSample.js`
- 已在 `package.json` 中增加命令：
  - `npm.cmd run verify:telegram-speech -- --file <audio-path>`

### 阶段 3 当前能力
- 已提供独立的语音转文字服务层，不依赖前端页面。
- 当前默认 provider 已切换为 `volcengine`。
- 已根据文档 `https://www.volcengine.com/docs/6561/1354868?lang=zh` 切换到 **大模型录音文件识别标准版 API**：
  - 提交：`/api/v3/auc/bigmodel/submit`
  - 查询：`/api/v3/auc/bigmodel/query`
- 通过环境变量读取：
  - `VOLCENGINE_SPEECH_APPID`
  - `VOLCENGINE_SPEECH_API_KEY`
  - `VOLCENGINE_SPEECH_TOKEN`
  - `VOLCENGINE_SPEECH_LANGUAGE`，默认 `zh-CN`
  - `VOLCENGINE_SPEECH_USE_ITN`，默认 `true`
  - `VOLCENGINE_SPEECH_USE_PUNC`，默认 `true`
  - `VOLCENGINE_SPEECH_RESOURCE_ID`，默认 `volc.seedasr.auc`
  - `VOLCENGINE_SPEECH_SUBMIT_URL`
  - `VOLCENGINE_SPEECH_QUERY_URL`
  - `VOLCENGINE_SPEECH_POLL_MS`
  - `VOLCENGINE_SPEECH_TIMEOUT_MS`
  - `TELEGRAM_STT_PROVIDER`，默认 `volcengine`
- 仍保留 `openai` provider 抽象，但不再作为默认实现。
- 支持文件格式校验与 25 MB 限制校验。
- 支持两种火山鉴权路径：
  - 旧版控制台：`VOLCENGINE_SPEECH_APPID + VOLCENGINE_SPEECH_TOKEN`
  - 新版控制台：`VOLCENGINE_SPEECH_API_KEY`
- 转写完成后，可直接复用 `parseRecordText.js` 输出结构化账单结果。

### 阶段 3 当前验证状态
- `npm.cmd run lint` 通过
- `npm.cmd run build` 通过
- 阶段 2 解析器样例仍通过
- **尚未完成真实语音样本验收**
  - 当前缺少真实测试音频文件
  - 当前未在本地跑 `verify:telegram-speech`
- 当前这套 API 需要**可被火山服务访问的音频 URL**；本地文件路径不能直接给火山标准版 API

### 2026-05-16 阶段 4：Telegram Bot 接收层骨架已完成
- 已新增：
  - `telegram/services/telegramApi.js`
  - `telegram/handlers/telegramWebhook.js`
  - `telegram/server.js`
- 已在 `package.json` 增加命令：
  - `npm.cmd run telegram:dev`

### 阶段 4 当前能力
- 本地可启动一个独立的 Telegram webhook 服务。
- 路由：
  - `GET /health`
  - `POST /telegram/webhook`
- 支持 `TELEGRAM_WEBHOOK_SECRET` 校验。
- 支持消息类型：
  - 文字消息：直接走 `parseRecordText.js`
  - 语音/音频消息：先通过 Telegram `getFile` 拿到文件 URL，再走火山转写，再走 `parseRecordText.js`
- 当前 bot 回复逻辑为：
  - 只回复解析结果
  - 暂不写 Supabase

### 阶段 4 当前环境变量
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_BOT_PORT`
- `TELEGRAM_BOT_HOST`
- `TELEGRAM_DEFAULT_CURRENCY`

### 阶段 4 当前验证状态
- `npm.cmd run lint` 通过
- `npm.cmd run build` 通过
- **尚未完成真实 Telegram 对话验收**
  - 还未设置真实 webhook
  - 还未给 bot 发送真实文字/语音
  - 还未完成“Telegram 文件 URL -> 火山转写 -> 回复结果”的端到端验证

### 2026-05-16 阶段 4 联调准备已补齐
- 已新增：
  - `telegram/scripts/setWebhook.js`
  - `telegram/README.md`
- 已在 `package.json` 增加命令：
  - `npm.cmd run telegram:set-webhook -- --base-url <https-url>`

### 当前联调准备状态
- 已有本地运行说明
- 已有 webhook 设置脚本
- 当前距离真实 Telegram 验收，只差：
  - 配置真实 `TELEGRAM_BOT_TOKEN`
  - 提供一个公网 HTTPS 地址
  - 执行 `telegram:set-webhook`
  - 在 Telegram 中发送真实文字/语音消息

### 2026-05-16 阶段 4 新增可部署 webhook 入口
- 已新增：
  - `api/telegram-webhook.js`
- 当前 Telegram 入口支持两种运行方式：
  1. 本地 Node server：`/telegram/webhook`
  2. Vercel serverless：`/api/telegram-webhook`
- `telegram:set-webhook` 默认已改成指向：
  - `/api/telegram-webhook`

### 当前阶段 4 结论
- 本地隧道联调已证明：Telegram -> webhook -> bot 处理链路可以打通，但临时隧道本身不稳定。
- 继续依赖 `localtunnel` / `trycloudflare` 价值不高。
- 后续真实联调应优先切到：
  - Vercel 上的 `api/telegram-webhook`
  - 再把 Telegram webhook 指向正式线上域名

### 阶段 3 下一步验收要求
- 准备 5 到 10 条真实中文语音样本
- 逐条执行：
  - `npm.cmd run verify:telegram-speech -- --file <audio-path>`
- 验证项：
  - 转写文本是否可读
  - 金额是否正确
  - 币种是否正确
  - 分类是否至少符合规则逻辑，命不中则为 `other`
## 2026-05-16 Latest Telegram Connection Alignment

### Why We Changed the Webhook Layer
- Another stable Telegram app in use by the same user already proved a simpler and more reliable pattern:
  - deploy on Vercel serverless
  - validate `x-telegram-bot-api-secret-token`
  - always return `200` after handling business logic
  - use standard `getFile -> download binary -> Base64` voice file flow
- Our previous local tunnel path proved the bot logic was basically correct, but the tunnel itself was unstable and caused false negatives during testing.
- We also confirmed the working Volcengine ASR app is not using the newer `resource_id` API family. It uses the older async AUC API:
  - `https://openspeech.bytedance.com/api/v1/auc/submit`
  - `https://openspeech.bytedance.com/api/v1/auc/query`
  - `Authorization: Bearer; <token>`
  - request body carries `app / user / audio / request`
- Any earlier notes in this file about `api/v3/auc/bigmodel`, `resource_id`, or `VOLCENGINE_SPEECH_API_KEY` are historical trial records only and should no longer be treated as the current implementation direction.

### What Was Changed
- `vercel.json`
  - added `maxDuration: 60` for `api/telegram-webhook.js`
  - needed because voice flow may spend time on Telegram file download plus Volcengine async polling
- `api/telegram-webhook.js`
  - keeps secret-token validation
  - now returns `200` even when internal handling throws, to avoid Telegram retry storms
- `telegram/server.js`
  - local debug server now mirrors the same "always 200 on internal failure" behavior
- `telegram/services/telegramApi.js`
  - added `downloadTelegramFile()`
  - added `downloadTelegramFileAsBase64()`
  - connection layer now explicitly follows `getFile -> binary download -> Base64`
- `telegram/services/speechToText.js`
  - added `transcribeAudioBase64()`
  - Volcengine old async AUC flow is now the primary implementation for Telegram voice
- `telegram/handlers/telegramWebhook.js`
  - reply sending is treated as non-critical path
  - text and voice handling both use safe reply behavior
  - voice flow now directly consumes downloaded Base64 payload instead of depending on a third-party temporary URL

### Current Intended Stable Shape
- Deployment target:
  - Vercel serverless webhook
- Webhook route:
  - this repo currently uses `/api/telegram-webhook`
- Security:
  - `TELEGRAM_WEBHOOK_SECRET`
  - request header `x-telegram-bot-api-secret-token`
- Voice file path:
  - Telegram `getFile`
  - download binary from `https://api.telegram.org/file/bot<TOKEN>/<file_path>`
  - convert to Base64 inside our own service
  - send Base64 to Volcengine old async AUC API
- Failure strategy:
  - invalid secret -> `401`
  - unsupported / empty message -> `200`
  - business failure -> still `200`, optionally reply failure text to user

### Verification Status
- `npm.cmd run lint`
- `npm.cmd run build`
- Parser sample verification logic was unchanged by this step

### Remaining Blocker Before Real Telegram Validation
- Need to deploy current code to Vercel and point Telegram webhook to the stable public route
- After deployment, retest in order:
  1. `/start`
  2. plain text accounting message
  3. voice accounting message

## 2026-05-17 Production Telegram Webhook Closure

### What Was Finished
- Pushed Telegram webhook MVP commits to `main`
  - `a3db87c feat: add telegram webhook mvp flow`
  - `020ff28 fix: trim telegram deployment env values`
- Deployed production successfully to:
  - `https://bookkeeper-red.vercel.app`
- Confirmed live webhook route:
  - `GET https://bookkeeper-red.vercel.app/api/telegram-webhook` -> `200`
- Bound Telegram webhook to:
  - `https://bookkeeper-red.vercel.app/api/telegram-webhook`

### Production Env Added In Vercel
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_DEFAULT_CURRENCY`
- `VOLCENGINE_SPEECH_APPID`
- `VOLCENGINE_SPEECH_TOKEN`

### Hidden Issue Found During Production Validation
- Vercel CLI warned that added env values contained trailing newlines.
- This caused a real bug:
  - webhook secret comparison returned `401` even though the correct secret was configured
- Fix applied in `telegram/config.js`:
  - all relevant env string reads now go through `trim()`
- After redeploy, validation succeeded:
  - missing secret -> `401`
  - correct secret -> `200`

### Current Verified State
- `npm.cmd run verify:telegram-parser` passed
- `npm.cmd run lint` passed
- `npm.cmd run build` passed
- Production alias updated and serving latest deployment
- Telegram `getWebhookInfo` confirms webhook URL is now the production Vercel endpoint

### Next Real-World Check
- User should now send to the real bot in order:
  1. `/start`
  2. one plain text accounting message
  3. one voice accounting message
- At this point, remaining uncertainty is no longer connection architecture. It is only real-message behavior validation against the live bot and live Volcengine response.
