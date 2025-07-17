import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { addDays, format, parseISO } from 'date-fns';

const formInicial = {
  empresa: "", fonte: "Outbound", fase_do_funil: "Proposta comercial",
  data_entrada: "", previsao_fechamento: "", valor_implantacao: "",
  parcelas_implantacao: "2", valor_mensalidade: "", qtde_mensalidades: "6",
  data_fechamento: "", data_primeiro_pagamento_mensal: "",
  percentual_imposto: "0,19", comissao: "0,20", observacao: "",
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

  const handleSalvar = async () => {
    const camposObrigatorios = [
      'empresa', 'fonte', 'fase_do_funil', 'data_entrada', 'previsao_fechamento', 
      'valor_implantacao', 'parcelas_implantacao', 'valor_mensalidade', 
      'qtde_mensalidades', 'data_primeiro_pagamento_mensal', 'percentual_imposto', 'comissao'
    ];
    for (const campo of camposObrigatorios) {
      if (!form[campo]) {
        const nomeCampoFormatado = campo.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        alert(`O campo "${nomeCampoFormatado}" é obrigatório.`);
        return;
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
             {/* ... Seu formulário completo aqui ... */}
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
                {/* --- CORREÇÃO APLICADA AQUI --- */}
                {/* Filtra a lista para remover itens nulos/inválidos antes de renderizar */}
                {lista && lista.filter(opp => opp).map(opp => (
                  <tr key={opp.id || Math.random()} className="border-b hover:bg-gray-50">
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
