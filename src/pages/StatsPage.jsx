import { useState, useMemo } from 'react';
import DonutChart from '../components/Charts/DonutChart';
import RankingList from '../components/Charts/RankingList';
import TrendLine from '../components/Charts/TrendLine';
import BottomNav from '../components/BottomNav';
import { convertAmount, getExchangeRate } from '../services/exchangeService';
import { formatAmount } from '../config/currencies';
import { CATEGORY_MAP } from '../config/categories';

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

export default function StatsPage({ records, onNavigate, onCameraCapture }) {
  const [rangeId, setRangeId] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState('VND');
  const [searchText, setSearchText] = useState('');
  const [tagFilter, setTagFilter] = useState('');

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

  const detailRecords = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (tagFilter === '' && keyword === '') return [];

    return filtered
      .filter(r => {
        const tagMatch = tagFilter === '' || r.tag === tagFilter;
        const noteMatch = keyword === '' || (r.note || '').toLowerCase().includes(keyword);
        return tagMatch && noteMatch;
      })
      .sort((a, b) => {
        const da = `${a.date} ${a.time || '00:00'}`;
        const db = `${b.date} ${b.time || '00:00'}`;
        return db.localeCompare(da);
      });
  }, [filtered, tagFilter, searchText]);

  const detailTotals = useMemo(() => {
    let expense = 0, income = 0;
    detailRecords.forEach(r => {
      if (r.category === 'income') income += r._converted;
      else expense += r._converted;
    });
    return { expense, income };
  }, [detailRecords]);

  const showDetails = tagFilter !== '' || searchText.trim() !== '';

  return (
    <div className="page has-bottom-nav">
      <div className="nav-bar">
        <span style={{ width: 48 }} />
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

        {/* Search and tag filters */}
        <div className="stats-search-bar">
          <input
            type="text"
            placeholder="搜索备注关键词…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="stats-search-input"
          />
          {searchText && (
            <button type="button" className="stats-search-clear" onClick={() => setSearchText('')}>✕</button>
          )}
        </div>

        <div className="tag-filter-bar">
          {[
            { value: '', label: '全部' },
            { value: '值得花', label: '✓ 值得花' },
            { value: '不该花', label: '✗ 不该花' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              className={[
                'tag-filter-btn',
                tagFilter === opt.value ? 'active' : '',
                opt.value === '值得花' ? 'worth' : '',
                opt.value === '不该花' ? 'regret' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setTagFilter(prev => prev === opt.value ? '' : opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {showDetails && (
          <div className="detail-section detail-section-top">
            <div className="detail-section-title">筛选明细</div>
            {detailRecords.length === 0 ? (
              <div className="detail-empty">当前时间范围内暂无符合条件的记录</div>
            ) : (
              <>
                {detailRecords.map(r => {
                  const cat = CATEGORY_MAP[r.category] || { icon: '📌', label: '其他' };
                  const isIncome = r.category === 'income';

                  return (
                    <div key={r.id} className="detail-item">
                      <div className="detail-item-left">
                        <div className="detail-item-top">
                          <span>{cat.icon}</span>
                          <span className="detail-item-name">{cat.label}</span>
                          {r.tag && (
                            <span className={`record-tag-badge ${r.tag === '值得花' ? 'tag-worth' : 'tag-regret'}`}>
                              {r.tag === '值得花' ? '✓' : '✗'} {r.tag}
                            </span>
                          )}
                        </div>
                        {r.note && <div className="detail-item-note">{r.note}</div>}
                        <div className="detail-item-date">{r.date} {r.time || '00:00'}</div>
                      </div>
                      <div className={`detail-item-amount ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? '+' : '-'}{fmt(r._converted)}
                      </div>
                    </div>
                  );
                })}
                <div className="detail-summary">
                  <span>共 {detailRecords.length} 笔</span>
                  <span>支出合计 {fmt(detailTotals.expense)}</span>
                  <span>收入合计 {fmt(detailTotals.income)}</span>
                </div>
              </>
            )}
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

      <BottomNav activePage="stats" onNavigate={onNavigate} onCameraCapture={onCameraCapture} />
    </div>
  );
}
