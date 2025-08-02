'use client';
import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useGlobalImport } from '@/app/context/GlobalImportContext';

export default function ImportModal() {
  const {
    isOpen,
    closeModal,
    data,
    setData,
    mapping,
    setMapping,
    requiredFields,
    targetEndpoint,
  } = useGlobalImport();
  const [rows, setRows] = useState<string[][]>(data?.rows || []);

  useEffect(() => {
    setRows(data?.rows || []);
  }, [data]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/import', { method: 'POST', body: form });
    const json = await res.json();
    setData(json);
  }

  const columnDefs = (data?.columns || []).map((c, idx) => ({ headerName: c, field: String(idx), editable: true }));
  const rowData = rows.map(r => {
    const obj: Record<string, string> = {};
    r.forEach((cell, idx) => (obj[String(idx)] = cell));
    return obj;
  });

  function onCellValueChanged(params: any) {
    const updated = [...rows];
    const rowIndex = params.node.rowIndex;
    const colIndex = parseInt(params.colDef.field as string, 10);
    updated[rowIndex][colIndex] = params.newValue;
    setRows(updated);
  }

  function handleMappingChange(col: string, value: string) {
    setMapping({ ...mapping, [col]: value });
  }

  function validate() {
    const mapped = Object.values(mapping);
    const missing = requiredFields.some(f => !mapped.includes(f));
    if (missing) {
      alert('Please map all required fields');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!data) return;
    if (!validate()) return;
    const payload = { data: { columns: data.columns, rows }, mapping };
    const res = await fetch(targetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert('Import successful');
      closeModal();
      setData(null);
    } else {
      alert('Import failed');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded p-4 w-full max-w-5xl">
        <h2 className="text-xl font-bold mb-4">Import Data</h2>
        <input type="file" accept=".xlsx,.csv,.pdf,.png,.jpg,.jpeg" onChange={handleFile} className="mb-4" />
        {data && (
          <>
            <div className="mb-4">
              <div className="ag-theme-alpine max-h-64 overflow-auto" style={{ width: '100%' }}>
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={rowData}
                  onCellValueChanged={onCellValueChanged}
                  defaultColDef={{ resizable: true, editable: true }}
                />
              </div>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Map Columns</h3>
              {data.columns.map(col => (
                <div key={col} className="flex items-center mb-2">
                  <span className="w-1/2">{col}</span>
                  <select
                    className="w-1/2 border p-1"
                    value={mapping[col] || ''}
                    onChange={e => handleMappingChange(col, e.target.value)}
                  >
                    <option value="">Select field</option>
                    {requiredFields.map(f => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Confirm Import
            </button>
          </>
        )}
        <button onClick={closeModal} className="ml-2 text-sm text-gray-500">
          Close
        </button>
      </div>
    </div>
  );
}
