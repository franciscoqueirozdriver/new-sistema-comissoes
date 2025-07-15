import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function MetasPage() {
    const [metas, setMetas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Busca os dados iniciais da API
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/metas');
            if (!response.ok) throw new Error("Falha ao buscar as metas.");
            const data = await response.json();
            setMetas(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Funções para manipular a tabela ---

    const handleInputChange = (index, fieldName, value) => {
        const novasMetas = [...metas];
        novasMetas[index][fieldName] = value;
        setMetas(novasMetas);
    };

    const handleAddNewRow = () => {
        setMetas([
            ...metas,
            { mes: "", meta_implantacao: "", meta_mensalidade: "" }
        ]);
    };

    const handleDeleteRow = (indexToDelete) => {
        if (!confirm("Tem certeza que deseja remover esta meta?")) return;
        setMetas(metas.filter((_, index) => index !== indexToDelete));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/metas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metas),
            });
            if (!response.ok) throw new Error("Falha ao salvar as alterações.");
            alert("Metas salvas com sucesso!");
        } catch (err) {
            alert(`Erro: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Carregando metas...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Erro: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Metas</h1>
                <button 
                    onClick={handleSaveChanges} 
                    className="bg-violet-600 text-white px-6 py-2 rounded hover:bg-violet-700 disabled:bg-gray-400"
                    disabled={isSaving}
                >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">Mês (MM/AAAA)</th>
                                    <th className="p-2 text-left">Meta Implantação</th>
                                    <th className="p-2 text-left">Meta Mensalidade</th>
                                    <th className="p-2 text-center w-12">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metas.map((meta, index) => (
                                    <tr key={index} className="border-b">
                                        <td>
                                            <input 
                                                type="text" 
                                                value={meta.mes || ''}
                                                onChange={(e) => handleInputChange(index, 'mes', e.target.value)}
                                                className="w-full p-2 border-transparent focus:border-blue-500 focus:ring-0 bg-transparent"
                                                placeholder="MM/AAAA"
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                value={meta.meta_implantacao || ''}
                                                onChange={(e) => handleInputChange(index, 'meta_implantacao', e.target.value)}
                                                className="w-full p-2 border-transparent focus:border-blue-500 focus:ring-0 bg-transparent"
                                                placeholder="Ex: 75.000,00"
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                value={meta.meta_mensalidade || ''}
                                                onChange={(e) => handleInputChange(index, 'meta_mensalidade', e.target.value)}
                                                className="w-full p-2 border-transparent focus:border-blue-500 focus:ring-0 bg-transparent"
                                                placeholder="Ex: 20.000,00"
                                            />
                                        </td>
                                        <td className="text-center">
                                            <button 
                                                onClick={() => handleDeleteRow(index)}
                                                className="text-red-500 hover:text-red-700 p-2"
                                                title="Remover meta"
                                            >
                                                &#x1F5D1;
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <button 
                            onClick={handleAddNewRow}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            + Adicionar Nova Meta
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}