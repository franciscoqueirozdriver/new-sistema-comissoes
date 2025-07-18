import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";

// --- FUNÇÕES DE UTILIDADE CORRIGIDAS E ROBUSTAS ---
const parseCurrency = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    // Remove "R$", espaços, pontos de milhar e substitui vírgula por ponto decimal
    const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

const formatCurrency = (valor) => {
    return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function PagamentosAtrasoPage() {
    const { data: session } = useSession();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totais, setTotais] = useState({ totalBruto: 0, totalComissao: 0 });
    const [visao, setVisao] = useState('propria');

    const handleGenerateReport = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        setReportData(null);

        try {
            // --- CORREÇÃO APLICADA AQUI ---
            // Agora, sempre enviamos o parâmetro de visão para a API
            const params = new URLSearchParams();
            if (session.user.role === 'admin' && visao === 'todos') {
                params.append('visao', 'todos');
            }
            
            const response = await fetch(`/api/relatorios/pagamentos-em-atraso?${params.toString()}`);
            if (!response.ok) throw new Error("Falha ao buscar dados para o relatório.");
            
            const data = await response.json();

            // Lógica de Totalização usando a função corrigida
            const totaisCalculados = data.reduce((acc, p) => {
                // Usa a função parseCurrency para converter os valores formatados que vêm da API
                acc.totalBruto += parseCurrency(p.valor_bruto);
                acc.totalComissao += parseCurrency(p.valor_liquido_comissao);
                return acc;
            }, { totalBruto: 0, totalComissao: 0 });

            setTotais(totaisCalculados);
            setReportData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session, visao]); // Adiciona 'visao' e 'session' às dependências

    return (
        <div className="space-y-6" id="pagina-relatorio">
            <div className="print-hide">
                <h1 className="text-3xl font-bold text-gray-900">Relatório de Pagamentos em Atraso</h1>
                <p className="text-gray-600 mt-2">Liste todos os pagamentos previstos de oportunidades ganhas cuja data já passou.</p>
            </div>
            
            <Card className="print-hide">
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
                    {session?.user?.role === 'admin' && (
                        <div>
                            <label className="text-sm font-medium">Visão</label>
                            <select
                                value={visao}
                                onChange={(e) => setVisao(e.target.value)}
                                className="w-full p-2 border rounded bg-white"
                            >
                                <option value="propria">Meus Pagamentos</option>
                                <option value="todos">Todos os Pagamentos</option>
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
                    <CardContent className="p-6">
                        <div className="text-center mb-6">
                           <h2 className="text-2xl font-bold">Relatório de Pagamentos em Atraso</h2>
                           <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        
                        {reportData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                   <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 border">Empresa</th>
                                            <th className="p-2 border">Tipo</th>
                                            <th className="p-2 border text-center">Data Prevista</th>
                                            <th className="p-2 border text-center">Dias em Atraso</th>
                                            <th className="p-2 border">Valor Bruto da Parcela</th>
                                            <th className="p-2 border">Valor da Comissão</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map(p => (
                                            <tr key={p.id_pagamento} className="border-b">
                                                <td className="p-2 border">{p.empresa}</td>
                                                <td className="p-2 border">{p.tipo}</td>
                                                <td className="p-2 border text-center">{p.data_prevista}</td>
                                                <td className="p-2 border text-center font-semibold text-red-600">{p.dias_em_atraso}</td>
                                                <td className="p-2 border">{p.valor_bruto}</td>
                                                <td className="p-2 border">{p.valor_liquido_comissao}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* --- RODAPÉ DA TABELA CORRIGIDO --- */}
                                    <tfoot className="font-bold bg-gray-50">
                                        <tr>
                                            <td colSpan="4" className="p-2 border text-right">
                                                Total em Débito / Total a Receber
                                            </td>
                                            <td className="p-2 border">{formatCurrency(totais.totalBruto)}</td>
                                            <td className="p-2 border">{formatCurrency(totais.totalComissao)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">Nenhum pagamento em atraso encontrado.</p>
                        )}


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
