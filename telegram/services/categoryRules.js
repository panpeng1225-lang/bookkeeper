const CATEGORY_RULES = [
  {
    category: 'baby',
    keywords: ['奶粉', '尿布', '宝宝', '金宝', '婴儿', '玩具', '纸尿裤'],
  },
  {
    category: 'food',
    keywords: ['吃饭', '午饭', '晚饭', '早餐', '夜宵', '咖啡', '奶茶', '饮料', '餐厅', '外卖'],
  },
  {
    category: 'transport',
    keywords: ['打车', '滴滴', '地铁', '公交', '加油', '高速', '停车', '车费'],
  },
  {
    category: 'housing',
    keywords: ['房租', '酒店', '住宿', '水费', '电费', '燃气', '物业'],
  },
  {
    category: 'entertainment',
    keywords: ['电影', '游戏', '唱歌', 'ktv', '娱乐', '门票'],
  },
  {
    category: 'shopping',
    keywords: ['超市', '淘宝', '京东', '购物', '衣服', '鞋', '日用品', '买菜'],
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
