import { DOUBAO_API_URL, DOUBAO_DEFAULT_MODEL, getVisionApiKey } from '../config/deepseek';
import { ALL_CATEGORIES } from '../config/categories';

const CATEGORY_IDS = ALL_CATEGORIES.map(c => c.id);

const SYSTEM_PROMPT = `你是一个账单识别助手。用户会发送账单照片或电子支付截图。
请从图片中识别以下信息并以JSON格式返回：
{
  "amount": 数字（金额，不含货币符号）,
  "currency": "VND" 或 "RMB"（根据货币符号判断，₫/đ/VND为VND，¥/￥/CNY/RMB为RMB，无法判断则为null）,
  "category": "${CATEGORY_IDS.join('|')}" 中的一个（根据消费内容判断，无法判断则为"other"）,
  "note": "简短描述消费内容，10字以内",
  "date": "YYYY-MM-DD格式的日期（从图片中识别交易日期，注意日期格式可能是DD/MM/YYYY，请转换为YYYY-MM-DD。无法识别则为null）",
  "time": "HH:MM格式的时间（从图片中识别交易时间，无法识别则为null）"
}

只返回JSON，不要其他文字。如果无法识别账单，返回 {"error": "无法识别"}`;

async function callApi(imageUrl, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DOUBAO_DEFAULT_MODEL,
        input: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'input_image', image_url: imageUrl },
              { type: 'input_text', text: '请识别这张账单的金额、币种、分类、日期和时间' },
            ],
          },
        ],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      throw new Error('API ' + response.status + ': ' + err.slice(0, 200));
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('请求超时，正在重试...');
    }
    throw err;
  }
}

function parseResponse(data) {
  let text = '';
  if (data.output) {
    for (const item of data.output) {
      if (item.type === 'message' && item.content) {
        for (const part of item.content) {
          if (part.type === 'output_text') text += part.text;
        }
      }
    }
  }
  if (!text && data.choices && data.choices[0] && data.choices[0].message) {
    text = data.choices[0].message.content;
  }
  if (!text) throw new Error('API 返回为空');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('无法解析识别结果');

  const result = JSON.parse(jsonMatch[0]);
  if (result.error) throw new Error(result.error);

  if (!CATEGORY_IDS.includes(result.category)) {
    result.category = 'other';
  }
  return result;
}

export async function recognizeBill(imageBase64, onStatus) {
  const apiKey = getVisionApiKey();
  if (!apiKey) {
    throw new Error('请先在设置中配置豆包 API Key');
  }

  let imageUrl = imageBase64;
  if (!imageBase64.startsWith('data:')) {
    imageUrl = 'data:image/jpeg;base64,' + imageBase64;
  }

  const MAX_RETRIES = 3;
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (onStatus) {
        if (attempt === 0) onStatus('正在识别...');
        else onStatus('第' + (attempt + 1) + '次尝试...');
      }
      const data = await callApi(imageUrl, apiKey);
      return parseResponse(data);
    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      const isRetryable = msg.includes('load') || msg.includes('超时') ||
        msg.includes('network') || msg.includes('Failed') ||
        msg.includes('fetch') || msg.includes('AbortError');
      if (attempt < MAX_RETRIES - 1 && isRetryable) {
        const wait = (attempt + 1) * 2000;
        if (onStatus) onStatus('网络不稳定，' + Math.round(wait / 1000) + '秒后重试...');
        await new Promise(function(r) { setTimeout(r, wait); });
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
