import { useEffect, useRef } from 'react';
import RecordList from '../components/RecordList';

export default function ListPage({ records, onEdit, onDelete, onBack, listViewState, onRestoreComplete }) {
  const pageRef = useRef(null);

  useEffect(() => {
    if (listViewState?.scrollTop == null && !listViewState?.restoreRecordId && !listViewState?.restoreDate) return;

    const frameId = requestAnimationFrame(() => {
      const page = pageRef.current;
      if (!page) return;

      if (listViewState?.scrollTop != null) {
        page.scrollTo({ top: listViewState.scrollTop, behavior: 'auto' });
        onRestoreComplete?.();
        return;
      }

      let target = null;

      if (listViewState.restoreRecordId) {
        target = page.querySelector(`[data-record-id="${listViewState.restoreRecordId}"]`);
      }

      if (!target && listViewState.restoreDate) {
        target = page.querySelector(`[data-record-date="${listViewState.restoreDate}"]`);
      }

      if (target) {
        const navBar = page.querySelector('.nav-bar');
        const navHeight = navBar?.offsetHeight || 0;
        const top = Math.max(0, target.offsetTop - navHeight - 12);
        page.scrollTo({ top, behavior: 'auto' });
      }

      onRestoreComplete?.();
    });

    return () => cancelAnimationFrame(frameId);
  }, [records, listViewState, onRestoreComplete]);

  const handleEditFromList = (record) => {
    onEdit?.(record, {
      scrollTop: pageRef.current?.scrollTop ?? 0,
    });
  };

  return (
    <div className="page" ref={pageRef}>
      <div className="nav-bar">
        <span className="nav-back" onClick={onBack}><svg className="nav-back-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>返回</span>
        <span className="nav-title">全部记录</span>
        <span style={{ width: 48 }} />
      </div>
      <RecordList records={records} onEdit={handleEditFromList} onDelete={onDelete} />
    </div>
  );
}
