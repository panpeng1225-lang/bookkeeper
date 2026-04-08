import RecordForm from '../components/RecordForm';

export default function AddPage({ defaultCurrency, editRecord, onSave, onDelete, onCancel }) {
  return (
    <RecordForm
      defaultCurrency={defaultCurrency}
      initialData={editRecord}
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
    />
  );
}
