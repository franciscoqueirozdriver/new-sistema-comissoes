import { useState } from 'react';
import { useSession } from 'next-auth/react';

const columns = ['mes','salario_base','comissao','dsr','dias_dsr','data_pagamento','user_email','fonte_arquivo'];

export default function ImportHoleriteModal({ isOpen, onClose }) {
  const { data: session } = useSession();
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload');
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

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
      if (data.requiresMapping) {
        const detected = Object.entries(data.fieldsExtracted || {}).map(([key, value]) => ({
          key,
          value,
          mapTo: columns.includes(key) ? key : ''
        }));
        const email = session?.user?.email || '';
        detected.push({ key: 'user_email', value: email, mapTo: 'user_email' });
        detected.push({ key: 'fonte_arquivo', value: data.fileName || '', mapTo: 'fonte_arquivo' });
        setRows(detected);
        setFileName(data.fileName || '');
        setStep('mapping');
      } else {
        setError('Dados inválidos.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const addRow = () => setRows([...rows, { key: '', value: '', mapTo: '' }]);

  const updateRow = (index, updates) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  };

  const handleConfirm = async () => {
    const payload = {};
    rows.forEach((r) => {
      if (r.mapTo) payload[r.mapTo] = r.value || '';
    });
    if (!session?.user?.email) {
      setError('Usuário não autenticado.');
      return;
    }
    // garantir e-mail e nome do arquivo corretos
    payload.user_email = session.user.email;
    payload.fonte_arquivo = fileName;
    const required = columns.filter((c) => c !== 'data_pagamento');
    const missing = required.filter((c) => !payload[c]);
    if (missing.length) {
      setError('Preencha todos os campos antes de salvar.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/holerites', {
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
                  <th className="text-left">PARA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-1 pr-2">{row.key}</td>
                    <td className="py-1 pr-2">
                      <input
                        className="w-full p-1 border rounded"
                        value={row.value}
                        onChange={(e) => updateRow(idx, { value: e.target.value })}
                      />
                    </td>
                    <td className="py-1">
                      <select
                        className="w-full p-1 border rounded bg-white"
                        value={row.mapTo}
                        onChange={(e) => updateRow(idx, { mapTo: e.target.value })}
                      >
                        <option value="">Selecione</option>
                        {columns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addRow}
              className="px-2 py-1 text-sm border rounded"
            >
              Adicionar Campo
            </button>
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
