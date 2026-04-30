import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CURRENCY } from './config/currencies';
import { getRecords, addRecord, updateRecord, deleteRecord, getSettings, saveSettings } from './services/recordService';
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
  const [editReturnPage, setEditReturnPage] = useState('home');
  const [listViewState, setListViewState] = useState({
    scrollTop: null,
    restoreRecordId: null,
    restoreDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [statsViewState, setStatsViewState] = useState({
    rangeId: 'month',
    customStart: '',
    customEnd: '',
    displayCurrency: 'VND',
    searchText: '',
    tagFilter: '',
  });

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
      const returnPage = editRecord ? editReturnPage : 'home';
      const restoreRecordId = editRecord?.id || null;

      if (editRecord) {
        await updateRecord(editRecord.id, data);
      } else {
        await addRecord(data);
      }
      await loadRecords();
      if (returnPage === 'list' && restoreRecordId) {
        setListViewState(prev => ({
          ...prev,
          restoreRecordId,
          restoreDate: data.date || '',
        }));
      }
      setEditRecord(null);
      setEditReturnPage('home');
      setScanResult(null);
      setPage(returnPage);
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
      if (editReturnPage === 'list') {
        setListViewState(prev => ({
          ...prev,
          restoreRecordId: null,
          restoreDate: editRecord?.date || '',
        }));
      }
      setEditRecord(null);
      setPage(editReturnPage);
      setEditReturnPage('home');
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
  const handleEdit = (record, options = {}) => {
    if (options.returnPage === 'list') {
      setListViewState(prev => ({
        scrollTop: options.scrollTop ?? prev.scrollTop,
        restoreRecordId: record.id,
        restoreDate: record.date || '',
      }));
    }
    setEditRecord(record);
    setEditReturnPage(options.returnPage || 'home');
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
      setEditReturnPage('home');
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
          onCancel={() => {
            const targetPage = editRecord ? editReturnPage : 'home';
            if (targetPage === 'list' && editRecord) {
              setListViewState(prev => ({
                ...prev,
                restoreRecordId: editRecord.id,
                restoreDate: editRecord.date || '',
              }));
            }
            setEditRecord(null);
            setEditReturnPage('home');
            setScanResult(null);
            setPage(targetPage);
          }}
        />
      );
    case 'list':
      return (
        <ListPage
          records={records}
          onEdit={(record, options = {}) => handleEdit(record, { returnPage: 'list', ...options })}
          onDelete={handleDeleteDirect}
          listViewState={listViewState}
          onRestoreComplete={() => {
            setListViewState({
              scrollTop: null,
              restoreRecordId: null,
              restoreDate: '',
            });
          }}
          onBack={() => setPage('home')}
        />
      );
    case 'stats':
      return (
        <StatsPage
          records={records}
          onNavigate={navigate}
          onCameraCapture={handleCameraCapture}
          onEdit={(record) => handleEdit(record, { returnPage: 'stats' })}
          onDelete={handleDeleteDirect}
          statsViewState={statsViewState}
          onStatsViewChange={setStatsViewState}
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
