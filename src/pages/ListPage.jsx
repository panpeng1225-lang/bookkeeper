import RecordList from '../components/RecordList';

export default function ListPage({ records, onEdit, onDelete, onBack }) {
  return (
    <div className="page">
      <div className="nav-bar">
        <span className="nav-back" onClick={onBack}><svg className="nav-back-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>返回</span>
        <span className="nav-title">全部记录</span>
        <span style={{ width: 48 }} />
      </div>
      <RecordList records={records} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
