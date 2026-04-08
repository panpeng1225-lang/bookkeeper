import { useState, useEffect } from 'react';
import PhotoCapture from '../components/PhotoCapture';
import { recognizeBill } from '../services/ocrService';
import { getVisionApiKey } from '../config/deepseek';

export default function ScanPage({ onResult, onBack, pendingPhoto, onPendingConsumed }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Auto-trigger when arriving with a photo from camera button
  useEffect(() => {
    if (pendingPhoto && !loading) {
      if (onPendingConsumed) onPendingConsumed();
      handleCapture(pendingPhoto);
    }
  }, []); // run once on mount

  const handleCapture = async (base64) => {
    const key = getVisionApiKey();
    if (!key) {
      setError('请先在设置中配置豆包 API Key');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('正在识别...');
    try {
      const result = await recognizeBill(base64, setStatus);
      onResult(result);
    } catch (err) {
      setError(err.message || '识别失败，请重试');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const hasKey = !!getVisionApiKey();

  return (
    <div className="page">
      <div className="nav-bar">
        <span className="nav-back" onClick={loading ? undefined : onBack}>← 返回</span>
        <span className="nav-title">扫描账单</span>
        <span style={{ width: 48 }} />
      </div>

      <div className="scan-body">
        {!hasKey && (
          <div className="scan-warning">
            ⚠️ 请先在设置中配置豆包 API Key 才能使用识别功能
          </div>
        )}

        <PhotoCapture onCapture={handleCapture} loading={loading} />

        {loading && (
          <div className="scan-loading">
            <div className="spinner" />
            <div className="scan-status">{status}</div>
          </div>
        )}

        {error && <div className="scan-error">{error}</div>}

        <div className="scan-tips">
          <div className="scan-tips-title">支持识别</div>
          <div className="scan-tips-list">
            电子支付截图（微信、支付宝、银行App等）、纸质小票、餐厅账单
          </div>
        </div>
      </div>
    </div>
  );
}
