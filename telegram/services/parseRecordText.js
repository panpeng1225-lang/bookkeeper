import { extractAmount } from './amountRules.js';
import { matchCategory } from './categoryRules.js';
import { detectCurrency } from './currencyRules.js';
import { cleanNote } from './noteRules.js';

export function parseRecordText(text, options = {}) {
  const input = String(text || '').trim();
  const defaultCurrency = options.defaultCurrency || 'RMB';
  const now = options.now instanceof Date ? options.now : new Date();

  if (!input) {
    return {
      ok: false,
      error: 'EMPTY_TEXT',
      message: '输入内容为空',
    };
  }

  const amountResult = extractAmount(input);
  if (!amountResult) {
    return {
      ok: false,
      error: 'AMOUNT_NOT_FOUND',
      message: '未识别到金额',
      rawText: input,
    };
  }

  return {
    ok: true,
    record: {
      amount: amountResult.amount,
      currency: detectCurrency(input, defaultCurrency),
      category: matchCategory(input),
      note: cleanNote(input, amountResult.source),
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      tag: '',
    },
    meta: {
      amountSource: amountResult.source,
      parserVersion: 'stage5-rules-save-ready',
    },
  };
}
