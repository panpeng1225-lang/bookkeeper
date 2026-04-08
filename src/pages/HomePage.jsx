import StatsCard from '../components/StatsCard';
import RecordItem from '../components/RecordItem';
import SwipeableItem from '../components/SwipeableItem';

export default function HomePage({ records, defaultCurrency, onNavigate, onEdit, onDelete, onSettings }) {
  const recent = [...records]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    })
    .slice(0, 8);

  return (
    <div className="page has-bottom-nav">
      <div className="home-header">
        <div className="home-title">
          <span className="home-logo">📒</span>
          <span>记账本</span>
        </div>
        <span className="settings-btn" onClick={onSettings}>⚙️</span>
      </div>

      <StatsCard records={records} defaultCurrency={defaultCurrency} />

      {/* Scan entry */}
      <div className="scan-entry" onClick={() => onNavigate('scan')}>
        <span className="scan-entry-icon">📷</span>
        <span className="scan-entry-text">扫描/上传账单，AI自动识别</span>
        <span className="scan-entry-arrow">→</span>
      </div>

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
            <SwipeableItem
              key={r.id}
              onEdit={() => onEdit(r)}
              onDelete={() => onDelete(r.id)}
            >
              <RecordItem record={r} />
            </SwipeableItem>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <div className="bottom-nav">
        <div className="nav-item active" onClick={() => onNavigate('home')}>
          <span className="nav-item-icon">📒</span>
          <span>首页</span>
        </div>
        <div className="nav-item add-btn" onClick={() => onNavigate('add')}>
          <span className="nav-item-add">＋</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate('stats')}>
          <span className="nav-item-icon">📊</span>
          <span>统计</span>
        </div>
      </div>
    </div>
  );
}
