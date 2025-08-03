"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react"; // Importa o hook de sessão

// Funções de utilidade
const parseCurrency = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

const formatCurrency = (valor) => {
    return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function DetalhamentoOportunidadePage() {
    const { data: session } = useSession(); // Pega a sessão atual do usuário
    const [oportunidades, setOportunidades] = useState([]);
    const [selectedOppId, setSelectedOppId] = useState('');
    
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    // --- NOVO ESTADO PARA O FILTRO DE VISÃO ---
    const [visao, setVisao] = useState('propria');

    // Busca a lista de oportunidades para preencher o menu de seleção
    const fetchOportunidades = useCallback(async () => {
        if (!session) return; // Não busca se a sessão não estiver pronta

        setLoading(true);
        setError(null);
        try {
            // Adiciona o parâmetro de visão à chamada da API
            const params = new URLSearchParams();
            if (session.user.role === 'admin' && visao === 'todos') {
                params.append('visao', 'todos');
            }

            const response = await fetch(`/api/oportunidades?${params.toString()}`);
            if (!response.ok) throw new Error("Falha ao buscar lista de oportunidades.");
            const data = await response.json();
            setOportunidades(data);
        } catch (err) {
            console.error(err);
            setError("Não foi possível carregar a lista de oportunidades.");
        } finally {
            setLoading(false);
        }
    }, [session, visao]); // Adiciona 'visao' e 'session' às dependências

    useEffect(() => {
        fetchOportunidades();
    }, [fetchOportunidades]);


    const handleGenerateReport = async () => {
        if (!selectedOppId) {
            alert("Por favor, selecione uma oportunidade.");
            return;
        }
        setGenerating(true);
        setError(null);
        setReportData(null);

        try {
            // --- CORREÇÃO APLICADA AQUI ---
            // Adiciona o parâmetro de visão na chamada para a API de pagamentos
            const params = new URLSearchParams({ id_oportunidade: selectedOppId });
            if (session.user.role === 'admin' && visao === 'todos') {
                params.append('visao', 'todos');
            }
            
            const [oportunidadeRes, pagamentosRes] = await Promise.all([
                fetch(`/api/oportunidades/${selectedOppId}`),
                fetch(`/api/pagamentos?${params.toString()}`)
            ]);
            // ------------------------------------
            
            if (!oportunidadeRes.ok || !pagamentosRes.ok) throw new Error("Falha ao buscar dados do relatório.");
            
            const oportunidadeData = await oportunidadeRes.json();
            const pagamentosData = await pagamentosRes.json();
            
            const totais = pagamentosData.reduce((acc, p) => {
                const valorBruto = parseCurrency(p.valor_bruto);
                const liquidoVenda = parseCurrency(p.liquido_venda);
                const comissaoLiquida = parseCurrency(p.valor_liquido_comissao);
                
                acc.totalBruto += valorBruto;
                acc.totalLiquidoVenda += liquidoVenda;
                acc.totalComissao += comissaoLiquida;
                
                return acc;
            }, { totalBruto: 0, totalLiquidoVenda: 0, totalComissao: 0 });
            
            setReportData({
                oportunidade: oportunidadeData,
                pagamentos: pagamentosData,
                totais: totais
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6" id="pagina-relatorio">
            <div className="print-hide">
                <h1 className="text-3xl font-bold text-gray-900">Detalhamento de Oportunidade</h1>
                <p className="text-gray-600 mt-2">Selecione uma oportunidade para ver seu extrato financeiro completo.</p>
            </div>
            
            <Card className="print-hide">
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
                    {/* --- SELETOR DE VISÃO PARA ADMINS --- */}
                    {session?.user?.role === 'admin' && (
                        <div>
                            <label className="text-sm font-medium">Visão</label>
                            <select
                                value={visao}
                                onChange={(e) => {
                                    setVisao(e.target.value);
                                    setSelectedOppId(''); // Limpa a seleção ao mudar a visão
                                    setReportData(null); // Limpa o relatório gerado
                                }}
                                className="w-full p-2 border rounded bg-white"
                            >
                                <option value="propria">Minhas Oportunidades</option>
                                <option value="todos">Todas as Oportunidades</option>
                            </select>
                        </div>
                    )}
                    <div className="flex-grow">
                        <label className="text-sm font-medium">Selecione a Oportunidade</label>
                        <select 
                            className="w-full p-2 border rounded bg-white"
                            value={selectedOppId}
                            onChange={(e) => setSelectedOppId(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">{loading ? "Carregando lista..." : "Selecione..."}</option>
                            {oportunidades.map(op => (
                                <option key={op.id} value={op.id}>
                                    {op.id} - {op.empresa}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={handleGenerateReport} 
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={generating || !selectedOppId}
                    >
                        {generating ? 'Gerando...' : 'Gerar Relatório'}
                    </button>
                </CardContent>
            </Card>

            {error && <p className="text-center text-red-500 print-hide">Erro: {error}</p>}

            {reportData && (
                <Card id="report-area">
                    <CardContent className="p-6">
                        <div className="mb-6 border-b pb-4">
                           <h2 className="text-2xl font-bold">{reportData.oportunidade.empresa}</h2>
                           <p className="text-sm text-gray-500">ID da Oportunidade: {reportData.oportunidade.id}</p>
                           <p className="text-sm">Fase: <strong>{reportData.oportunidade.fase_do_funil}</strong></p>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2">Extrato de Pagamentos</h3>
                        <table className="w-full text-xs text-left">
                           <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 border">Data Prevista</th>
                                    <th className="p-2 border">Tipo</th>
                                    <th className="p-2 border text-center">Parcela</th>
                                    <th className="p-2 border">Valor Bruto</th>
                                    <th className="p-2 border">Líquido Venda</th>
                                    <th className="p-2 border">Comissão Líquida</th>
                                    <th className="p-2 border">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.pagamentos.map(p => (
                                    <tr key={p.id_pagamento} className="border-b">
                                        <td className="p-2 border">{p.data_prevista}</td>
                                        <td className="p-2 border">{p.tipo}</td>
                                        <td className="p-2 border text-center">{p.parcela_formatada}</td>
                                        <td className="p-2 border">{p.valor_bruto}</td>
                                        <td className="p-2 border">{p.liquido_venda}</td>
                                        <td className="p-2 border">{p.valor_liquido_comissao}</td>
                                        <td className="p-2 border">{p.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {reportData.totais && (
                                <tfoot className="font-bold bg-gray-50">
                                    <tr>
                                        <td colSpan="3" className="p-2 border text-right">TOTAIS</td>
                                        <td className="p-2 border">{formatCurrency(reportData.totais.totalBruto)}</td>
                                        <td className="p-2 border">{formatCurrency(reportData.totais.totalLiquidoVenda)}</td>
                                        <td className="p-2 border">{formatCurrency(reportData.totais.totalComissao)}</td>
                                        <td className="p-2 border"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>

                         <div className="flex justify-end mt-6 print-hide">
                            <button onClick={() => window.print()} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                                Imprimir / Salvar PDF
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
