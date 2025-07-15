import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Função para formatar a data no padrão AAAA-MM para o input de mês
const getAnoMes = (date) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
};

// Função para converter strings de moeda/decimal para número
const parseNumero = (valor) => {
    if (typeof valor === 'number') return valor;
    if (typeof valor !== 'string') return 0;
    // Remove tudo que não for dígito ou vírgula, depois troca vírgula por ponto.
    return parseFloat(valor.replace(/[^\d,]/g, '').replace(",", ".")) || 0;
};

export default function PagamentosPage() {
    const [pagamentos, setPagamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado dos filtros consolidado em um único objeto
    const [filtros, setFiltros] = useState({
        mesAno: getAnoMes(new Date()),
        empresa: "",
        status: "",
    });

    const [formEdicao, setFormEdicao] = useState(null);

    // Efeito para buscar os dados sempre que os filtros mudarem
    useEffect(() => {
        const fetchPagamentos = async () => {
            setLoading(true);
            setError(null);

            const [ano, mes] = filtros.mesAno.split('-');
            const params = new URLSearchParams({ ano, mes });
            if (filtros.empresa) params.append('empresa', filtros.empresa);
            if (filtros.status) params.append('status', filtros.status);

            try {
                const response = await fetch(`/api/pagamentos?${params.toString()}`);
                if (!response.ok) throw new Error("Falha ao buscar pagamentos.");
                const data = await response.json();
                setPagamentos(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPagamentos();
    }, [filtros]);

    const handleEditClick = (pagamento) => {
        setFormEdicao({ ...pagamento });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormEdicao(null);
    };

    const handleFormChange = (campo, valor) => {
        const formAtualizado = { ...formEdicao, [campo]: valor };
        
        if (campo === 'valor_bruto' || campo === 'percentual_imposto') {
            const valorBruto = parseNumero(formAtualizado.valor_bruto);
            const imposto = parseNumero(formAtualizado.percentual_imposto);
            
            const novaComissao = (valorBruto * (1 - imposto)) * 0.20;
            
            // Formata o número de volta para o padrão string com vírgula (ex: "1.620,50")
            formAtualizado.valor_liquido_comissao = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(novaComissao);
        }
        
        setFormEdicao(formAtualizado);
    };

    const handleSaveChanges = async () => {
        if (!formEdicao) return;
        try {
            const response = await fetch(`/api/pagamentos/${formEdicao.id_pagamento}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formEdicao),
            });
            if (!response.ok) throw new Error("Falha ao atualizar o pagamento.");
            
            alert("Pagamento atualizado com sucesso!");
            setPagamentos(pagamentos.map(p => 
                p.id_pagamento === formEdicao.id_pagamento ? formEdicao : p
            ));
            setFormEdicao(null);
        } catch (err) {
            alert(`Erro: ${err.message}`);
        }
    };
    
    // Função para atualizar os filtros de forma limpa
    const atualizarFiltro = (campo, valor) => {
        setFiltros(prevFiltros => ({...prevFiltros, [campo]: valor}));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Pagamentos</h1>
            
            <Card>
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="text-sm font-medium">Mês/Ano</label>
                        <input 
                            type="month" 
                            className="w-full p-2 border rounded" 
                            value={filtros.mesAno} 
                            onChange={(e) => atualizarFiltro('mesAno', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Empresa</label>
                        <input 
                            type="text" 
                            placeholder="Nome da empresa..." 
                            className="w-full p-2 border rounded"
                            value={filtros.empresa}
                            onChange={(e) => atualizarFiltro('empresa', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <select 
                            className="w-full p-2 border rounded bg-white"
                            value={filtros.status}
                            onChange={(e) => atualizarFiltro('status', e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="Previsto">Previsto</option>
                            <option value="Recebido">Recebido</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {formEdicao && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold mb-2">Editando Pagamento ID: {formEdicao.id_pagamento} ({formEdicao.empresa})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div>
                                <label className="text-xs">Valor Bruto</label>
                                <input type="text" className="w-full p-2 border rounded" value={formEdicao.valor_bruto || ''} onChange={(e) => handleFormChange('valor_bruto', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs">% Imposto</label>
                                <input type="text" className="w-full p-2 border rounded" value={formEdicao.percentual_imposto || ''} onChange={(e) => handleFormChange('percentual_imposto', e.target.value)} />
                            </div>
                             <div>
                                <label className="text-xs font-bold">Valor Comissão (Calculado)</label>
                                <input type="text" readOnly className="w-full p-2 border rounded bg-gray-100" value={formEdicao.valor_liquido_comissao || ''} />
                            </div>
                             <div>
                                <label className="text-xs">Data Prevista</label>
                                <input type="date" className="w-full p-2 border rounded" value={formEdicao.data_prevista || ''} onChange={(e) => handleFormChange('data_prevista', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs">Data Recebida</label>
                                <input type="date" className="w-full p-2 border rounded" value={formEdicao.data_recebida || ''} onChange={(e) => handleFormChange('data_recebida', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs">Status</label>
                                <select className="w-full p-2 border rounded" value={formEdicao.status || ''} onChange={(e) => handleFormChange('status', e.target.value)}>
                                    <option>Previsto</option>
                                    <option>Recebido</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancelar</button>
                            <button onClick={handleSaveChanges} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Salvar Alterações</button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-4">
                    {loading && <p className="text-center">Carregando pagamentos...</p>}
                    {error && <p className="text-center text-red-500">Erro: {error}</p>}
                    {!loading && !error && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2">Empresa</th>
                                        <th className="p-2">Tipo</th>
                                        <th className="p-2">Parcela</th>
                                        <th className="p-2">Valor Comissão</th>
                                        <th className="p-2">Data Prevista</th>
                                        <th className="p-2">Data Recebida</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagamentos.map(p => (
                                        <tr key={p.id_pagamento} className="border-b hover:bg-gray-50">
                                            <td className="p-2">{p.empresa}</td>
                                            <td className="p-2">{p.tipo}</td>
                                            <td className="p-2">{p.num_parcela}</td>
                                            <td className="p-2">{p.valor_liquido_comissao}</td>
                                            <td className="p-2">{p.data_prevista}</td>
                                            <td className="p-2">{p.data_recebida}</td>
                                            <td className="p-2">{p.status}</td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => handleEditClick(p)} className="font-medium text-blue-600 hover:underline">Editar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}