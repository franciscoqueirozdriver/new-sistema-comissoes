"use client";
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import RelatorioDSRTable from '@/components/RelatorioDSRTable';
import useDiasUteis from '@/lib/useDiasUteis';

const getAnoMes = (date) => {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
};

export default function RelatorioDSRPage() {
  const { data: session, status } = useSession();
  const [mesAno, setMesAno] = useState(getAnoMes(new Date()));
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mostrar, setMostrar] = useState({
    comissaoBruto: true,
    comissaoLiquido: true,
    dsrBruto: true,
    dsrLiquido: true
  });

  const [usarComSabado, setUsarComSabado] = useState(false);

  const [ufs, setUfs] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [uf, setUf] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [considerarFeriados, setConsiderarFeriados] = useState(false);

  const { diasSemSabado, diasComSabado, diasDescanso } = useDiasUteis(mesAno, considerarFeriados, uf, municipio);

  const fetchPagamentos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const [ano, mes] = mesAno.split('-');
    const params = new URLSearchParams({ ano, mes });
    try {
      const res = await fetch(`/api/pagamentos?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar pagamentos.');
      const data = await res.json();
      setPagamentos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mesAno, session]);

  useEffect(() => { fetchPagamentos(); }, [fetchPagamentos]);

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(r => r.json())
      .then(setUfs)
      .catch(() => setUfs([]));
  }, []);

  useEffect(() => {
    if (!uf) { setMunicipios([]); return; }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then(setMunicipios)
      .catch(() => setMunicipios([]));
  }, [uf]);

  if (status === 'loading') return <div className="p-6 text-center">Carregando...</div>;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') return <div className="p-6 text-center">Acesso não autorizado.</div>;

  return (
    <div className="space-y-6" id="pagina-relatorio">
      <div className="print-hide">
        <h1 className="text-3xl font-bold text-gray-900">Relatório de DSR</h1>
        <p className="text-gray-600 mt-2">Cálculo consolidado de DSR por pagamento.</p>
      </div>

      <Card className="print-hide">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium">Mês/Ano</label>
            <input type="month" className="w-full p-2 border rounded" value={mesAno} onChange={(e) => setMesAno(e.target.value)} />
          </div>
          <div className="text-sm mt-4">
            <p>Dias úteis s/ sábado: {diasSemSabado}</p>
            <p>Dias úteis c/ sábado: {diasComSabado}</p>
            <p>Dias de descanso: {diasDescanso}</p>
          </div>
          <div>
            <label className="text-sm font-medium">UF</label>
            <select className="w-full p-2 border rounded bg-white" value={uf} onChange={(e) => setUf(e.target.value)}>
              <option value="">Selecione</option>
              {ufs.map(u => <option key={u.id} value={u.sigla}>{u.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Município</label>
            <select className="w-full p-2 border rounded bg-white" value={municipio} onChange={(e) => setMunicipio(e.target.value)} disabled={!uf}>
              <option value="">Selecione</option>
              {municipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="feriadosr" checked={considerarFeriados} onChange={(e) => setConsiderarFeriados(e.target.checked)} />
            <label htmlFor="feriadosr" className="text-sm">Considerar feriados locais</label>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-center text-red-500 print-hide">Erro: {error}</p>}

      {pagamentos.length > 0 && (
        <Card id="report-area">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Relatório de DSR</h2>
              <div className="text-right">
                <p className="font-semibold">Período: {mesAno.split('-')[1]}/{mesAno.split('-')[0]}</p>
                <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <RelatorioDSRTable
              pagamentos={pagamentos}
              mostrar={mostrar}
              usarComSabado={usarComSabado}
              diasComSabado={diasComSabado}
              diasSemSabado={diasSemSabado}
              diasDescanso={diasDescanso}
              ocultarData
              ocultarStatus
              ocultarTipo              
            />
            <div className="flex justify-end mt-6 print-hide">
              <button onClick={() => window.print()} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Imprimir / Salvar PDF</button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
