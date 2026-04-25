import { useState } from 'react';
import { ALL_CATEGORIES } from '../config/categories';
import { CURRENCIES } from '../config/currencies';

export default function RecordForm({ defaultCurrency, initialData, onSave, onDelete, onCancel }) {
  const isEdit = !!initialData;
  const now = new Date();

  const [amount, setAmount] = useState(() => initialData ? String(initialData.amount) : '');
  const [category, setCategory] = useState(() => initialData?.category || '');
  const [currency, setCurrency] = useState(() => initialData?.currency || defaultCurrency);
  const [note, setNote] = useState(() => initialData?.note || '');
  const [tag, setTag] = useState(() => initialData?.category === 'income' ? '' : (initialData?.tag || ''));
  const [date, setDate] = useState(() => initialData?.date || now.toISOString().slice(0, 10));
  const [time, setTime] = useState(() => initialData?.time || now.toTimeString().slice(0, 5));

  const curInfo = CURRENCIES[currency];
  const canSave = amount && parseFloat(amount) > 0 && category;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      amount: parseFloat(amount),
      category,
      currency,
      note,
      tag: category === 'income' ? '' : tag,
      date,
      time,
    });
  };

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    if (nextCategory === 'income') setTag('');
  };

  return (
    <div className="form-page">
      <div className="nav-bar">
        <span className="nav-back" onClick={onCancel}><svg className="nav-back-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>返回</span>
        <span className="nav-title">{isEdit ? '编辑记录' : '记一笔'}</span>
        <span style={{ width: 48 }} />
      </div>

      <div className="form-body">
        {/* 币种切换 */}
        <div className="currency-row">
          <div className="currency-toggle">
            {Object.keys(CURRENCIES).map(code => (
              <div
                key={code}
                className={`currency-btn ${currency === code ? 'active' : ''}`}
                onClick={() => setCurrency(code)}
              >
                {code}
              </div>
            ))}
          </div>
          <span className="currency-hint">默认: {defaultCurrency}</span>
        </div>

        {/* 金额 */}
        <div className="amount-card">
          <div className="amount-label">金额</div>
          <div className="amount-row">
            <span className="amount-symbol">{curInfo.symbol}</span>
            <input
              className="amount-input"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* 日期时间 */}
        <div className="datetime-row">
          <div className="datetime-field">
            <div className="field-label">日期</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="datetime-field">
            <div className="field-label">时间</div>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        {/* 分类 */}
        <div className="category-section">
          <div className="field-label">分类</div>
          <div className="category-grid">
            {ALL_CATEGORIES.map(c => (
              <div
                key={c.id}
                className={`category-item ${category === c.id ? 'selected' : ''}`}
                onClick={() => handleCategoryChange(c.id)}
              >
                <div
                  className="category-icon"
                  style={{
                    background: category === c.id ? c.bg : 'var(--bg-secondary)',
                    borderColor: category === c.id ? c.color : 'transparent',
                  }}
                >
                  {c.icon}
                </div>
                <span
                  className="category-label"
                  style={{ color: category === c.id ? c.color : 'var(--text-secondary)' }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 备注 */}
        <div className="note-section">
          <div className="field-label">备注</div>
          <input
            className="note-input"
            placeholder="可选"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {category !== 'income' && (
          <div className="tag-section">
            <div className="field-label">这笔钱</div>
            <div className="tag-selector">
              {[
                { value: '', label: '无标签' },
                { value: '值得花', label: '✓ 值得花' },
                { value: '不该花', label: '✗ 不该花' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={[
                    'tag-btn',
                    tag === opt.value ? 'tag-active' : '',
                    opt.value === '值得花' ? 'tag-worth' : '',
                    opt.value === '不该花' ? 'tag-regret' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setTag(prev => prev === opt.value && opt.value !== '' ? '' : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className={`save-btn ${canSave ? '' : 'disabled'}`} onClick={handleSave}>
          {isEdit ? '保存修改' : '保存'}
        </button>

        {isEdit && (
          <button className="delete-btn" onClick={() => onDelete(initialData.id)}>
            删除此记录
          </button>
        )}
      </div>
    </div>
  );
}
