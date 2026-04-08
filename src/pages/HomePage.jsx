import { useRef } from 'react';
import StatsCard from '../components/StatsCard';
import RecordItem from '../components/RecordItem';
import SwipeableItem from '../components/SwipeableItem';

export default function HomePage({ records, defaultCurrency, onNavigate, onEdit, onDelete, onSettings, onCameraCapture }) {
  const cameraRef = useRef(null);

  const recent = [...records]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    })
    .slice(0, 8);

  const handleCameraFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Compress before sending
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > 800) { h = Math.round(h * 800 / w); w = 800; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        onCameraCapture(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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

      {/* Hidden camera/gallery input */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleCameraFile}
      />

      {/* Bottom nav */}
      <div className="bottom-nav">
        <div className="nav-item active" onClick={() => onNavigate('home')}>
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>首页</span>
        </div>
        <div className="nav-item action-btn" onClick={() => onNavigate('add')}>
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>记账</span>
        </div>
        <div className="nav-item action-btn" onClick={() => cameraRef.current?.click()}>
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span>拍照</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate('stats')}>
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          <span>统计</span>
        </div>
      </div>
    </div>
  );
}
