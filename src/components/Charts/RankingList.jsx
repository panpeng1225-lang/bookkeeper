import { useState, useMemo } from 'react';
import { CATEGORY_MAP } from '../../config/categories';

export default function RankingList({ records, formatFn }) {
  const [expanded, setExpanded] = useState(null); // category id
  const [showMore, setShowMore] = useState({}); // { categoryId: page }

  const rankings = useMemo(() => {
    const totals = {};
    records.forEach(r => {
      if (r.category === 'income') return;
      totals[r.category] = (totals[r.category] || 0) + r._converted;
    });
    const entries = Object.entries(totals)
      .map(([id, amount]) => ({ ...CATEGORY_MAP[id], amount }))
      .sort((a, b) => b.amount - a.amount);
    const max = entries[0]?.amount || 1;
    return entries.map(e => ({ ...e, pct: e.amount / max }));
  }, [records]);

  // Get detail records for a category, sorted by amount desc
  const getDetails = (categoryId, page) => {
    const items = records
      .filter(r => r.category === categoryId)
      .sort((a, b) => b._converted - a._converted);
    const limit = (page || 1) * 10;
    const visible = items.slice(0, limit);
    const hasMore = items.length > limit;
    return { visible, hasMore, total: items.length };
  };

  const handlePress = (categoryId) => {
    if (expanded === categoryId) {
      setExpanded(null);
    } else {
      setExpanded(categoryId);
      setShowMore(prev => ({ ...prev, [categoryId]: 1 }));
    }
  };

  const handleMore = (categoryId) => {
    setShowMore(prev => ({ ...prev, [categoryId]: (prev[categoryId] || 1) + 1 }));
  };

  if (rankings.length === 0) {
    return <div className="chart-empty">该时段无支出记录</div>;
  }

  return (
    <div className="ranking-list">
      {rankings.map((item, i) => {
        const isOpen = expanded === item.id;
        const details = isOpen ? getDetails(item.id, showMore[item.id]) : null;

        return (
          <div key={item.id} className="ranking-item">
            <div className="ranking-header" onClick={() => handlePress(item.id)}>
              <span className="ranking-rank">#{i + 1}</span>
              <span className="ranking-name">{item.icon} {item.label}</span>
              <span className="ranking-amount">{formatFn(item.amount)}</span>
              <span className={`ranking-arrow ${isOpen ? 'open' : ''}`}>▸</span>
            </div>
            <div className="ranking-bar-bg">
              <div
                className="ranking-bar-fill"
                style={{ width: `${Math.round(item.pct * 100)}%`, background: item.color }}
              />
            </div>

            {isOpen && details && (
              <div className="ranking-details">
                {details.visible.map((r, j) => (
                  <div key={r.id || j} className="ranking-detail-row">
                    <span className="ranking-detail-idx">{j + 1}.</span>
                    <span className="ranking-detail-note">{r.note || '-'}</span>
                    <span className="ranking-detail-date">{r.date}</span>
                    <span className="ranking-detail-amount">{formatFn(r._converted)}</span>
                  </div>
                ))}
                {details.hasMore && (
                  <div className="ranking-more" onClick={() => handleMore(item.id)}>
                    更多...（共{details.total}条）
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
