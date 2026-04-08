import { CATEGORY_MAP } from '../config/categories';
import { formatAmount } from '../config/currencies';

export default function RecordItem({ record, onClick }) {
  const cat = CATEGORY_MAP[record.category] || { icon: '📌', label: '其他', bg: '#F1EFE8' };
  const isIncome = record.category === 'income';

  return (
    <div className="record-item" onClick={onClick} role="button">
      <span className="record-icon" style={{ background: cat.bg }}>{cat.icon}</span>
      <div className="record-info">
        <div className="record-label">{cat.label}{record.note ? ` · ${record.note}` : ''}</div>
        <div className="record-date">{record.date} {record.time}</div>
      </div>
      <span className={`record-amount ${isIncome ? 'income' : 'expense'}`}>
        {isIncome ? '+' : '-'}{formatAmount(record.amount, record.currency)}
      </span>
    </div>
  );
}
