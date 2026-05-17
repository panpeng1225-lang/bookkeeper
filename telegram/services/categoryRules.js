const CATEGORY_RULES = [
  {
    category: 'entertainment',
    keywords: ['电影', '电影票', '游戏', '唱歌', 'ktv', '娱乐', '门票', '台球'],
  },
  {
    category: 'food',
    keywords: [
      '吃饭',
      '吃',
      '午饭',
      '晚饭',
      '早餐',
      '夜宵',
      '盒饭',
      '咖啡',
      '星巴克',
      '奶茶',
      '饮料',
      '餐厅',
      '外卖',
      '麦当劳',
      '自助',
      '必胜客',
      '蜜雪冰城',
      '汉堡',
      '爆米花',
      '烤肉',
      '甜品',
      '甜品店',
      '糖水',
      '哈根达斯',
      '冰激凌',
      '冰淇淋',
      '炸鸡',
      '泡面',
    ],
  },
  {
    category: 'transport',
    keywords: [
      '打车',
      '滴滴',
      'grab',
      'grub',
      '地铁',
      '公交',
      '加油',
      '高速',
      '停车',
      '停车费',
      '车费',
      '汽车',
      '摩托车',
      '坐车',
    ],
  },
  {
    category: 'housing',
    keywords: ['房租', '酒店', '住宿', '水费', '电费', '燃气', '物业'],
  },
  {
    category: 'shopping',
    keywords: [
      '超市',
      '淘宝',
      '京东',
      '购物',
      '衣服',
      '鞋',
      '日用品',
      '买菜',
      '薯片',
      '永旺',
      '猪排骨',
      '排骨',
      '土豆',
      '胡萝卜',
      '酸奶',
    ],
  },
  {
    category: 'baby',
    keywords: ['奶粉', '尿布', '宝宝', '金宝', '婴儿', '玩具', '纸尿裤'],
  },
];

export function matchCategory(text) {
  const normalizedText = String(text || '').trim().toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => normalizedText.includes(keyword))) {
      return rule.category;
    }
  }

  return 'other';
}

export { CATEGORY_RULES };
