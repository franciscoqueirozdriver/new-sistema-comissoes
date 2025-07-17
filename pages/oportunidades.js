import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { addDays, format, parseISO } from 'date-fns';

// Objeto com o estado inicial do formulário, com os valores padrão que você pediu
const formInicial = {
  empresa: "",
  fonte: "Outbound", // Valor Padrão
  fase_do_funil: "Proposta comercial", // Valor Padrão
  data_entrada: "",
  previsao_fechamento: "",
  valor_implantacao: "",
  parcelas_implantacao: "2", // Valor Padrão
  valor_mensalidade: "",
  qtde_mensalidades: "6", // Valor Padrão
  data_fechamento: "", // Opcional
  data_primeiro_pagamento_mensal: "",
  percentual_imposto: "0,19",
  comissao: "0,20",
  observacao: "", // Opcional
};

export default function OportunidadesPage() {
  const [config, setConfig] = useState({ fonte: [], fase_do_funil: [] });
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
      if (!configRes.ok || !listaRes.ok) throw new Error("Falha ao buscar dados do servidor.");
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

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- FUNÇÃO handleSalvar COM VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ---
  const handleSalvar = async () => {
    // Lista de campos obrigatórios
    const camposObrigatorios = [
      'empresa', 'fonte', 'fase_do_funil', 'data_entrada', 
      'previsao_fechamento', 'valor_implantacao', 'parcelas_implantacao',
      'valor_mensalidade', 'qtde_mensalidades', 'data_primeiro_pagamento_mensal',
      'percentual_imposto', 'comissao'
    ];

    // Verifica se algum campo obrigatório está vazio
    for (const campo of camposObrigatorios) {
      if (!form[campo]) {
        // Formata o nome do campo para exibição no alerta
        const nomeCampoFormatado = campo.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        alert(`O campo "${nomeCampoFormatado}" é obrigatório.`);
        return; // Para a execução se encontrar um campo vazio
      }
    }

    const isEditing = !!form.id;
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `/api/oportunidades/${form.id}` : "/api/oportunidades";

    const dadosParaSalvar = { ...form,
      percentual_imposto: String(form.percentual_imposto).replace('.', ','),
      comissao: String(form.comissao).replace('.', ',')
    };

    try {
      const response = await fetch(endpoint, {
        method: method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaSalvar),
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
    if (!confirm("Tem certeza que deseja excluir esta oportunidade?")) return;
    try {
      const response = await fetch(`/api/oportunidades/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao excluir.");
      }
      setLista(prev => prev.filter(item => String(item.id) !== String(id)));
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
    const formAtualizado = { ...form, [campo]: valor };
    if (campo === 'data_entrada' && valor) {
      try {
        const dataEntrada = parseISO(valor);
        formAtualizado.previsao_fechamento = format(addDays(dataEntrada, 60), 'yyyy-MM-dd');
        formAtualizado.data_primeiro_pagamento_mensal = format(addDays(dataEntrada, 70), 'yyyy-MM-dd');
      } catch (e) { console.error("Data inválida", e); }
    }
    setForm(formAtualizado);
  };

  if (loading) return <div className="p-6 text-center">Carregando oportunidades...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erro ao carregar dados: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Cadastro de Oportunidades</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{form.id ? `Editando Oportunidade ID: ${form.id}` : 'Nova Oportunidade'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Empresa</label>
              <input placeholder="Nome da Empresa" className="w-full p-2 border rounded" value={form.empresa || ""} onChange={e => atualizarCampo("empresa", e.target.value)} />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600">Fonte</label>
              <select className="w-full p-2 border rounded bg-white" value={form.fonte || ""} onChange={e => atualizarCampo("fonte", e.target.value)}>
                <option value="">Selecione...</option>
                {(config.fonte || []).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600">Fase do Funil</label>
              <select className="w-full p-2 border rounded bg-white" value={form.fase_do_funil || ""} onChange={e => atualizarCampo("fase_do_funil", e.target.value)}>
                <option value="">Selecione...</option>
                {(config.fase_do_funil || []).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600">Data de Entrada</label>
              <input type="date" className="w-full p-2 border rounded" value={form.data_entrada || ""} onChange={e => atualizarCampo("data_entrada", e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Previsão de Fechamento</label>
              <input type="date" className="w-full p-2 border rounded" value={form.previsao_fechamento || ""} onChange={e => atualizarCampo("previsao_fechamento", e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Valor Implantação</label>
              <input placeholder="Ex: 10000,00" type="text" className="w-full p-2 border rounded" value={form.valor_implantacao || ""} onChange={e => atualizarCampo("valor_implantacao", e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Parcelas Implantação</label>
              <input type="number" className="w-full p-2 border rounded" value={form.parcelas_implantacao || ""} onChange={e => atualizarCampo("parcelas_implantacao", e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Valor Mensalidade</label>
              <input placeholder="Ex: 500,00" type="text" className="w-full p-2 border rounded" value={form.valor_mensalidade || ""} onChange={e => atualizarCampo("valor_mensalidade", e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Qtde Mensalidades</label>
              <input type="number" className="w-full p-2 border rounded" value={form.qtde_mensalidades || ""} onChange={e => atualizarCampo("qtde_mensalidades", e.target.value)} />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600">Data de Fechamento</label>
              <input type="date" className="w-full p-2 border rounded" value={form.data_fechamento || ""} onChange={e => atualizarCampo("data_fechamento", e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Data 1º Pag. Mensal</label>
              <input type="date" className="w-full p-2 border rounded" value={form.data_primeiro_pagamento_mensal || ""} onChange={e => atualizarCampo("data_primeiro_pagamento_mensal", e.target.value)} />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600">% Imposto</label>
              <input placeholder="Ex: 0,19" type="text" className="w-full p-2 border rounded" value={form.percentual_imposto || ""} onChange={e => atualizarCampo("percentual_imposto", e.target.value)} />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600">% Comissão</label>
              <input placeholder="Ex: 0,20" type="text" className="w-full p-2 border rounded" value={form.comissao || ""} onChange={e => atualizarCampo("comissao", e.target.value)} />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-600">Observação</label>
            <textarea className="w-full p-2 border rounded" value={form.observacao || ""} onChange={e => atualizarCampo("observacao", e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setForm(formInicial)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Limpar</button>
            <button onClick={handleSalvar} className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700">
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
                {lista && lista.filter(opp => opp && opp.id).map(opp => (
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
