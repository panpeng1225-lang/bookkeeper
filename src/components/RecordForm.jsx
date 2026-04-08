import { useState, useEffect } from 'react';
import { ALL_CATEGORIES } from '../config/categories';
import { CURRENCIES } from '../config/currencies';

export default function RecordForm({ defaultCurrency, initialData, onSave, onDelete, onCancel }) {
  const isEdit = !!initialData;
  const now = new Date();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));

  useEffect(() => {
    if (initialData) {
      setAmount(String(initialData.amount));
      setCategory(initialData.category);
      setCurrency(initialData.currency || defaultCurrency);
      setNote(initialData.note || '');
      setDate(initialData.date);
      setTime(initialData.time || '00:00');
    }
  }, [initialData, defaultCurrency]);

  const curInfo = CURRENCIES[currency];
  const canSave = amount && parseFloat(amount) > 0 && category;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      amount: parseFloat(amount),
      category,
      currency,
      note,
      date,
      time,
    });
  };

  return (
    <div className="form-page">
      <div className="nav-bar">
        <span className="nav-back" onClick={onCancel}>← 返回</span>
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
                onClick={() => setCategory(c.id)}
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
