import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";

const getAnoMes = (date) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
};

// --- FUNÇÕES DE UTILIDADE ---
const parseCurrency = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

const formatCurrency = (valor) => {
    return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
// ----------------------------

export default function ExtratoMensalPage() {
    const { data: session } = useSession();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filtroMes, setFiltroMes] = useState(getAnoMes(new Date()));
    const [visao, setVisao] = useState('propria');
    
    // Novo estado para guardar os totais
    const [totais, setTotais] = useState(null);

    const handleGenerateReport = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        setReportData(null);
        setTotais(null); // Limpa os totais antigos

        const [ano, mes] = filtroMes.split('-');
        const params = new URLSearchParams({ ano, mes });

        if (session.user.role === 'admin' && visao === 'todos') {
            params.append('visao', 'todos');
        }

        try {
            const response = await fetch(`/api/pagamentos?${params.toString()}`);
            if (!response.ok) throw new Error("Falha ao buscar dados para o relatório.");
            
            const data = await response.json();
            const sortedData = data.sort((a, b) => {
                const dataA = a.data_prevista ? new Date(a.data_prevista.split('/').reverse().join('-')) : new Date(0);
                const dataB = b.data_prevista ? new Date(b.data_prevista.split('/').reverse().join('-')) : new Date(0);
                return new Date(dataA) - new Date(dataB);
            });

            // --- LÓGICA DE TOTALIZAÇÃO ADICIONADA AQUI ---
            const totaisCalculados = sortedData.reduce((acc, p) => {
                acc.totalBruto += parseCurrency(p.valor_bruto);
                acc.totalLiquidoVenda += parseCurrency(p.liquido_venda);
                acc.totalComissao += parseCurrency(p.valor_liquido_comissao);
                return acc;
            }, { totalBruto: 0, totalLiquidoVenda: 0, totalComissao: 0 });
            
            setTotais(totaisCalculados);
            setReportData(sortedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filtroMes, session, visao]);

    return (
        <div className="space-y-6" id="pagina-relatorio">
            <div className="print-hide">
                <h1 className="text-3xl font-bold text-gray-900">Extrato Mensal de Comissões</h1>
                <p className="text-gray-600 mt-2">Selecione o mês e o ano para gerar o extrato detalhado de pagamentos.</p>
            </div>
            
            <Card className="print-hide">
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="text-sm font-medium">Selecione o Mês/Ano</label>
                        <input 
                            type="month" 
                            className="w-full p-2 border rounded" 
                            value={filtroMes} 
                            onChange={(e) => setFiltroMes(e.target.value)}
                        />
                    </div>
                    
                    {session?.user?.role === 'admin' && (
                        <div>
                            <label className="text-sm font-medium">Visão</label>
                            <select
                                value={visao}
                                onChange={(e) => setVisao(e.target.value)}
                                className="w-full p-2 border rounded bg-white"
                            >
                                <option value="propria">Meus Dados</option>
                                <option value="todos">Todos os Dados</option>
                            </select>
                        </div>
                    )}

                    <button 
                        onClick={handleGenerateReport} 
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={loading}
                    >
                        {loading ? 'Gerando...' : 'Gerar Relatório'}
                    </button>
                </CardContent>
            </Card>

            {error && <p className="text-center text-red-500 print-hide">Erro: {error}</p>}

            {reportData && (
                <Card id="report-area">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Extrato de Comissões</h2>
                            <div className="text-right">
                                <p className="font-semibold">Período: {filtroMes.split('-')[1]}/{filtroMes.split('-')[0]}</p>
                                <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 border">Data Prevista</th>
                                        <th className="p-2 border">Empresa</th>
                                        <th className="p-2 border">Tipo</th>
                                        <th className="p-2 border text-center">Parcela</th>
                                        <th className="p-2 border">Valor Bruto</th>
                                        <th className="p-2 border text-center">% Imposto</th>
                                        <th className="p-2 border">Líquido Venda</th>
                                        <th className="p-2 border text-center">% Comissão</th>
                                        <th className="p-2 border">Comissão Líquida</th>
                                        <th className="p-2 border">Status</th>
                                        <th className="p-2 border">Data Recebida</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(p => (
                                        <tr key={p.id_pagamento} className="border-b">
                                            <td className="p-2 border">{p.data_prevista}</td>
                                            <td className="p-2 border">{p.empresa}</td>
                                            <td className="p-2 border">{p.tipo}</td>
                                            <td className="p-2 border text-center">{p.parcela_formatada}</td>
                                            <td className="p-2 border">{p.valor_bruto}</td>
                                            <td className="p-2 border text-center">{p.percentual_imposto}</td>
                                            <td className="p-2 border">{p.liquido_venda}</td>
                                            <td className="p-2 border text-center">{p.percentual_comissao}</td>
                                            <td className="p-2 border">{p.valor_liquido_comissao}</td>
                                            <td className="p-2 border">{p.status}</td>
                                            <td className="p-2 border">{p.data_recebida}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* --- RODAPÉ DA TABELA COM OS TOTAIS --- */}
                                {totais && (
                                    <tfoot className="font-bold bg-gray-50">
                                        <tr>
                                            <td colSpan="4" className="p-2 border text-right">TOTAIS</td>
                                            <td className="p-2 border">{formatCurrency(totais.totalBruto)}</td>
                                            <td className="p-2 border"></td> {/* Coluna % Imposto */}
                                            <td className="p-2 border">{formatCurrency(totais.totalLiquidoVenda)}</td>
                                            <td className="p-2 border"></td> {/* Coluna % Comissão */}
                                            <td className="p-2 border">{formatCurrency(totais.totalComissao)}</td>
                                            <td colSpan="2" className="p-2 border"></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
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
