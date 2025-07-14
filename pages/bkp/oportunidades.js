import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Estado inicial do formulário, agora espelhando EXATAMENTE sua planilha
const formInicial = {
  empresa: "",
  fonte: "",
  fase_do_funil: "",
  data_entrada: "",
  previsao_fechamento: "",
  valor_implantacao: "",
  parcelas_implantacao: "", // Nome corrigido
  valor_mensalidade: "",
  qtde_mensalidades: "", // Nome corrigido
  data_fechamento: "",
  data_primeiro_pagamento_mensal: "", // Nome corrigido
  percentual_imposto: "0,19",
  observacao: "",
};

export default function OportunidadesPage() {
  const [config, setConfig] = useState({ fontes: [], fases: [] });
  const [form, setForm] = useState(formInicial);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, listaRes] = await Promise.all([
        fetch("/api/configuracoes"),
        fetch("/api/oportunidades"),
      ]);
      if (!configRes.ok || !listaRes.ok) {
        throw new Error("Falha ao buscar dados do servidor.");
      }
      const configData = await configRes.json();
      const listaData = await listaRes.json();
      setConfig(configData);
      setLista(listaData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSalvar = async () => {
    const isEditing = !!form.id;
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `/api/oportunidades/${form.id}` : "/api/oportunidades";

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Falha ao ${isEditing ? 'atualizar' : 'salvar'} oportunidade.`);
      }

      alert(`Oportunidade ${isEditing ? 'atualizada' : 'salva'} com sucesso!`);
      setForm(formInicial); 
      fetchData(); 
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta oportunidade e todos os seus pagamentos associados?")) {
      return;
    }
    try {
      const response = await fetch(`/api/oportunidades/${id}`, { method: "DELETE" });
      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Falha ao excluir.");
      }
      setLista(prevLista => prevLista.filter(item => String(item.id) !== String(id)));
      alert("Oportunidade excluída com sucesso.");
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleEditar = (oportunidade) => {
    setForm(oportunidade);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const atualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  if (loading) return <div className="p-6"><p>Carregando oportunidades...</p></div>;
  if (error) return <div className="p-6"><p className="text-red-500">Erro: {error}</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Cadastro de Oportunidades</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{form.id ? `Editando Oportunidade ID: ${form.id}` : 'Nova Oportunidade'}</h2>
          
          {/* FORMULÁRIO CORRIGIDO COM OS CAMPOS EXATOS DA SUA PLANILHA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input placeholder="Empresa" className="p-2 border rounded" value={form.empresa || ""} onChange={e => atualizarCampo("empresa", e.target.value)} />
            
            <select className="p-2 border rounded" value={form.fonte || ""} onChange={e => atualizarCampo("fonte", e.target.value)}>
              <option value="">Selecione a Fonte</option>
              {config.fontes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            
            <select className="p-2 border rounded" value={form.fase_do_funil || ""} onChange={e => atualizarCampo("fase_do_funil", e.target.value)}>
              <option value="">Selecione a Fase</option>
              {config.fases.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <div>
                <label className="text-xs text-gray-500">Data de Entrada</label>
                <input type="date" className="w-full p-2 border rounded" value={form.data_entrada || ""} onChange={e => atualizarCampo("data_entrada", e.target.value)} />
            </div>

            <div>
                <label className="text-xs text-gray-500">Previsão de Fechamento</label>
                <input type="date" className="w-full p-2 border rounded" value={form.previsao_fechamento || ""} onChange={e => atualizarCampo("previsao_fechamento", e.target.value)} />
            </div>

            <input placeholder="Valor Implantação" type="number" className="p-2 border rounded" value={form.valor_implantacao || ""} onChange={e => atualizarCampo("valor_implantacao", e.target.value)} />
            <input placeholder="Parcelas Implantação" type="number" className="p-2 border rounded" value={form.parcelas_implantacao || ""} onChange={e => atualizarCampo("parcelas_implantacao", e.target.value)} />

            <input placeholder="Valor Mensalidade" type="number" className="p-2 border rounded" value={form.valor_mensalidade || ""} onChange={e => atualizarCampo("valor_mensalidade", e.target.value)} />
            <input placeholder="Qtde Mensalidades" type="number" className="p-2 border rounded" value={form.qtde_mensalidades || ""} onChange={e => atualizarCampo("qtde_mensalidades", e.target.value)} />
            
            <div>
                <label className="text-xs text-gray-500">Data de Fechamento</label>
                <input type="date" className="w-full p-2 border rounded" value={form.data_fechamento || ""} onChange={e => atualizarCampo("data_fechamento", e.target.value)} />
            </div>

            <div>
                <label className="text-xs text-gray-500">Data 1º Pag. Mensal</label>
                <input type="date" className="w-full p-2 border rounded" value={form.data_primeiro_pagamento_mensal || ""} onChange={e => atualizarCampo("data_primeiro_pagamento_mensal", e.target.value)} />
            </div>
            
            <input placeholder="% Imposto" type="number" step="0.01" className="p-2 border rounded" value={form.percentual_imposto || ""} onChange={e => atualizarCampo("percentual_imposto", e.target.value)} />
          </div>
          
          <textarea placeholder="Observação" className="w-full p-2 border rounded" value={form.observacao || ""} onChange={e => atualizarCampo("observacao", e.target.value)} />

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setForm(formInicial)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">Limpar</button>
            <button onClick={handleSalvar} className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700 transition-colors">
              {form.id ? 'Atualizar Oportunidade' : 'Salvar Nova Oportunidade'}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Oportunidades Cadastradas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">Empresa</th>
                  <th className="p-2">Fonte</th>
                  <th className="p-2">Fase</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(opp => (
                  <tr key={opp.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{opp.id}</td>
                    <td className="p-2">{opp.empresa}</td>
                    <td className="p-2">{opp.fonte}</td>
                    <td className="p-2">{opp.fase_do_funil}</td>
                    <td className="p-2 text-center space-x-2">
                      <button className="font-medium text-blue-600 hover:underline" onClick={() => handleEditar(opp)}>Editar</button>
                      <button className="font-medium text-red-600 hover:underline" onClick={() => handleDelete(opp.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
