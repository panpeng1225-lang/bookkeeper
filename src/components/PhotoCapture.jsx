import { useRef, useState } from 'react';

export default function PhotoCapture({ onCapture, loading }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      onCapture(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="photo-capture">
      {preview ? (
        <div className="photo-preview">
          <img src={preview} alt="账单预览" />
          {loading && <div className="photo-loading">识别中...</div>}
        </div>
      ) : (
        <div className="photo-buttons">
          {/* Camera capture */}
          <label className="photo-btn">
            <span className="photo-btn-icon">📷</span>
            <span>拍照识别</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </label>

          {/* File upload */}
          <label className="photo-btn">
            <span className="photo-btn-icon">🖼️</span>
            <span>上传截图</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </label>
        </div>
      )}

      {preview && !loading && (
        <button className="photo-retry" onClick={() => setPreview(null)}>
          重新拍照/上传
        </button>
      )}
    </div>
  );
}
