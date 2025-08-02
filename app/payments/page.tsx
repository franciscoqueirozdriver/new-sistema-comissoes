'use client';
import { useGlobalImport } from '@/app/context/GlobalImportContext';

export default function PaymentsPage() {
  const { openImportModal } = useGlobalImport();
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Payments</h1>
      <button
        onClick={() => openImportModal('payments')}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Import Payments
      </button>
    </div>
  );
}
