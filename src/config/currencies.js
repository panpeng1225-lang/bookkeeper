// 币种配置
const CURRENCIES = {
  VND: { code: 'VND', symbol: '₫', label: '越南盾', locale: 'vi-VN', decimals: 0 },
  RMB: { code: 'RMB', symbol: '¥', label: '人民币', locale: 'zh-CN', decimals: 2 },
};

const DEFAULT_CURRENCY = 'VND';

// 格式化金额
function formatAmount(amount, currencyCode) {
  const c = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  return c.symbol + amount.toLocaleString(c.locale, {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
}

export { CURRENCIES, DEFAULT_CURRENCY, formatAmount };
