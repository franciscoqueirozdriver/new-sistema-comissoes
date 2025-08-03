'use client';
import { useImportContext } from '@/app/context/GlobalImportContext';

export default function OpportunitiesPage() {
  const { openImportModal } = useImportContext();
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Oportunidades</h1>
      <button
        onClick={() => openImportModal('oportunidades')}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Importar Oportunidades
      </button>
    </div>
  );
}
