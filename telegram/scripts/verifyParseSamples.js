/* global process */

import { parseRecordText } from '../services/parseRecordText.js';

const fixedNow = new Date('2026-05-16T09:30:00');

const samples = [
  {
    text: '中午吃饭 35 块',
    expected: { amount: 35, currency: 'RMB', category: 'food', note: '中午吃饭' },
  },
  {
    text: '打车 120000 越盾',
    expected: { amount: 120000, currency: 'VND', category: 'transport', note: '打车' },
  },
  {
    text: '买奶粉 260 人民币',
    expected: { amount: 260, currency: 'RMB', category: 'baby', note: '买奶粉' },
  },
  {
    text: '超市买东西 89',
    expected: { amount: 89, currency: 'RMB', category: 'shopping', note: '超市买东西' },
  },
  {
    text: '交房租 3000',
    expected: { amount: 3000, currency: 'RMB', category: 'housing', note: '交房租' },
  },
  {
    text: '刚才看电影花了 58 元',
    expected: { amount: 58, currency: 'RMB', category: 'entertainment', note: '刚才看电影' },
  },
  {
    text: '买纸巾 25',
    expected: { amount: 25, currency: 'RMB', category: 'other', note: '买纸巾' },
  },
  {
    text: '今天中午吃饭三十五块',
    expected: { amount: 35, currency: 'RMB', category: 'food', note: '今天中午吃饭' },
  },
  {
    text: '刚才打车花了十二万越盾',
    expected: { amount: 120000, currency: 'VND', category: 'transport', note: '刚才打车' },
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
  {
    text: '去 sample day 吃自助花了434,000越南盾',
    expected: { amount: 434000, currency: 'VND', category: 'food', note: '去 sample day 吃自助' },
  },
  {
    text: '去买电影票和爆米花和碧草，花了362,000悦能盾',
    expected: { amount: 362000, currency: 'VND', category: 'entertainment', note: '去买电影票和爆米花和碧草' },
  },
  {
    text: '坐 grab 汽车从小明家去环境湖花了9万越南盾',
    expected: { amount: 90000, currency: 'VND', category: 'transport', note: '坐 grab 汽车从小明家去环境湖' },
  },
  {
    text: '坐 Grub 摩托车去见崔琼，然后回 mastery 花了37,000越南盾',
    expected: { amount: 37000, currency: 'VND', category: 'transport', note: '坐 Grub 摩托车去见崔琼，然后回 mastery' },
  },
  {
    text: '喝了一杯蜜雪冰城，花了22,000越南盾',
    expected: { amount: 22000, currency: 'VND', category: 'food', note: '喝了一杯蜜雪冰城' },
  },
  {
    text: '晚上吃了两个汉堡花了11万，玉南顿',
    expected: { amount: 110000, currency: 'VND', category: 'food', note: '晚上吃了两个汉堡' },
  },
  {
    text: '今天晚上和阿通打台球花了88,000越南盾',
    expected: { amount: 88000, currency: 'VND', category: 'entertainment', note: '今天晚上和阿通打台球' },
  },
  {
    text: '买了包薯片，花了呃一一万元南顿',
    expected: { amount: 10000, currency: 'VND', category: 'shopping', note: '买了包薯片' },
  },
  {
    text: '和英英勇一起喝星巴克，花了17万元伦敦',
    expected: { amount: 170000, currency: 'VND', category: 'food', note: '和英英勇一起喝星巴克' },
  },
  {
    text: '何小明吃烤肉花了31万越南吨',
    expected: { amount: 310000, currency: 'VND', category: 'food', note: '何小明吃烤肉' },
  },
  {
    text: '去甜品店喝糖水，何小明花了11万越南盾',
    expected: { amount: 110000, currency: 'VND', category: 'food', note: '去甜品店喝糖水，何小明' },
  },
  {
    text: '戴小明吃哈根达斯花了29万玉伦炖',
    expected: { amount: 290000, currency: 'VND', category: 'food', note: '戴小明吃哈根达斯' },
  },
  {
    text: '点外卖炸鸡给小明花了12万越南炖',
    expected: { amount: 120000, currency: 'VND', category: 'food', note: '点外卖炸鸡给小明' },
  },
  {
    text: '在永旺买猪排骨，土豆胡萝卜酸奶，奶闹和小明一起花了41万越南吞',
    expected: { amount: 410000, currency: 'VND', category: 'shopping', note: '在永旺买猪排骨，土豆胡萝卜酸奶，奶闹和小明一起' },
  },
  {
    text: '帮小明给摩托车缴停车费花了6,300玉伦吨',
    expected: { amount: 6300, currency: 'VND', category: 'transport', note: '帮小明给摩托车缴停车费' },
  },
  {
    text: '中午吃盒饭花了65,000越南盾',
    expected: { amount: 65000, currency: 'VND', category: 'food', note: '中午吃盒饭' },
  },
  {
    text: '吃韩式炸鸡和泡面花了32万元',
    expected: { amount: 320000, currency: 'VND', category: 'food', note: '吃韩式炸鸡和泡面' },
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
