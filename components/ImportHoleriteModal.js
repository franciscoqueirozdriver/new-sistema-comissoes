import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { HOLERITE_COLUMNS } from '@/lib/constants/holerites';

export default function ImportHoleriteModal({ isOpen, onClose }) {
  const { data: session } = useSession();
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload');
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0] || null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import-holerite', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Falha ao processar PDF.');
      const data = await res.json();
      const detected = HOLERITE_COLUMNS.map((col) => {
        let value = data.fieldsExtracted?.[col] || '';
        if (col === 'user_email') value = session?.user?.email || '';
        if (col === 'fonte_arquivo') value = data.fileName || '';
        if (col === 'status_validacao') value = 'pendente';
        if (col === 'rubricas_json') value = '';
        return { key: col, value };
      });
      setRows(detected);
      setFileName(data.fileName || '');
      setStep('mapping');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const updateRow = (index, value) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, value } : r)));
  };

  const handleConfirm = async () => {
    const payload = {};
    rows.forEach((r) => {
      payload[r.key] = r.value || '';
    });
    if (!session?.user?.email) {
      setError('Usuário não autenticado.');
      return;
    }
    payload.user_email = session.user.email;
    payload.fonte_arquivo = fileName || 'manual';
    if (!payload.status_validacao) payload.status_validacao = 'pendente';
    if (!payload.rubricas_json) payload.rubricas_json = '';
    const required = HOLERITE_COLUMNS.filter((c) => c !== 'rubricas_json' && c !== 'status_validacao');
    const missing = required.filter((c) => !payload[c]);
    if (missing.length) {
      setError('Preencha todos os campos antes de salvar.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/holerites/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao salvar dados.');
      onClose();
      setFile(null);
      setRows([]);
      setFileName('');
      setStep('upload');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-lg space-y-4">
        <h2 className="text-xl font-bold">Importar Holerite</h2>
        {step === 'upload' && (
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
        {step === 'mapping' && (
          <div className="space-y-2">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Campo</th>
                  <th className="text-left">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.key}>
                    <td className="py-1 pr-2">{row.key}</td>
                    <td className="py-1 pr-2">
                      <input
                        className="w-full p-1 border rounded"
                        value={row.value}
                        onChange={(e) => updateRow(idx, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          {step === 'mapping' && (
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Confirmar Importação'}
            </button>
          )}
          <button
            onClick={() => {
              onClose();
              setFile(null);
              setRows([]);
              setFileName('');
              setStep('upload');
              setError(null);
            }}
            className="px-4 py-2 border rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
