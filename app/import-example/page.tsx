'use client';
import { useGlobalImport } from '../../context/GlobalImportContext';

export default function HomePage() {
  const { openModal } = useGlobalImport();
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Data Import Example</h1>
      <button
        onClick={openModal}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Open Import Modal
      </button>
    </div>
  );
}
