// 豆包（火山引擎）视觉模型 API 配置
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DOUBAO_DEFAULT_MODEL = 'doubao-1.5-vision-pro-250328';

// API key 从 localStorage 读取，在设置页配置
export function getVisionApiKey() {
  return localStorage.getItem('bookkeeper_vision_key') || '';
}

export function saveVisionApiKey(key) {
  localStorage.setItem('bookkeeper_vision_key', key);
}

export { DOUBAO_API_URL, DOUBAO_DEFAULT_MODEL };
