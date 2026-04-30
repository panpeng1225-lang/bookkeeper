import { useState, useEffect, useCallback } from 'react';
import PhotoCapture from '../components/PhotoCapture';
import { recognizeBill } from '../services/ocrService';
import { getVisionApiKey } from '../config/deepseek';

export default function ScanPage({ onResult, onBack, pendingPhoto, onPendingConsumed }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleCapture = useCallback(async (base64) => {
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
  }, [onResult]);

  // Auto-trigger when arriving with a photo from camera button
  useEffect(() => {
    if (pendingPhoto && !loading) {
      onPendingConsumed?.();
      handleCapture(pendingPhoto);
    }
  }, [handleCapture, loading, onPendingConsumed, pendingPhoto]);

  const hasKey = !!getVisionApiKey();

  return (
    <div className="page">
      <div className="nav-bar">
        <span className="nav-back" onClick={loading ? undefined : onBack}><svg className="nav-back-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>返回</span>
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
