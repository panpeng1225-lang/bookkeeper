function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TRAILING_PUNCTUATION_RE = /[，,。.!！?？]+$/g;
const TRAILING_AMOUNT_PHRASE_RE =
  /(?:[，,、\s]*)?(?:花了|花费|花|用了|支出|付了|付|买了|买|交了|交)?\s*[0-9零一二两三四五六七八九十百千万亿点,.]+\s*(?:人民币|人名币|rmb|元(?:人民币|人名币)?|块钱|块|越南盾|越南顿|越盾|遇难顿|vnd|dong)\s*[，,。.!！?？]*$/i;

export function cleanNote(text, amountSource = '') {
  const input = String(text || '').trim();
  if (!input) return '';

  const escapedAmountSource = escapeRegExp(String(amountSource || '').trim());
  const bySourcePattern = escapedAmountSource
    ? new RegExp(
      `(?:[，,、\\s]*)` +
      `(?:花了|花费|花|用了|支出|付了|付|买了|买|交了|交)?` +
      `\\s*${escapedAmountSource}\\s*[，,。.!！?？]*$`,
      'i',
    )
    : null;

  const cleaned = input
    .replace(bySourcePattern || /$^/, '')
    .replace(TRAILING_AMOUNT_PHRASE_RE, '')
    .replace(TRAILING_PUNCTUATION_RE, '')
    .trim();

  return cleaned || input.replace(TRAILING_PUNCTUATION_RE, '').trim();
}
