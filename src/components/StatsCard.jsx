import { useMemo } from 'react';
import { formatAmount } from '../config/currencies';

export default function StatsCard({ records, defaultCurrency }) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = now.toISOString().slice(0, 10);

    let monthExpense = { VND: 0, RMB: 0 };
    let monthIncome = { VND: 0, RMB: 0 };
    let todayExpense = { VND: 0, RMB: 0 };

    records.forEach(r => {
      const cur = r.currency || 'VND';
      const isIncome = r.category === 'income';
      if (r.date.startsWith(thisMonth)) {
        if (isIncome) monthIncome[cur] += r.amount;
        else monthExpense[cur] += r.amount;
      }
      if (r.date === today && !isIncome) {
        todayExpense[cur] += r.amount;
      }
    });

    return { monthExpense, monthIncome, todayExpense };
  }, [records]);

  const dc = defaultCurrency;

  // 显示有数据的币种，默认币种优先
  const renderAmount = (data, color) => {
    const entries = Object.entries(data).filter(([, v]) => v > 0);
    if (entries.length === 0) return <span style={{ color, fontSize: 20, fontWeight: 500 }}>{formatAmount(0, dc)}</span>;
    return entries.map(([cur, val]) => (
      <span key={cur} style={{ color, fontSize: 20, fontWeight: 500, display: 'block' }}>
        {formatAmount(val, cur)}
      </span>
    ));
  };

  return (
    <div className="stats-card">
      <div className="stats-row">
        <div className="stat-block">
          <div className="stat-label">本月支出</div>
          {renderAmount(stats.monthExpense, 'var(--c-expense)')}
        </div>
        <div className="stat-divider" />
        <div className="stat-block">
          <div className="stat-label">本月收入</div>
          {renderAmount(stats.monthIncome, 'var(--c-income)')}
        </div>
      </div>
      <div className="today-bar">
        今日支出：{Object.entries(stats.todayExpense).filter(([,v]) => v > 0).map(([cur, val]) => formatAmount(val, cur)).join(' + ') || formatAmount(0, dc)}
      </div>
    </div>
  );
}
