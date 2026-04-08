import { useMemo } from 'react';
import RecordItem from './RecordItem';
import { formatAmount } from '../config/currencies';

export default function RecordList({ records, onEdit }) {
  const grouped = useMemo(() => {
    const sorted = [...records].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    });
    const groups = {};
    sorted.forEach(r => {
      if (!groups[r.date]) groups[r.date] = [];
      groups[r.date].push(r);
    });
    return Object.entries(groups);
  }, [records]);

  if (records.length === 0) {
    return <div className="empty-state">还没有记录</div>;
  }

  return (
    <div className="record-list">
      {grouped.map(([date, items]) => {
        // 按币种分别统计当天支出
        const dayTotals = {};
        items.forEach(r => {
          if (r.category !== 'income') {
            const cur = r.currency || 'VND';
            dayTotals[cur] = (dayTotals[cur] || 0) + r.amount;
          }
        });
        const totalStr = Object.entries(dayTotals).map(([c, v]) => formatAmount(v, c)).join(' + ') || '0';

        return (
          <div key={date}>
            <div className="day-header">
              <span>{date}</span>
              <span className="day-total">支出 {totalStr}</span>
            </div>
            {items.map(r => (
              <RecordItem key={r.id} record={r} onClick={() => onEdit(r)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
