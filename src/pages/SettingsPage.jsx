import { CURRENCIES } from '../config/currencies';

export default function SettingsPage({ defaultCurrency, onChangeCurrency, onBack }) {
  return (
    <div className="page">
      <div className="nav-bar">
        <span className="nav-back" onClick={onBack}>← 返回</span>
        <span className="nav-title">设置</span>
        <span style={{ width: 48 }} />
      </div>

      <div className="settings-body">
        <div className="settings-section">
          <div className="field-label">默认币种</div>
          <div className="currency-options">
            {Object.values(CURRENCIES).map(c => (
              <div
                key={c.code}
                className={`currency-option ${defaultCurrency === c.code ? 'active' : ''}`}
                onClick={() => onChangeCurrency(c.code)}
              >
                <span className="currency-option-symbol">{c.symbol}</span>
                <div>
                  <div className="currency-option-code">{c.code}</div>
                  <div className="currency-option-label">{c.label}</div>
                </div>
                {defaultCurrency === c.code && <span className="check-mark">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
