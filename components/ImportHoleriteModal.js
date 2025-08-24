import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const columns = [
  "mes","competencia","empresa","salario_base","comissao","dsr","dias_dsr",
  "valor_bruto","valor_liquido","data_pagamento","user_email","fonte_arquivo",
  "holerite_ID","rubricas_json","status_validacao"
];

const currencyFields = ["salario_base","comissao","dsr","valor_bruto","valor_liquido"];

function formatBRL(value){
  if(value === undefined || value === null || value === "") return "";
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/\./g,'').replace(',', '.'));
  if(isNaN(num)) return "";
  return num.toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function normalizeBRLInput(value){
  if(value === undefined || value === null) return "";
  let str = String(value).replace(/[^\d,\.]/g, '').replace(/\./g,'').replace(',', '.');
  const num = parseFloat(str);
  if(isNaN(num)) return "";
  return formatBRL(num);
}

function calcularQuintoDiaUtil(competencia){
  if(!competencia) return "";
  let ano, mes;
  if(competencia.includes('-')){
    [ano, mes] = competencia.split('-');
    ano = parseInt(ano,10); mes = parseInt(mes,10)-1;
  }else{
    [mes, ano] = competencia.split('/');
    ano = parseInt(ano,10); mes = parseInt(mes,10)-1;
  }
  const date = new Date(ano, mes+1, 1);
  let count = 0;
  while(true){
    const day = date.getDay();
    if(day !== 0 && day !== 6) count++;
    if(count === 5) break;
    date.setDate(date.getDate()+1);
  }
  return date.toISOString().slice(0,10);
}

function unique(arr){
  const set = new Set();
  const res = [];
  arr.forEach(v => {
    if(v === undefined || v === null) return;
    const s = String(v);
    if(!set.has(s)){
      set.add(s);
      res.push(s);
    }
  });
  return res;
}

export default function ImportHoleriteModal({ open, onClose }){
  const { data: session } = useSession();
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extraction, setExtraction] = useState(null);
  const [candidates, setCandidates] = useState({});
  const [form, setForm] = useState(() => { const o={}; columns.forEach(c=>o[c]=''); return o; });
  const [openList, setOpenList] = useState({});
  const modalRef = useRef(null);

  useEffect(()=>{
    if(!open) return;
    const handleKey = (e)=>{
      if(e.key === 'Escape') onClose();
      if(e.key === 'Tab' && modalRef.current){
        const focusable = modalRef.current.querySelectorAll('a,button,textarea,input,select,[tabindex]:not([tabindex="-1"])');
        if(focusable.length===0) return;
        const first = focusable[0];
        const last = focusable[focusable.length-1];
        if(e.shiftKey){
          if(document.activeElement === first){ e.preventDefault(); last.focus(); }
        }else{
          if(document.activeElement === last){ e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    const first = modalRef.current?.querySelector('h2, input, button');
    first && first.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, step]);

  useEffect(()=>{
    if(!open) return;
    const handleClick = (e)=>{
      if(modalRef.current && !modalRef.current.contains(e.target)){
        setOpenList({});
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if(!open) return null;

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if(!f) return;
    const extOk = ['pdf','png','jpg','jpeg','gif'];
    const ext = f.name.split('.').pop().toLowerCase();
    if(!extOk.includes(ext)){
      setError('Formato inválido.');
      return;
    }
    if(f.size > 10*1024*1024){
      setError('Arquivo maior que 10MB.');
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleUpload = async () => {
    if(!file) return;
    setLoading(true);
    setError(null);
    try{
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/import-holerite', { method:'POST', body: fd });
      if(!res.ok) throw new Error('Falha na extração');
      const data = await res.json();
      setExtraction(data);
      const map = {};
      columns.forEach(c=>{ map[c] = []; });
      columns.forEach(c=>{
        if(data.fieldsExtracted && data.fieldsExtracted[c]) map[c].push(data.fieldsExtracted[c]);
      });
      if(data.rubricas){
        data.rubricas.forEach(r=>{
          Object.values(r).forEach(v=>{
            columns.forEach(c=>{ map[c].push(v); });
          });
        });
        map['rubricas_json'].push(JSON.stringify(data.rubricas));
      }
      if(data.numeros_extraidos){
        data.numeros_extraidos.forEach(n=>{
          columns.forEach(c=>{ map[c].push(n); });
        });
      }
      if(data.fileName) map['fonte_arquivo'].unshift(data.fileName);
      if(session?.user?.email) map['user_email'].unshift(session.user.email);
      map['holerite_ID'].unshift(crypto.randomUUID());
      map['status_validacao'].unshift('pendente');
      const cleaned = {};
      columns.forEach(c=>{ cleaned[c] = unique(map[c]); });
      setCandidates(cleaned);
      const initial = {};
      columns.forEach(c=>{
        let val = cleaned[c][0] || '';
        if(currencyFields.includes(c)) val = formatBRL(val);
        initial[c] = val;
      });
      setForm(initial);
      setStep('validacao');
    }catch(err){
      setError('Erro ao enviar arquivo.');
    }finally{
      setLoading(false);
    }
  };

  const handleInput = (field, value) => {
    if(currencyFields.includes(field)) value = normalizeBRLInput(value);
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSelect = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setOpenList(prev => ({ ...prev, [field]: false }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const final = { ...form };
    columns.forEach(c=>{ if(final[c] === undefined || final[c] === null) final[c] = ''; });
    if(session?.user?.email && !final.user_email) final.user_email = session.user.email;
    if(extraction?.fileName && !final.fonte_arquivo) final.fonte_arquivo = extraction.fileName;
    if(!final.holerite_ID) final.holerite_ID = crypto.randomUUID();
    if(!final.status_validacao) final.status_validacao = 'pendente';
    if(!final.data_pagamento && final.competencia) final.data_pagamento = calcularQuintoDiaUtil(final.competencia);
    if(!final.mes && final.data_pagamento) final.mes = final.data_pagamento.slice(0,7);
    try{ JSON.parse(final.rubricas_json || '[]'); }
    catch{ setLoading(false); setError('rubricas_json inválido'); return; }
    currencyFields.forEach(f=>{ final[f] = normalizeBRLInput(final[f]); });
    try{
      const res = await fetch('/api/holerites', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(final)
      });
      if(!res.ok) throw new Error('Falha ao salvar');
      await res.json();
      onClose();
    }catch(err){
      setError('Erro ao salvar.');
    }finally{
      setLoading(false);
    }
  };

  const renderField = (field) => (
    <div key={field} className="space-y-1">
      <label className="text-sm font-medium">{field}</label>
      <div className="relative">
        <input
          className="w-full p-2 border rounded"
          value={form[field] || ''}
          onChange={e=>handleInput(field, e.target.value)}
        />
        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" onClick={()=>setOpenList(o=>({...o,[field]:!o[field]}))}>▼</button>
        {openList[field] && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white shadow">
            {(candidates[field] || []).map((opt,i)=>(
              <li key={i} className="cursor-pointer px-3 py-2 hover:bg-gray-100" onClick={()=>handleSelect(field,opt)}>{opt}</li>
            ))}
          </ul>
        )}
      </div>
      {candidates[field] && candidates[field][0] && (
        <p className="text-xs text-gray-500">valor detectado</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" data-testid="backdrop" />
      <div ref={modalRef} className="relative z-10 w-full max-w-3xl rounded-xl bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 tabIndex="-1" className="text-xl font-semibold">Importar Holerite</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {step === 'upload' && (
          <div className="space-y-4">
            <input type="file" accept=".pdf,image/*" onChange={handleFileChange} />
            {file && <p className="text-sm">{file.name} ({(file.size/1024/1024).toFixed(2)} MB)</p>}
          </div>
        )}
        {step === 'validacao' && (
          <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {columns.map(renderField)}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>Cancelar</button>
          {step === 'validacao' && (
            <button type="button" className="px-4 py-2 rounded border" onClick={()=>setStep('upload')}>Voltar</button>
          )}
          {step === 'upload' && (
            <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50" onClick={handleUpload} disabled={loading || !file}>{loading ? 'Enviando...' : 'Enviar para extração'}</button>
          )}
          {step === 'validacao' && (
            <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
