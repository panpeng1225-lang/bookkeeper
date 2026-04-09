import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CURRENCY } from './config/currencies';
import { getRecords, addRecord, updateRecord, deleteRecord, getSettings, saveSettings } from './services/recordService';
import { recognizeBill } from './services/ocrService';
import { getVisionApiKey } from './config/deepseek';
import HomePage from './pages/HomePage';
import AddPage from './pages/AddPage';
import ListPage from './pages/ListPage';
import SettingsPage from './pages/SettingsPage';
import StatsPage from './pages/StatsPage';
import ScanPage from './pages/ScanPage';

export default function App() {
  const [page, setPage] = useState('home');
  const [records, setRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);

  // 设置
  const [defaultCurrency, setDefaultCurrency] = useState(() => {
    return getSettings().defaultCurrency || DEFAULT_CURRENCY;
  });

  // 加载数据
  const loadRecords = useCallback(async () => {
    try {
      const data = await getRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // 保存记录
  const handleSave = async (data) => {
    try {
      if (editRecord) {
        await updateRecord(editRecord.id, data);
      } else {
        await addRecord(data);
      }
      await loadRecords();
      setEditRecord(null);
      setScanResult(null);
      setPage('home');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('保存失败，请重试');
    }
  };

  // 删除记录（从编辑页）
  const handleDeleteFromEdit = async (id) => {
    if (!confirm('确认删除？')) return;
    try {
      await deleteRecord(id);
      await loadRecords();
      setEditRecord(null);
      setPage('home');
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('删除失败，请重试');
    }
  };

  // 删除记录（从滑动操作）
  const handleDeleteDirect = async (id) => {
    if (!confirm('确认删除？')) return;
    try {
      await deleteRecord(id);
      await loadRecords();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('删除失败，请重试');
    }
  };

  // 编辑
  const handleEdit = (record) => {
    setEditRecord(record);
    setScanResult(null);
    setPage('add');
  };

  // AI 识别结果 → 跳到记一笔页面预填
  const handleScanResult = (result) => {
    setScanResult(result);
    setEditRecord(null);
    setPage('add');
  };

  // 导航
  const navigate = (target) => {
    if (target === 'add') {
      setEditRecord(null);
      setScanResult(null);
    }
    setPage(target);
  };

  // 切换默认币种
  const handleChangeCurrency = (code) => {
    setDefaultCurrency(code);
    saveSettings({ ...getSettings(), defaultCurrency: code });
  };

  // 从首页相机按钮直接拍照识别 — 跳转到扫描页处理
  const handleCameraCapture = async (base64) => {
    const key = getVisionApiKey();
    if (!key) {
      alert('请先在设置中配置豆包 API Key');
      return;
    }
    // Store base64 and navigate to scan page which will auto-trigger recognition
    setPendingPhoto(base64);
    setPage('scan');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  switch (page) {
    case 'add':
      return (
        <AddPage
          defaultCurrency={defaultCurrency}
          editRecord={editRecord}
          scanResult={scanResult}
          onSave={handleSave}
          onDelete={handleDeleteFromEdit}
          onCancel={() => { setEditRecord(null); setScanResult(null); setPage('home'); }}
        />
      );
    case 'list':
      return (
        <ListPage
          records={records}
          onEdit={handleEdit}
          onDelete={handleDeleteDirect}
          onBack={() => setPage('home')}
        />
      );
    case 'stats':
      return (
        <StatsPage
          records={records}
          onBack={() => setPage('home')}
          onNavigate={navigate}
          onCameraCapture={handleCameraCapture}
        />
      );
    case 'scan':
      return (
        <ScanPage
          onResult={handleScanResult}
          onBack={() => { setPendingPhoto(null); setPage('home'); }}
          pendingPhoto={pendingPhoto}
          onPendingConsumed={() => setPendingPhoto(null)}
        />
      );
    case 'settings':
      return (
        <SettingsPage
          defaultCurrency={defaultCurrency}
          onChangeCurrency={handleChangeCurrency}
          onBack={() => setPage('home')}
        />
      );
    default:
      return (
        <HomePage
          records={records}
          defaultCurrency={defaultCurrency}
          onNavigate={navigate}
          onEdit={handleEdit}
          onDelete={handleDeleteDirect}
          onSettings={() => setPage('settings')}
          onCameraCapture={handleCameraCapture}
        />
      );
  }
}
