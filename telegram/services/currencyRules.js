const RMB_MARKERS = [
  '人民币',
  '人名币',
  'rmb',
  '元人民币',
  '元人名币',
  '块钱',
  '块',
];

const VND_MARKERS = [
  '越南盾',
  '越南顿',
  '越南吨',
  '越南炖',
  '越南吞',
  '越盾',
  '遇难顿',
  '悦能盾',
  '元南顿',
  '元伦敦',
  '玉南顿',
  '玉伦炖',
  '玉伦吨',
  'vnd',
  'dong',
];

const AMOUNT_TOKEN_RE = '[0-9零一二两三四五六七八九十百千万亿点,.]+';
const TRAILING_RMB_RE = /(?:人民币|人名币|rmb|元(?:人民币|人名币)?|块钱|块)\s*$/i;
const TRAILING_VND_RE = /(?:越南盾|越南顿|越南吨|越南炖|越南吞|越盾|遇难顿|悦能盾|元南顿|元伦敦|玉南顿|玉伦炖|玉伦吨|vnd|dong)\s*$/i;

function levenshtein(a, b) {
  const left = [...String(a || '')];
  const right = [...String(b || '')];
  const dp = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let i = 0; i <= left.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[left.length][right.length];
}

function extractTrailingCurrencyCandidate(text) {
  const normalizedText = String(text || '').trim().toLowerCase();
  const matches = [...normalizedText.matchAll(new RegExp(`(${AMOUNT_TOKEN_RE})\\s*([^0-9零一二两三四五六七八九十百千万亿点,.\\s，,。.!！?？]*)`, 'gi'))];
  const last = matches.at(-1);
  if (!last) return null;

  const amountToken = last[1] || '';
  const tail = String(last[2] || '').replace(/[，,。.!！?？、\s]/g, '');
  const lastThree = [...tail].slice(-3).join('');

  return {
    amountToken,
    tail,
    lastThree,
  };
}

function detectByTrailingSimilarity(text) {
  const candidate = extractTrailingCurrencyCandidate(text);
  if (!candidate?.lastThree) return '';

  if (VND_MARKERS.some((marker) => candidate.tail.includes(marker))) {
    return 'VND';
  }

  if (RMB_MARKERS.some((marker) => candidate.tail.includes(marker))) {
    return 'RMB';
  }

  // In this app's voice habit, "xx万元" is usually a bad transcription of "xx万越南盾".
  if (candidate.amountToken.includes('万') && candidate.tail === '元') {
    return 'VND';
  }

  const rmbDistance = levenshtein(candidate.lastThree, '人民币');
  const vndDistance = levenshtein(candidate.lastThree, '越南盾');

  if (vndDistance < rmbDistance && vndDistance <= 2) {
    return 'VND';
  }

  if (rmbDistance < vndDistance && rmbDistance <= 2) {
    return 'RMB';
  }

  return '';
}

export function detectCurrency(text, defaultCurrency = 'RMB') {
  const normalizedText = String(text || '').trim().toLowerCase();
  const trailingCurrency = detectByTrailingSimilarity(normalizedText);

  if (trailingCurrency) {
    return trailingCurrency;
  }

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
