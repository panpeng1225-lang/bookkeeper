import StatsCard from '../components/StatsCard';
import RecordItem from '../components/RecordItem';

export default function HomePage({ records, defaultCurrency, onNavigate, onEdit, onSettings }) {
  const recent = [...records]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    })
    .slice(0, 5);

  return (
    <div className="page">
      <div className="home-header">
        <div className="home-title">
          <span className="home-logo">📒</span>
          <span>记账本</span>
        </div>
        <span className="settings-btn" onClick={onSettings}>⚙️</span>
      </div>

      <StatsCard records={records} defaultCurrency={defaultCurrency} />

      <div className="section-header">
        <span className="section-title">最近记录</span>
        {records.length > 0 && (
          <span className="view-all" onClick={() => onNavigate('list')}>查看全部 →</span>
        )}
      </div>

      {records.length === 0 ? (
        <div className="empty-state">还没有记录，点击下方按钮开始记账</div>
      ) : (
        <div className="recent-list">
          {recent.map(r => (
            <RecordItem key={r.id} record={r} onClick={() => onEdit(r)} />
          ))}
        </div>
      )}

      <button className="fab" onClick={() => onNavigate('add')}>＋ 记一笔</button>
    </div>
  );
}
