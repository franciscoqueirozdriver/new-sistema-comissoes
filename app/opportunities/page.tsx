'use client';
import { useGlobalImport } from '@/app/context/GlobalImportContext';

export default function OpportunitiesPage() {
  const { openImportModal } = useGlobalImport();
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Opportunities</h1>
      <button
        onClick={() => openImportModal('opportunities')}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Import Opportunities
      </button>
    </div>
  );
}
