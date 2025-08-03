"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";

// Função para formatar a data no padrão AAAA-MM para o input de mês
const getAnoMes = (date) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
};

export default function PagamentosPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [pagamentos, setPagamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [config, setConfig] = useState({ status: [] }); // Estado para guardar as configurações

    const [filtros, setFiltros] = useState({
        mesAno: getAnoMes(new Date()),
        empresa: "",
        status: "",
        visao: 'propria' // Novo estado para o filtro de visão do admin
    });

    const [formEdicao, setFormEdicao] = useState(null);

    const fetchData = useCallback(async () => {
        if (!session) return; // Não busca dados se não houver sessão

        setLoading(true);
        setError(null);

        const [ano, mes] = filtros.mesAno.split('-');
        const params = new URLSearchParams({ ano, mes });
        if (filtros.empresa) params.append('empresa', filtros.empresa);
        if (filtros.status) params.append('status', filtros.status);

        // Adiciona o filtro de visão para a API
        if (session.user.role === 'admin' && filtros.visao === 'todos') {
            params.append('visao', 'todos');
        }

        try {
            const [pagamentosRes, configRes] = await Promise.all([
                fetch(`/api/pagamentos?${params.toString()}`),
                fetch('/api/configuracoes')
            ]);

            if (!pagamentosRes.ok || !configRes.ok) throw new Error("Falha ao buscar dados.");
            
            const pagamentosData = await pagamentosRes.json();
            const configData = await configRes.json();
            
            // Lógica de ordenação robusta para datas no formato AAAA-MM-DD
            const sortedData = pagamentosData.sort((a, b) => {
                const dataA = a.data_prevista ? new Date(a.data_prevista) : new Date(0);
                const dataB = b.data_prevista ? new Date(b.data_prevista) : new Date(0);
                return dataB - dataA;
            });
            
            setPagamentos(sortedData);
            setConfig(configData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filtros, session]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEditClick = (pagamento) => {
        setFormEdicao({ ...pagamento });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormEdicao(null);
    };

    const handleFormChange = (campo, valor) => {
        setFormEdicao(prev => ({ ...prev, [campo]: valor }));
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
            fetchData(); // Re-busca os dados para garantir consistência
            setFormEdicao(null);
        } catch (err) {
            alert(`Erro: ${err.message}`);
        }
    };
    
    const atualizarFiltro = (campo, valor) => {
        setFiltros(prevFiltros => ({...prevFiltros, [campo]: valor}));
    };

    if (sessionStatus === "loading") return <div className="p-6 text-center">Carregando...</div>;
    if (sessionStatus === "unauthenticated") return <div className="p-6 text-center">Por favor, faça o login para continuar.</div>;
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Pagamentos</h1>
            </div>
            
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
                            {(config.status || []).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {session.user.role === 'admin' && (
                        <div>
                            <label className="text-sm font-medium">Visão</label>
                            <select
                                className="w-full p-2 border rounded bg-white"
                                value={filtros.visao}
                                onChange={(e) => atualizarFiltro('visao', e.target.value)}
                            >
                                <option value="propria">Meus Dados</option>
                                <option value="todos">Todos os Dados</option>
                            </select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {formEdicao && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold mb-2">Editando Pagamento ID: {formEdicao.id_pagamento} ({formEdicao.empresa})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <select className="w-full p-2 border rounded bg-white" value={formEdicao.status || ''} onChange={(e) => handleFormChange('status', e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {(config.status || []).map(s => <option key={s} value={s}>{s}</option>)}
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
                                        <th className="p-2">Data Prevista</th>
                                        <th className="p-2">Empresa</th>
                                        <th className="p-2">Tipo</th>
                                        <th className="p-2">Parcela</th>
                                        <th className="p-2">Valor Comissão</th>
                                        <th className="p-2">Data Recebida</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagamentos.map(p => (
                                        <tr key={p.id_pagamento} className="border-b hover:bg-gray-50">
                                            <td className="p-2">{p.data_prevista}</td>
                                            <td className="p-2">{p.empresa}</td>
                                            <td className="p-2">{p.tipo}</td>
                                            <td className="p-2">{p.num_parcela}</td>
                                            <td className="p-2">{p.valor_liquido_comissao}</td>
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
