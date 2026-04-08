import { useMemo } from 'react';
import { CATEGORY_MAP } from '../../config/categories';

export default function RankingList({ records, formatFn }) {
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

  if (rankings.length === 0) {
    return <div className="chart-empty">该时段无支出记录</div>;
  }

  return (
    <div className="ranking-list">
      {rankings.map((item, i) => (
        <div key={item.id} className="ranking-item">
          <div className="ranking-header">
            <span className="ranking-rank">#{i + 1}</span>
            <span className="ranking-name">{item.icon} {item.label}</span>
            <span className="ranking-amount">{formatFn(item.amount)}</span>
          </div>
          <div className="ranking-bar-bg">
            <div
              className="ranking-bar-fill"
              style={{ width: `${Math.round(item.pct * 100)}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
