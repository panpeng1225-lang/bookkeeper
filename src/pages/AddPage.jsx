import RecordForm from '../components/RecordForm';

export default function AddPage({ defaultCurrency, editRecord, scanResult, onSave, onDelete, onCancel }) {
  // If scanResult exists, pre-fill the form
  const prefill = scanResult ? {
    amount: scanResult.amount,
    category: scanResult.category || 'other',
    currency: scanResult.currency || defaultCurrency,
    note: scanResult.note || '',
    date: scanResult.date || new Date().toISOString().slice(0, 10),
    time: scanResult.time || new Date().toTimeString().slice(0, 5),
  } : null;

  return (
    <RecordForm
      defaultCurrency={defaultCurrency}
      initialData={editRecord || prefill}
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
    />
  );
}
