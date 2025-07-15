import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Função para converter o formato "MM/AAAA" em um objeto de Data para ordenação
const parseDataMeta = (dataStr) => {
    if (!dataStr || typeof dataStr !== 'string' || !dataStr.includes('/')) {
        return new Date(0);
    }
    const [mes, ano] = dataStr.split('/');
    return new Date(`${ano}-${mes}-01`);
};

// --- FUNÇÕES DE NÚMERO CORRIGIDAS E ROBUSTAS ---

// Converte QUALQUER formato de moeda (R$ 1.234,56 ou 1234,56) para NÚMERO (1234.56)
const parseNumero = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    // Remove "R$", espaços, pontos de milhar e substitui vírgula por ponto decimal
    const numeroLimpo = String(valor)
      .replace(/R\$\s?/, '')
      .replace(/\./g, '')
      .replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

// Formata um número para o padrão string de MOEDA BR (R$ 1.234,56)
const formatarMoeda = (valor) => {
    const numero = parseNumero(valor);
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// ---------------------------------------------------

export default function MetasPage() {
    const [metas, setMetas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formEdicao, setFormEdicao] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/metas');
            if (!response.ok) throw new Error("Falha ao buscar as metas.");
            const data = await response.json();
            const sortedData = data.sort((a, b) => parseDataMeta(b.mes) - parseDataMeta(a.mes));
            setMetas(sortedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEditClick = (meta, index) => {
        // Ao editar, converte os valores formatados para números puros para o input
        const metaParaEdicao = {
            ...meta,
            originalIndex: index,
            meta_implantacao: parseNumero(meta.meta_implantacao),
            meta_mensalidade: parseNumero(meta.meta_mensalidade)
        };
        setFormEdicao(metaParaEdicao);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleCancelEdit = () => {
        setFormEdicao(null);
    };

    const handleFormChange = (fieldName, value) => {
        setFormEdicao(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSaveChanges = async () => {
        if (isSaving) return;
        setIsSaving(true);
        
        let metasParaSalvar = [...metas];

        if (formEdicao) {
            const metaEditada = {
                mes: formEdicao.mes,
                // Formata os números de volta para o padrão moeda antes de salvar
                meta_implantacao: formatarMoeda(formEdicao.meta_implantacao),
                meta_mensalidade: formatarMoeda(formEdicao.meta_mensalidade),
            };
            metasParaSalvar[formEdicao.originalIndex] = metaEditada;
        }
        
        metasParaSalvar.sort((a, b) => parseDataMeta(b.mes) - parseDataMeta(a.mes));

        try {
            const response = await fetch('/api/metas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metasParaSalvar),
            });
            if (!response.ok) throw new Error("Falha ao salvar as alterações.");
            
            alert("Metas salvas com sucesso!");
            setMetas(metasParaSalvar);
            setFormEdicao(null);
        } catch (err) {
            alert(`Erro: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddNewRow = () => {
        if (formEdicao) handleCancelEdit();
        const novaMeta = { mes: "", meta_implantacao: 0, meta_mensalidade: 0 };
        const novoIndex = metas.length;
        setMetas([...metas, novaMeta]);
        setTimeout(() => {
            handleEditClick(novaMeta, novoIndex);
        }, 0);
    };

    const handleDeleteRow = (indexToDelete) => {
        if (!confirm("Tem certeza que deseja remover esta meta?")) return;
        const metasAtualizadas = metas.filter((_, index) => index !== indexToDelete);
        setMetas(metasAtualizadas);
        // Lembrete: A exclusão só será salva ao clicar em "Salvar Todas as Alterações"
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
                    {isSaving ? 'Salvando...' : 'Salvar Todas as Alterações'}
                </button>
            </div>

            {formEdicao && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                         <h2 className="text-lg font-semibold mb-2">{formEdicao.mes ? `Editando Meta do Mês: ${formEdicao.mes}` : 'Nova Meta'}</h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs">Mês (MM/AAAA)</label>
                                <input type="text" className="w-full p-2 border rounded" placeholder="MM/AAAA" value={formEdicao.mes || ''} onChange={(e) => handleFormChange('mes', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs">Meta Implantação</label>
                                <input type="number" className="w-full p-2 border rounded" placeholder="75000" value={formEdicao.meta_implantacao || ''} onChange={(e) => handleFormChange('meta_implantacao', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs">Meta Mensalidade</label>
                                <input type="number" className="w-full p-2 border rounded" placeholder="20000" value={formEdicao.meta_mensalidade || ''} onChange={(e) => handleFormChange('meta_mensalidade', e.target.value)} />
                            </div>
                         </div>
                         <div className="flex justify-end gap-2 mt-4">
                            <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancelar</button>
                         </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2">Mês</th>
                                    <th className="p-2">Meta Implantação</th>
                                    <th className="p-2">Meta Mensalidade</th>
                                    <th className="p-2 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metas.map((meta, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{meta.mes}</td>
                                        <td className="p-2">{formatarMoeda(meta.meta_implantacao)}</td>
                                        <td className="p-2">{formatarMoeda(meta.meta_mensalidade)}</td>
                                        <td className="p-2 text-center space-x-2">
                                            <button onClick={() => handleEditClick(meta, index)} className="font-medium text-blue-600 hover:underline">Editar</button>
                                            <button onClick={() => handleDeleteRow(index)} className="font-medium text-red-600 hover:underline">Remover</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <button onClick={handleAddNewRow} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            + Adicionar Nova Meta
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
