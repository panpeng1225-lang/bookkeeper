import RecordList from '../components/RecordList';

export default function ListPage({ records, onEdit, onDelete, onBack }) {
  return (
    <div className="page">
      <div className="nav-bar">
        <span className="nav-back" onClick={onBack}>← 返回</span>
        <span className="nav-title">全部记录</span>
        <span style={{ width: 48 }} />
      </div>
      <RecordList records={records} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
