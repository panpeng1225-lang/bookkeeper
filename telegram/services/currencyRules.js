const RMB_MARKERS = [
  '人民币',
  '人名币',
  'rmb',
  '元人民币',
  '元人名币',
  '块钱',
  '块',
  '元',
];

const VND_MARKERS = [
  '越南盾',
  '越南顿',
  '越盾',
  '遇难顿',
  'vnd',
  'dong',
];

const TRAILING_RMB_RE = /(?:人民币|人名币|rmb|元(?:人民币|人名币)?|块钱|块)\s*$/i;
const TRAILING_VND_RE = /(?:越南盾|越南顿|越盾|遇难顿|vnd|dong)\s*$/i;

export function detectCurrency(text, defaultCurrency = 'RMB') {
  const normalizedText = String(text || '').trim().toLowerCase();

  if (TRAILING_VND_RE.test(normalizedText)) {
    return 'VND';
  }

  if (TRAILING_RMB_RE.test(normalizedText)) {
    return 'RMB';
  }

  if (VND_MARKERS.some((marker) => normalizedText.includes(marker))) {
    return 'VND';
  }

  if (RMB_MARKERS.some((marker) => normalizedText.includes(marker))) {
    return 'RMB';
  }

  return defaultCurrency;
}

export { RMB_MARKERS, TRAILING_RMB_RE, TRAILING_VND_RE, VND_MARKERS };
