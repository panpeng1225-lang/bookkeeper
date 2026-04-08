import { useState } from 'react';
import { CURRENCIES } from '../config/currencies';
import { getExchangeRate, saveExchangeRate } from '../services/exchangeService';
import { getVisionApiKey, saveVisionApiKey } from '../config/deepseek';

export default function SettingsPage({ defaultCurrency, onChangeCurrency, onBack }) {
  const [rate, setRate] = useState(String(getExchangeRate()));
  const [apiKey, setApiKey] = useState(getVisionApiKey());
  const [saved, setSaved] = useState('');

  const handleRateSave = () => {
    const val = parseFloat(rate);
    if (val > 0) {
      saveExchangeRate(val);
      setSaved('汇率已保存');
      setTimeout(() => setSaved(''), 2000);
    }
  };

  const handleKeySave = () => {
    saveVisionApiKey(apiKey.trim());
    setSaved('API Key 已保存');
    setTimeout(() => setSaved(''), 2000);
  };

  return (
    <div className="page">
      <div className="nav-bar">
        <span className="nav-back" onClick={onBack}>← 返回</span>
        <span className="nav-title">设置</span>
        <span style={{ width: 48 }} />
      </div>

      <div className="settings-body">
        {saved && <div className="settings-toast">{saved}</div>}

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

        <div className="settings-section">
          <div className="field-label">汇率设置（1 RMB = ? VND）</div>
          <div className="settings-input-row">
            <input
              className="settings-input"
              type="number"
              inputMode="decimal"
              value={rate}
              onChange={e => setRate(e.target.value)}
              placeholder="3400"
            />
            <button className="settings-save-btn" onClick={handleRateSave}>保存</button>
          </div>
          <div className="settings-hint">统计页可按此汇率换算显示</div>
        </div>

        <div className="settings-section">
          <div className="field-label">豆包 API Key</div>
          <div className="settings-input-row">
            <input
              className="settings-input"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <button className="settings-save-btn" onClick={handleKeySave}>保存</button>
          </div>
          <div className="settings-hint">用于 AI 识别账单，前往 volcengine.com 火山引擎 获取</div>
        </div>
      </div>
    </div>
  );
}
