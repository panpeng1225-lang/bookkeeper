import { DOUBAO_API_URL, DOUBAO_DEFAULT_MODEL, getVisionApiKey } from '../config/deepseek';
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
  const apiKey = getVisionApiKey();
  if (!apiKey) {
    throw new Error('请先在设置中配置豆包 API Key');
  }

  // Build data URL for the image
  let imageUrl = imageBase64;
  if (!imageBase64.startsWith('data:')) {
    imageUrl = `data:image/jpeg;base64,${imageBase64}`;
  }

  const response = await fetch(DOUBAO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DOUBAO_DEFAULT_MODEL,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: imageUrl,
            },
            {
              type: 'input_text',
              text: '请识别这张账单',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API 错误: ${response.status} ${err}`);
  }

  const data = await response.json();

  // Extract text from Responses API output
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
  if (!text && data.choices?.[0]?.message?.content) {
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
