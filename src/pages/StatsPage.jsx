import { useState, useMemo } from 'react';
import DonutChart from '../components/Charts/DonutChart';
import RankingList from '../components/Charts/RankingList';
import TrendLine from '../components/Charts/TrendLine';
import { convertAmount, getExchangeRate } from '../services/exchangeService';
import { formatAmount } from '../config/currencies';

const RANGES = [
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'year', label: '本年' },
  { id: 'custom', label: '自定义' },
];

function getDateRange(rangeId) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  switch (rangeId) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() + 1); // Monday
      return { start: d.toISOString().slice(0, 10), end: today };
    }
    case 'month': {
      const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { start: m, end: today };
    }
    case 'year': {
      return { start: `${now.getFullYear()}-01-01`, end: today };
    }
    default:
      return { start: `${now.getFullYear()}-01-01`, end: today };
  }
}

export default function StatsPage({ records, onBack }) {
  const [rangeId, setRangeId] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState('VND');

  const rate = getExchangeRate();

  const { start, end } = rangeId === 'custom'
    ? { start: customStart, end: customEnd }
    : getDateRange(rangeId);

  // Filter records by date range and add converted amounts
  const filtered = useMemo(() => {
    return records
      .filter(r => r.date >= start && r.date <= end)
      .map(r => ({
        ...r,
        _converted: convertAmount(r.amount, r.currency, displayCurrency, rate),
      }));
  }, [records, start, end, displayCurrency, rate]);

  const fmt = (amount) => formatAmount(amount, displayCurrency);

  // Compute totals in both currencies for summary
  const totals = useMemo(() => {
    let expense = 0, income = 0;
    filtered.forEach(r => {
      if (r.category === 'income') income += r._converted;
      else expense += r._converted;
    });
    return { expense, income };
  }, [filtered]);

  return (
    <div className="page">
      <div className="nav-bar">
        <span className="nav-back" onClick={onBack}>← 返回</span>
        <span className="nav-title">统计</span>
        <span style={{ width: 48 }} />
      </div>

      <div className="stats-page-body">
        {/* Currency toggle */}
        <div className="stats-currency-row">
          <span className="field-label" style={{ margin: 0 }}>统计币种</span>
          <div className="currency-toggle">
            {['VND', 'RMB'].map(c => (
              <div
                key={c}
                className={`currency-btn ${displayCurrency === c ? 'active' : ''}`}
                onClick={() => setDisplayCurrency(c)}
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Date range selector */}
        <div className="range-selector">
          {RANGES.map(r => (
            <div
              key={r.id}
              className={`range-btn ${rangeId === r.id ? 'active' : ''}`}
              onClick={() => setRangeId(r.id)}
            >
              {r.label}
            </div>
          ))}
        </div>

        {rangeId === 'custom' && (
          <div className="datetime-row" style={{ marginBottom: 12 }}>
            <div className="datetime-field">
              <div className="field-label">起始</div>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            </div>
            <div className="datetime-field">
              <div className="field-label">结束</div>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="stats-summary">
          <div className="stats-summary-item">
            <div className="stat-label">支出</div>
            <div className="stat-val expense">{fmt(totals.expense)}</div>
          </div>
          <div className="stats-summary-divider" />
          <div className="stats-summary-item">
            <div className="stat-label">收入</div>
            <div className="stat-val income">{fmt(totals.income)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="chart-section">
          <div className="chart-title">支出构成</div>
          <DonutChart records={filtered} formatFn={fmt} />
        </div>

        <div className="chart-section">
          <div className="chart-title">分类排行</div>
          <RankingList records={filtered} formatFn={fmt} />
        </div>

        <div className="chart-section">
          <div className="chart-title">月度趋势</div>
          <TrendLine records={filtered} formatFn={fmt} />
        </div>
      </div>
    </div>
  );
}
