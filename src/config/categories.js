// 分类配置 — 增删改分类只需修改这里
const CATEGORIES = [
  { id: 'food',          icon: '🍜', label: '餐饮', color: '#D85A30', bg: '#FAECE7' },
  { id: 'transport',     icon: '🚗', label: '交通', color: '#378ADD', bg: '#E6F1FB' },
  { id: 'shopping',      icon: '🛍️', label: '购物', color: '#534AB7', bg: '#EEEDFE' },
  { id: 'housing',       icon: '🏠', label: '住房', color: '#D4537E', bg: '#FBEAF0' },
  { id: 'entertainment', icon: '🎬', label: '娱乐', color: '#BA7517', bg: '#FAEEDA' },
  { id: 'baby',          icon: '👶', label: '金宝', color: '#1D9E75', bg: '#E1F5EE' },
  { id: 'other',         icon: '📌', label: '其他', color: '#888780', bg: '#F1EFE8' },
];

// 收入单独定义，不在支出分类中
const INCOME_CATEGORY = { id: 'income', icon: '💰', label: '收入', color: '#27ae60', bg: '#EAF3DE' };

// 所有分类（含收入）
const ALL_CATEGORIES = [...CATEGORIES, INCOME_CATEGORY];

// 快速查找 map
const CATEGORY_MAP = Object.fromEntries(ALL_CATEGORIES.map(c => [c.id, c]));

export { CATEGORIES, INCOME_CATEGORY, ALL_CATEGORIES, CATEGORY_MAP };
