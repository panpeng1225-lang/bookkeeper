// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// API key 从 localStorage 读取，在设置页配置
export function getDeepseekKey() {
  return localStorage.getItem('bookkeeper_deepseek_key') || '';
}

export function saveDeepseekKey(key) {
  localStorage.setItem('bookkeeper_deepseek_key', key);
}

export { DEEPSEEK_API_URL };
