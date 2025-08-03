import { useState } from 'react';

export default function ImportHoleriteModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import-holerite', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Falha ao processar PDF.');
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/holerites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });
      if (!res.ok) throw new Error('Erro ao salvar dados.');
      onClose();
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Importar Holerite</h2>
        {preview ? (
          <div className="space-y-1 text-sm">
            <p><strong>Mês/Ano:</strong> {preview.mes}</p>
            <p><strong>Salário Base:</strong> {preview.salario_base}</p>
            <p><strong>Comissões:</strong> {preview.comissao}</p>
            <p><strong>DSR:</strong> {preview.dsr}</p>
            <p><strong>Dias de DSR:</strong> {preview.dias_dsr}</p>
            <p><strong>Data Pagamento:</strong> {preview.data_pagamento}</p>
            <p><strong>Arquivo:</strong> {preview.fonte_arquivo}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <input type="file" accept=".pdf" onChange={handleFileChange} />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {uploading ? 'Processando...' : 'Enviar'}
            </button>
          </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          {preview && (
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Confirmar Importação'}
            </button>
          )}
          <button
            onClick={() => { onClose(); setFile(null); setPreview(null); }}
            className="px-4 py-2 border rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

