const RATE_KEY = 'bookkeeper_exchange_rate';

// 默认汇率: 1 RMB = 3,400 VND (大概)
const DEFAULT_RATE = 3400;

export function getExchangeRate() {
  const saved = localStorage.getItem(RATE_KEY);
  return saved ? parseFloat(saved) : DEFAULT_RATE;
}

export function saveExchangeRate(rate) {
  localStorage.setItem(RATE_KEY, String(rate));
}

// VND → RMB
export function vndToRmb(vnd, rate) {
  return vnd / (rate || getExchangeRate());
}

// RMB → VND
export function rmbToVnd(rmb, rate) {
  return rmb * (rate || getExchangeRate());
}

// 将任意币种金额转为指定目标币种
export function convertAmount(amount, fromCurrency, toCurrency, rate) {
  if (fromCurrency === toCurrency) return amount;
  const r = rate || getExchangeRate();
  if (fromCurrency === 'VND' && toCurrency === 'RMB') return amount / r;
  if (fromCurrency === 'RMB' && toCurrency === 'VND') return amount * r;
  return amount;
}
