import { DEEPSEEK_API_URL, getDeepseekKey } from '../config/deepseek';
import { ALL_CATEGORIES } from '../config/categories';

const CATEGORY_IDS = ALL_CATEGORIES.map(c => c.id);

const SYSTEM_PROMPT = `你是一个账单识别助手。用户会发送账单照片或电子支付截图。
请从图片中识别以下信息并以JSON格式返回：
{
  "amount": 数字（金额，不含货币符号）,
  "currency": "VND" 或 "RMB"（根据货币符号判断，₫/đ/VND为VND，¥/￥/CNY/RMB为RMB，无法判断则为null）,
  "category": "${CATEGORY_IDS.join('|')}" 中的一个（根据消费内容判断，无法判断则为"other"）,
  "note": "简短描述消费内容，10字以内"
}

只返回JSON，不要其他文字。如果无法识别账单，返回 {"error": "无法识别"}`;

export async function recognizeBill(imageBase64) {
  const apiKey = getDeepseekKey();
  if (!apiKey) {
    throw new Error('请先在设置中配置 DeepSeek API Key');
  }

  // Remove data URL prefix if present
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Data}` },
            },
            { type: 'text', text: '请识别这张账单' },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API 错误: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('无法解析识别结果');

  const result = JSON.parse(jsonMatch[0]);
  if (result.error) throw new Error(result.error);

  // Validate category
  if (!CATEGORY_IDS.includes(result.category)) {
    result.category = 'other';
  }

  return result;
}
