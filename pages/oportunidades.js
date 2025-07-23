import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { addDays, addMonths, format, parseISO } from 'date-fns';
import { useSession } from "next-auth/react"; // Importa o hook de sessão

const parseCurrency = (valor) => {
  if (typeof valor === 'number') return valor;
  if (!valor || typeof valor !== 'string') return 0;
  const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(numeroLimpo) || 0;
};

const formatCurrency = (valor) => {
  return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};


// Objeto com o estado inicial do formulário
const formInicial = {
  empresa: "",
  fonte: "Outbound",
  fase_do_funil: "Proposta comercial",
  data_entrada: "",
  previsao_fechamento: "",
  valor_implantacao: "",
  parcelas_implantacao: "2",
  valor_mensalidade: "",
  qtde_mensalidades: "6",
  data_fechamento: "",
  data_primeiro_pagamento_mensal: "",
  percentual_imposto: "0,19",
  comissao: "0,20",
  observacao: "",
};

export default function OportunidadesPage() {
  const { data: session } = useSession(); // Pega a sessão atual do usuário
  const [config, setConfig] = useState({ fonte: [], fase_do_funil: [] });
  const [form, setForm] = useState(formInicial);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [totalImplantacao, setTotalImplantacao] = useState(0);

  // --- NOVO ESTADO PARA O FILTRO DE VISÃO ---
  const [visao, setVisao] = useState('propria'); // 'propria' ou 'todos'

  const fetchData = useCallback(async () => {
    if (!session) return; // Não faz nada se a sessão ainda não carregou

    setLoading(true);
    setError(null);
    try {
      // Adiciona o parâmetro de visão à chamada da API de oportunidades
      const params = new URLSearchParams();
      if (session.user.role === 'admin' && visao === 'todos') {
        params.append('visao', 'todos');
      }

      const [configRes, listaRes] = await Promise.all([
        fetch("/api/configuracoes"),
        fetch(`/api/oportunidades?${params.toString()}`),
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
  }, [session, visao]); // Adiciona 'visao' e 'session' às dependências
const fetchPagamentos = async (idOpp) => {
    setLoadingPagamentos(true);
    try {
      const res = await fetch(`/api/pagamentos?id_oportunidade=${idOpp}`);
      if (res.ok) {
        const data = await res.json();
        setPagamentos(data.map(p => ({
          ...p,
          valor_bruto: parseCurrency(p.valor_bruto),
          fixed: false
        })));
        const total = data
          .filter(p => p.tipo === 'Implantação')
          .reduce((acc, p) => acc + parseCurrency(p.valor_bruto), 0);
        setTotalImplantacao(total);
      } else {
        setPagamentos([]);
        setTotalImplantacao(0);
      }
    } catch (e) {
      setPagamentos([]);
      setTotalImplantacao(0);
    } finally {
      setLoadingPagamentos(false);
    }
  };

  const redistributeImplantacao = (pagamentosLista) => {
    const implantacoes = pagamentosLista.filter(p => p.tipo === 'Implantação');
    if (implantacoes.length === 0) return pagamentosLista;

    const fixedTotal = implantacoes
      .filter(p => p.fixed)
      .reduce((acc, p) => acc + parseFloat(p.valor_bruto || 0), 0);

    const restantes = implantacoes.filter(p => !p.fixed);

    const restanteTotal = totalImplantacao - fixedTotal;
    const valorCada = restantes.length > 0 ? restanteTotal / restantes.length : 0;

    let idx = 0;
    return pagamentosLista.map(p => {
      if (p.tipo !== 'Implantação') return p;
      if (p.fixed) return p;
      return { ...p, valor_bruto: Number(valorCada.toFixed(2)), fixed: false };
    });
  };

  const handleValorChange = (index, valor) => {
    setPagamentos(prev => {
      const novos = [...prev];
      const num = parseCurrency(valor);
      novos[index] = { ...novos[index], valor_bruto: num, fixed: true };
      return redistributeImplantacao(novos);
    });
  };

  const handleDataPrevistaChange = (index, valor) => {
    setPagamentos(prev => {
      const novos = [...prev];
 const pagamento = novos[index];
      novos[index] = { ...pagamento, data_prevista: valor };

      if (valor && pagamento.tipo) {
        let baseDate;
        try {
          baseDate = parseISO(valor);
        } catch (e) {
          baseDate = null;
        }

        if (baseDate) {
          for (let i = index + 1; i < novos.length; i++) {
            if (novos[i].tipo === pagamento.tipo) {
              baseDate = addMonths(baseDate, 1);
              novos[i] = { ...novos[i], data_prevista: format(baseDate, 'yyyy-MM-dd') };
            }
          }
        }
      }

      return novos;
    });
  };



  const handleExcluirPagamento = (index) => {
    setPagamentos(prev => {
      const novos = prev.filter((_, i) => i !== index);
      const implantacoes = novos.filter(p => p.tipo === 'Implantação');
      if (implantacoes.length === 0) {
        alert('É obrigatório manter ao menos uma parcela de implantação.');
        return prev;
      }
      return redistributeImplantacao(novos);
    });
  };
  

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    
    if (isEditing) {
      dadosParaSalvar.pagamentos = pagamentos.map(p => ({
        tipo: p.tipo,
        valor_bruto: p.valor_bruto,
        data_prevista: p.data_prevista,
        data_recebida: p.data_recebida,
        status: p.status
      }));
    }    
    
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
      setPagamentos([]);      
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
    fetchPagamentos(oportunidade.id);   
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setForm(formInicial);
    setPagamentos([]);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Cadastro de Oportunidades</h1>
        {session?.user?.role === 'admin' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Visão:</label>
            <select
              value={visao}
              onChange={(e) => setVisao(e.target.value)}
              className="p-2 border rounded bg-white"
            >
              <option value="propria">Minhas Oportunidades</option>
              <option value="todos">Todas as Oportunidades</option>
            </select>
          </div>
        )}
      </div>

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
          {form.id && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Pagamentos</h3>
              {loadingPagamentos ? (
                <p>Carregando pagamentos...</p>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Tipo</th>
                      <th className="p-2 border">Parcela</th>
                      <th className="p-2 border">Valor</th>
                      <th className="p-2 border">Data Prevista</th>
                      <th className="p-2 border text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((p, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 border">{p.tipo}</td>
                        <td className="p-2 border">{p.num_parcela}</td>
                        <td className="p-2 border">
                          <input type="number" className="w-full p-1 border rounded" value={p.valor_bruto} onChange={e => handleValorChange(idx, e.target.value)} />
                        </td>
                        
                        <td className="p-2 border">
                          <input
                            type="date"
                            className="w-full p-1 border rounded"
                            value={p.data_prevista || ''}
                            onChange={e => handleDataPrevistaChange(idx, e.target.value)}
                          />
                        </td>                        
                        
                        <td className="p-2 border text-center">
                          <button onClick={() => handleExcluirPagamento(idx)} className="text-red-600 hover:underline">Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-gray-500">Total Implantação: {formatCurrency(totalImplantacao)}</p>
            </div>
          )}
         
          <div className="flex justify-end gap-2 mt-4">
          
                      {form.id && (
              <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancelar</button>
            )}          
            <button onClick={() => { setForm(formInicial); setPagamentos([]); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Limpar</button>

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
