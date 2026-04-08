import { useMemo } from 'react';
import { CATEGORY_MAP } from '../../config/categories';

export default function DonutChart({ records, formatFn }) {
  const data = useMemo(() => {
    const totals = {};
    records.forEach(r => {
      if (r.category === 'income') return;
      totals[r.category] = (totals[r.category] || 0) + (r._converted || 0);
    });
    const entries = Object.entries(totals)
      .map(([id, amount]) => ({ ...CATEGORY_MAP[id], amount }))
      .sort((a, b) => b.amount - a.amount);
    const total = entries.reduce((s, e) => s + e.amount, 0);
    // Add pct to each entry
    entries.forEach(e => { e.pct = total > 0 ? e.amount / total : 0; });
    return { entries, total };
  }, [records]);

  if (data.total === 0) {
    return <div className="chart-empty">该时段无支出记录</div>;
  }

  // Build donut segments
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.entries.map(entry => {
    const pct = entry.amount / data.total;
    const dash = pct * circumference;
    const seg = { ...entry, pct, dash, offset };
    offset -= dash;
    return seg;
  });

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 140 140" className="donut-svg">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--bg-secondary)" strokeWidth="18" />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset}
            transform="rotate(-90 70 70)"
          />
        ))}
        <text x="70" y="66" textAnchor="middle" className="donut-total">{formatFn(data.total)}</text>
        <text x="70" y="82" textAnchor="middle" className="donut-label">总支出</text>
      </svg>

      <div className="donut-legend">
        {data.entries.map(e => (
          <div key={e.id} className="legend-item">
            <span className="legend-dot" style={{ background: e.color }} />
            <span className="legend-name">{e.icon} {e.label}</span>
            <span className="legend-amount">{formatFn(e.amount)}</span>
            <span className="legend-pct">{Math.round(e.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
