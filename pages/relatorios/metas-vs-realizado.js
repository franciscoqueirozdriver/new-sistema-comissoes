import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Função para formatar um número para moeda brasileira
const formatarMoeda = (valor) => {
    return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Função para calcular e formatar o percentual de atingimento
const formatarAtingimento = (realizado, meta) => {
    if (meta === 0) return "N/A"; // Evita divisão por zero
    const percentual = (realizado / meta) * 100;
    return `${percentual.toFixed(1)}%`;
};

export default function MetasVsRealizadoPage() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setReportData(null);

        try {
            const response = await fetch(`/api/relatorios/metas-vs-realizado?ano=${filtroAno}`);
            if (!response.ok) throw new Error("Falha ao buscar dados para o relatório.");
            
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Gera uma lista de anos para o seletor (ex: de 2023 a 2030)
    const anosDisponiveis = Array.from({ length: 8 }, (_, i) => 2023 + i);

    return (
        <div className="space-y-6" id="pagina-relatorio">
            <div className="print-hide">
                <h1 className="text-3xl font-bold text-gray-900">Relatório de Metas vs. Realizado</h1>
                <p className="text-gray-600 mt-2">Acompanhe o desempenho de suas metas de implantação e mensalidade.</p>
            </div>
            
            <Card className="print-hide">
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="text-sm font-medium">Selecione o Ano</label>
                        <select 
                            className="w-full p-2 border rounded bg-white"
                            value={filtroAno}
                            onChange={(e) => setFiltroAno(e.target.value)}
                        >
                            {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                        </select>
                    </div>
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

            {/* --- ÁREA DO RELATÓRIO PARA IMPRESSÃO --- */}
            {reportData && (
                <Card id="report-area">
                    <CardContent className="p-6">
                        <div className="text-center mb-6">
                           <h2 className="text-2xl font-bold">Relatório de Metas vs. Realizado - {filtroAno}</h2>
                           <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                               <thead className="bg-gray-100">
                                    <tr>
                                        <th rowSpan="2" className="p-2 border align-bottom">Mês</th>
                                        <th colSpan="3" className="p-2 border text-center">Implantação</th>
                                        <th colSpan="3" className="p-2 border text-center">Mensalidade</th>
                                    </tr>
                                    <tr>
                                        <th className="p-2 border bg-gray-50">Meta</th>
                                        <th className="p-2 border bg-gray-50">Realizado</th>
                                        <th className="p-2 border bg-gray-50 text-center">Atingimento</th>
                                        <th className="p-2 border bg-gray-50">Meta</th>
                                        <th className="p-2 border bg-gray-50">Realizado</th>
                                        <th className="p-2 border bg-gray-50 text-center">Atingimento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(item => (
                                        <tr key={item.mes} className="border-b">
                                            <td className="p-2 border font-medium">{item.mes}</td>
                                            <td className="p-2 border">{formatarMoeda(item.meta_implantacao)}</td>
                                            <td className="p-2 border">{formatarMoeda(item.realizado_implantacao)}</td>
                                            <td className="p-2 border text-center font-semibold">{formatarAtingimento(item.realizado_implantacao, item.meta_implantacao)}</td>
                                            <td className="p-2 border">{formatarMoeda(item.meta_mensalidade)}</td>
                                            <td className="p-2 border">{formatarMoeda(item.realizado_mensalidade)}</td>
                                            <td className="p-2 border text-center font-semibold">{formatarAtingimento(item.realizado_mensalidade, item.meta_mensalidade)}</td>
                                        </tr>
                                    ))}
                                </tbody>
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
