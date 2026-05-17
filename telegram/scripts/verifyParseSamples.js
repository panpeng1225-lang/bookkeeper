/* global process */

import { parseRecordText } from '../services/parseRecordText.js';

const fixedNow = new Date('2026-05-16T09:30:00');

const samples = [
  {
    text: '中午吃饭 35 块',
    expected: { amount: 35, currency: 'RMB', category: 'food' },
  },
  {
    text: '打车 120000 越盾',
    expected: { amount: 120000, currency: 'VND', category: 'transport' },
  },
  {
    text: '买奶粉 260 人民币',
    expected: { amount: 260, currency: 'RMB', category: 'baby' },
  },
  {
    text: '超市买东西 89',
    expected: { amount: 89, currency: 'RMB', category: 'shopping' },
  },
  {
    text: '交房租 3000',
    expected: { amount: 3000, currency: 'RMB', category: 'housing' },
  },
  {
    text: '刚才看电影花了 58 元',
    expected: { amount: 58, currency: 'RMB', category: 'entertainment' },
  },
  {
    text: '买纸巾 25',
    expected: { amount: 25, currency: 'RMB', category: 'other' },
  },
  {
    text: '今天中午吃饭三十五块',
    expected: { amount: 35, currency: 'RMB', category: 'food' },
  },
  {
    text: '刚才打车花了十二万越盾',
    expected: { amount: 120000, currency: 'VND', category: 'transport' },
  },
  {
    text: '刚刚和天哥喝咖啡花了15万越南盾',
    expected: { amount: 150000, currency: 'VND', category: 'food', note: '刚刚和天哥喝咖啡' },
  },
  {
    text: '刚刚和天哥喝咖啡花了15万遇难顿',
    expected: { amount: 150000, currency: 'VND', category: 'food', note: '刚刚和天哥喝咖啡' },
  },
  {
    text: '刚刚给金宝买衣服花了200元人民币',
    expected: { amount: 200, currency: 'RMB', category: 'shopping', note: '刚刚给金宝买衣服' },
  },
  {
    text: '刚刚吃麦当劳花了20万越南盾',
    expected: { amount: 200000, currency: 'VND', category: 'food', note: '刚刚吃麦当劳' },
  },
  {
    text: '刚刚给金宝买衣服花了200元人名币',
    expected: { amount: 200, currency: 'RMB', category: 'shopping', note: '刚刚给金宝买衣服' },
  },
];

let hasFailure = false;

for (const sample of samples) {
  const result = parseRecordText(sample.text, {
    defaultCurrency: 'RMB',
    now: fixedNow,
  });

  if (!result.ok) {
    hasFailure = true;
    console.error(`FAIL: ${sample.text}`);
    console.error(`  parser error: ${result.error}`);
    continue;
  }

  const actual = {
    amount: result.record.amount,
    currency: result.record.currency,
    category: result.record.category,
    note: result.record.note,
  };

  const matched = Object.entries(sample.expected).every(([key, value]) => actual[key] === value);

  if (!matched) {
    hasFailure = true;
    console.error(`FAIL: ${sample.text}`);
    console.error(`  expected: ${JSON.stringify(sample.expected)}`);
    console.error(`  actual:   ${JSON.stringify(actual)}`);
    continue;
  }

  console.log(`PASS: ${sample.text}`);
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log('\nAll parser samples passed.');
}
