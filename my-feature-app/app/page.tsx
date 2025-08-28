"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import RelatorioDSRTable from '@/src/components/RelatorioDSRTable';
import useDiasUteis from '@/src/hooks/useDiasUteis';

const getAnoMes = (date: Date): string => {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
};

interface Pagamento {
  id: string;
  data: string;
  valor: number;
  // Add other properties from your pagamentos data structure
}

interface UF {
  id: number;
  sigla: string;
  nome: string;
}

interface Municipio {
    id: number;
    nome: string;
}

export default function CalcularDSRPage() {
  const [mesAno, setMesAno] = useState<string>(getAnoMes(new Date()));
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [mostrar, setMostrar] = useState({
    comissaoBruto: false,
    comissaoLiquido: false,
    dsrBruto: false,
    dsrLiquido: false
  });

  const [usarComSabado, setUsarComSabado] = useState<boolean>(false);

  const [ufs, setUfs] = useState<UF[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [uf, setUf] = useState<string>('');
  const [municipio, setMunicipio] = useState<string>('');
  const [considerarFeriados, setConsiderarFeriados] = useState<boolean>(false);

  const { diasSemSabado, diasComSabado, diasDescanso } = useDiasUteis(mesAno, considerarFeriados, uf, municipio);

  const fetchPagamentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [ano, mes] = mesAno.split('-');
    const params = new URLSearchParams({ ano, mes });
    try {
      const res = await fetch(`/api/pagamentos?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar pagamentos.');
      const data = await res.json();
      setPagamentos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mesAno]);

  useEffect(() => {
    fetchPagamentos();
  }, [fetchPagamentos]);

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

  const toggleMostrar = (campo: keyof typeof mostrar) => {
    setMostrar(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Cálculo de DSR</h1>
      </div>

      <Card>
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="font-medium text-sm mb-2">Bases de Cálculo</p>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mostrar.comissaoBruto} onChange={() => toggleMostrar('comissaoBruto')} />Comissão sobre o Valor Bruto</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mostrar.comissaoLiquido} onChange={() => toggleMostrar('comissaoLiquido')} />Comissão sobre o Valor Líquido</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mostrar.dsrBruto} onChange={() => toggleMostrar('dsrBruto')} />DSR sobre o Valor Bruto</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mostrar.dsrLiquido} onChange={() => toggleMostrar('dsrLiquido')} />DSR sobre o Valor Líquido</label>
            </div>
            <div>
              <p className="font-medium text-sm mb-2">Divisor do DSR</p>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="divisor" checked={!usarComSabado} onChange={() => setUsarComSabado(false)} />Usar dias úteis SEM sábado</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="divisor" checked={usarComSabado} onChange={() => setUsarComSabado(true)} />Usar dias úteis COM sábado</label>
              <p className="text-xs text-yellow-700 mt-1">⚠️ Inclua o sábado apenas se o colaborador cumpre 44h semanais ou há compensação formal. Caso contrário, usar apenas dias úteis sem sábado.</p>
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
              <input type="checkbox" id="feriados" checked={considerarFeriados} onChange={(e) => setConsiderarFeriados(e.target.checked)} />
              <label htmlFor="feriados" className="text-sm">Considerar feriados locais no cálculo dos dias de descanso</label>
            </div>
          </div>

          {error && <p className="text-red-500">Erro: {error}</p>}
          {loading ? <p>Carregando...</p> : (
            <RelatorioDSRTable
              pagamentos={pagamentos}
              mostrar={mostrar}
              usarComSabado={usarComSabado}
              diasComSabado={diasComSabado}
              diasSemSabado={diasSemSabado}
              diasDescanso={diasDescanso}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
