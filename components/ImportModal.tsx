"use client";

import { useGlobalImport } from "./GlobalImportProvider";

export default function ImportModal() {
  const { open, closeModal } = useGlobalImport();
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded shadow">
        <p>Importar dados</p>
        <button onClick={closeModal} className="mt-2 px-3 py-1 bg-gray-200 rounded">Fechar</button>
      </div>
    </div>
  );
}
