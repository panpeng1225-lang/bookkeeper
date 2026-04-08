import { useMemo } from 'react';

export default function TrendLine({ records, formatFn }) {
  const data = useMemo(() => {
    // Group by month
    const monthly = {};
    records.forEach(r => {
      if (r.category === 'income') return;
      const month = r.date.slice(0, 7); // YYYY-MM
      monthly[month] = (monthly[month] || 0) + r._converted;
    });
    const entries = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([month, amount]) => ({
      label: month.slice(5), // MM
      fullLabel: month,
      amount,
    }));
  }, [records]);

  if (data.length === 0) {
    return <div className="chart-empty">该时段无支出记录</div>;
  }

  // If only one month, show as a single point
  const maxAmount = Math.max(...data.map(d => d.amount));
  const padding = { top: 20, right: 20, bottom: 30, left: 10 };
  const width = 300;
  const height = 160;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
    const y = padding.top + chartH - (maxAmount > 0 ? (d.amount / maxAmount) * chartH : 0);
    return { ...d, x, y };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // Area fill
  const area = `M ${points[0].x},${padding.top + chartH} ` +
    points.map(p => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${padding.top + chartH} Z`;

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padding.top + chartH * (1 - pct);
          return (
            <line key={pct} x1={padding.left} y1={y} x2={width - padding.right} y2={y}
              stroke="var(--border)" strokeWidth="0.5" strokeDasharray={pct === 0 ? 'none' : '3'} />
          );
        })}

        {/* Area */}
        <path d={area} fill="var(--c-accent)" opacity="0.1" />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke="var(--c-accent)" strokeWidth="2" strokeLinejoin="round" />

        {/* Points + labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--c-accent)" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="trend-value">
              {formatFn(Math.round(p.amount))}
            </text>
            <text x={p.x} y={height - 6} textAnchor="middle" className="trend-label">
              {p.label}月
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
