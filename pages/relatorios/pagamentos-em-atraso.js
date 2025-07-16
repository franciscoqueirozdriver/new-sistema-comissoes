import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Função para formatar um número para moeda brasileira
const formatarMoeda = (valor) => {
    const numero = parseFloat(String(valor || "0").replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.'));
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function PagamentosAtrasoPage() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setReportData(null);

        try {
            const response = await fetch(`/api/relatorios/pagamentos-em-atraso`);
            if (!response.ok) throw new Error("Falha ao buscar dados para o relatório.");
            
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6" id="pagina-relatorio">
            <div className="print-hide">
                <h1 className="text-3xl font-bold text-gray-900">Relatório de Pagamentos em Atraso</h1>
                <p className="text-gray-600 mt-2">Liste todos os pagamentos previstos cuja data já passou e que ainda não foram recebidos.</p>
            </div>
            
            <Card className="print-hide">
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
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
                                            {/* --- COLUNAS CORRIGIDAS --- */}
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
                                                {/* --- VALORES EXIBIDOS AQUI --- */}
                                                <td className="p-2 border">{formatarMoeda(p.valor_bruto)}</td>
                                                <td className="p-2 border">{formatarMoeda(p.valor_liquido_comissao)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
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
