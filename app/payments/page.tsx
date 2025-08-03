'use client';
import { useImportContext } from '@/app/context/GlobalImportContext';

export default function PaymentsPage() {
  const { openImportModal } = useImportContext();
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Pagamentos</h1>
      <button
        onClick={() => openImportModal('pagamentos')}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Importar Pagamentos
      </button>
    </div>
  );
}
