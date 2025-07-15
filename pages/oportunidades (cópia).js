import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { addDays, format, parseISO } from 'date-fns'; // Importações para manipular datas

// Estado inicial do formulário
const formInicial = {
  empresa: "",
  fonte: "",
  fase_do_funil: "",
  data_entrada: "",
  previsao_fechamento: "",
  valor_implantacao: "",
  parcelas_implantacao: "",
  valor_mensalidade: "",
  qtde_mensalidades: "",
  data_fechamento: "",
  data_primeiro_pagamento_mensal: "",
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
    // ... (a função fetchData continua a mesma)
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSalvar = async () => {
    // ... (a função handleSalvar continua a mesma)
  };

  const handleDelete = async (id) => {
    // ... (a função handleDelete continua a mesma)
  };

  const handleEditar = (oportunidade) => {
    // ... (a função handleEditar continua a mesma)
  };

  // --- FUNÇÃO ATUALIZADA COM A AUTOMAÇÃO ---
  const atualizarCampo = (campo, valor) => {
    // Atualiza o campo que foi modificado
    setForm(prev => ({ ...prev, [campo]: valor }));

    // Se o campo modificado for a 'data_entrada', calcula as outras datas
    if (campo === 'data_entrada' && valor) {
      try {
        const dataEntrada = parseISO(valor); // Converte a string 'AAAA-MM-DD' para um objeto Date

        // Calcula +60 dias para a previsão de fechamento
        const previsaoFechamento = addDays(dataEntrada, 60);
        
        // Calcula +70 dias para o primeiro pagamento
        const primeiroPagamento = addDays(dataEntrada, 70);

        // Atualiza o estado do formulário com as novas datas calculadas
        setForm(prev => ({
          ...prev,
          previsao_fechamento: format(previsaoFechamento, 'yyyy-MM-dd'),
          data_primeiro_pagamento_mensal: format(primeiroPagamento, 'yyyy-MM-dd'),
        }));
      } catch (error) {
        console.error("Data de entrada inválida:", error);
        // Se a data for inválida, limpa os campos para evitar erros
        setForm(prev => ({
          ...prev,
          previsao_fechamento: "",
          data_primeiro_pagamento_mensal: "",
        }));
      }
    }
  };

  if (loading) return <div className="p-6"><p>Carregando oportunidades...</p></div>;
  if (error) return <div className="p-6"><p className="text-red-500">Erro: {error}</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Cadastro de Oportunidades</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{form.id ? `Editando Oportunidade ID: ${form.id}` : 'Nova Oportunidade'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* O restante do formulário continua o mesmo */}
            <input placeholder="Empresa" className="p-2 border rounded" value={form.empresa || ""} onChange={e => atualizarCampo("empresa", e.target.value)} />
            <select className="p-2 border rounded" value={form.fonte || ""} onChange={e => atualizarCampo("fonte", e.target.value)}>
              <option value="">Selecione a Fonte</option>
              {config.fontes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select className="p-2 border rounded" value={form.fase_do_funil || ""} onChange={e => atualizarCampo("fase_do_funil", e.target.value)}>
              <option value="">Selecione a Fase</option>
              {config.fases.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            {/* Campo Gatilho */}
            <div>
                <label className="text-xs text-gray-500">Data de Entrada</label>
                <input type="date" className="w-full p-2 border rounded" value={form.data_entrada || ""} onChange={e => atualizarCampo("data_entrada", e.target.value)} />
            </div>

            {/* Campos Automáticos */}
            <div>
                <label className="text-xs text-gray-500">Previsão de Fechamento</label>
                <input type="date" className="w-full p-2 border rounded" value={form.previsao_fechamento || ""} onChange={e => atualizarCampo("previsao_fechamento", e.target.value)} />
            </div>
            <div>
                <label className="text-xs text-gray-500">Data 1º Pag. Mensal</label>
                <input type="date" className="w-full p-2 border rounded" value={form.data_primeiro_pagamento_mensal || ""} onChange={e => atualizarCampo("data_primeiro_pagamento_mensal", e.target.value)} />
            </div>

            <input placeholder="Valor Implantação" type="number" className="p-2 border rounded" value={form.valor_implantacao || ""} onChange={e => atualizarCampo("valor_implantacao", e.target.value)} />
            <input placeholder="Parcelas Implantação" type="number" className="p-2 border rounded" value={form.parcelas_implantacao || ""} onChange={e => atualizarCampo("parcelas_implantacao", e.target.value)} />
            <input placeholder="Valor Mensalidade" type="number" className="p-2 border rounded" value={form.valor_mensalidade || ""} onChange={e => atualizarCampo("valor_mensalidade", e.target.value)} />
            <input placeholder="Qtde Mensalidades" type="number" className="p-2 border rounded" value={form.qtde_mensalidades || ""} onChange={e => atualizarCampo("qtde_mensalidades", e.target.value)} />
            <div>
                <label className="text-xs text-gray-500">Data de Fechamento</label>
                <input type="date" className="w-full p-2 border rounded" value={form.data_fechamento || ""} onChange={e => atualizarCampo("data_fechamento", e.target.value)} />
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
      {/* A lista de oportunidades continua a mesma */}
    </div>
  );
}

// Nota: As funções fetchData, handleSalvar, handleDelete e handleEditar
// foram omitidas aqui por brevidade, mas devem permanecer no seu arquivo.
