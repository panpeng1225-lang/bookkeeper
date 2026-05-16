const CHINESE_DIGITS = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const SMALL_UNITS = {
  十: 10,
  百: 100,
  千: 1000,
};

const LARGE_UNITS = {
  万: 10000,
  亿: 100000000,
};

const AMOUNT_TOKEN_RE = '[0-9零一二两三四五六七八九十百千万亿点.,]+';

function normalizeAmountText(text) {
  return String(text || '')
    .replace(/[，,]/g, '')
    .replace(/[。]/g, '.')
    .trim();
}

function parseChineseIntegerPart(text) {
  if (!text) return 0;

  let total = 0;
  let section = 0;
  let number = 0;

  for (const char of text) {
    if (char in CHINESE_DIGITS) {
      number = CHINESE_DIGITS[char];
      continue;
    }

    if (char in SMALL_UNITS) {
      const unit = SMALL_UNITS[char];
      section += (number || 1) * unit;
      number = 0;
      continue;
    }

    if (char in LARGE_UNITS) {
      const unit = LARGE_UNITS[char];
      section += number;
      total += (section || 1) * unit;
      section = 0;
      number = 0;
    }
  }

  return total + section + number;
}

export function parseAmountToken(token) {
  const normalized = normalizeAmountText(token);
  if (!normalized) return null;

  if (/^\d+(\.\d+)?$/.test(normalized)) {
    return Number(normalized);
  }

  const parts = normalized.split('点');
  const integerPart = parseChineseIntegerPart(parts[0]);

  if (parts.length === 1) {
    return integerPart || null;
  }

  const decimalDigits = [...parts[1]]
    .map((char) => CHINESE_DIGITS[char])
    .filter((value) => value !== undefined)
    .join('');

  if (!decimalDigits) {
    return integerPart || null;
  }

  return Number(`${integerPart}.${decimalDigits}`);
}

function buildCandidate(token, source) {
  const amount = parseAmountToken(token);
  if (amount == null || Number.isNaN(amount) || amount <= 0) return null;
  return { amount, source };
}

export function extractAmount(text) {
  const normalizedText = normalizeAmountText(text);
  if (!normalizedText) return null;

  const patterns = [
    new RegExp(`(${AMOUNT_TOKEN_RE})\\s*(人民币|rmb|元|块钱|块|越盾|vnd|dong|đ|₫)`, 'i'),
    new RegExp(`(?:花了|花费|花|用了|支出|付了|付|买了|买|交了|交)\\s*(${AMOUNT_TOKEN_RE})`, 'i'),
    new RegExp(`(${AMOUNT_TOKEN_RE})`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (!match) continue;

    const candidate = buildCandidate(match[1], match[0]);
    if (candidate) return candidate;
  }

  return null;
}
