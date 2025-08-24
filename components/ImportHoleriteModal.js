import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

const columns = [
  "mes","competencia","empresa","salario_base","comissao","dsr","dias_dsr",
  "valor_bruto","valor_liquido","data_pagamento","user_email","fonte_arquivo",
  "holerite_ID","rubricas_json","status_validacao"
];

export default function ImportHoleriteModal(){
  const { data: session } = useSession();
  const [file, setFile] = useState(null);
  const [fields, setFields] = useState(() => {
    const obj = {}; columns.forEach(c=>obj[c]=""); return obj;
  });

  useEffect(() => {
    if(session?.user?.email){
      setFields(f => ({ ...f, user_email: session.user.email }));
    }
  }, [session]);

  const handleUpload = async () => {
    if(!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/import-holerite', { method:'POST', body: fd });
    const data = await res.json();
    if(data.fieldsExtracted){
      const fe = data.fieldsExtracted;
      fe.user_email = session?.user?.email || fe.user_email;
      fe.fonte_arquivo = data.fileName;
      fe.holerite_ID = fe.holerite_ID || uuidv4();
      fe.status_validacao = 'pendente';
      fe.mes = fe.data_pagamento ? fe.data_pagamento.slice(0,7) : '';
      setFields(fe);
    }
  };

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const payload = {};
    columns.forEach(c => { payload[c] = fields[c] || ""; });
    const res = await fetch('/api/holerites', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  };

  return (
    <div>
      <input type="file" onChange={e=>setFile(e.target.files[0])} />
      <button type="button" onClick={handleUpload}>Upload</button>
      {columns.map(col => (
        <div key={col}>
          <label>{col}</label>
          <input name={col} value={fields[col] || ''} onChange={handleChange} />
        </div>
      ))}
      <button type="button" onClick={handleSubmit}>Salvar</button>
    </div>
  );
}
