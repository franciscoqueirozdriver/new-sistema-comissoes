import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Função para capitalizar os nomes das categorias para exibição (ex: "fase_do_funil" -> "Fase do Funil")
const formatarTitulo = (texto) => {
    return texto.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export default function ConfiguracoesPage() {
    const [configuracoes, setConfiguracoes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // Estado para guardar o texto dos novos itens que estão sendo digitados
    const [newItemTexts, setNewItemTexts] = useState({});

    // Busca os dados iniciais da API
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/configuracoes');
            if (!response.ok) throw new Error("Falha ao buscar configurações.");
            const data = await response.json();
            setConfiguracoes(data);
            // Inicializa o estado para os campos de "adicionar novo"
            const initialNewItems = Object.keys(data).reduce((acc, key) => ({...acc, [key]: ''}), {});
            setNewItemTexts(initialNewItems);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

// /pages/configuracoes.js -> Substitua a função handleAddItem por esta

const handleAddItem = (category) => {
    const newItem = newItemTexts[category]?.trim();
    if (!newItem) {
        alert("Por favor, digite um nome para o novo item.");
        return;
    }
    
    // Pega a lista atual da categoria para verificação
    const currentList = configuracoes[category];

    // --- A CORREÇÃO ESTÁ AQUI ---
    // Verifica se o item (ignorando maiúsculas/minúsculas) já existe na lista
    const itemExists = currentList.some(
        (item) => item.toLowerCase() === newItem.toLowerCase()
    );

    if (itemExists) {
        alert(`O item "${newItem}" já existe nesta categoria.`);
        return; // Para a execução e não adiciona o item duplicado
    }
    // --------------------------------

    // Se não for duplicado, adiciona à lista
    setConfiguracoes(prev => ({
        ...prev,
        [category]: [...prev[category], newItem]
    }));

    // Limpa o campo de input
    setNewItemTexts(prev => ({...prev, [category]: ''}));
};
    const handleDeleteItem = (category, indexToDelete) => {
        if (!confirm(`Tem certeza que deseja remover este item?`)) return;

        setConfiguracoes(prev => ({
            ...prev,
            [category]: prev[category].filter((_, index) => index !== indexToDelete)
        }));
    };
    
    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/configuracoes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configuracoes),
            });
            if (!response.ok) throw new Error("Falha ao salvar as alterações.");
            alert("Configurações salvas com sucesso!");
        } catch (err) {
            alert(`Erro: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Carregando configurações...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Erro: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
                <button 
                    onClick={handleSaveChanges} 
                    className="bg-violet-600 text-white px-6 py-2 rounded hover:bg-violet-700 disabled:bg-gray-400"
                    disabled={saving}
                >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {configuracoes && Object.keys(configuracoes).map(category => (
                    <Card key={category}>
                        <CardContent className="p-4">
                            <h2 className="text-lg font-semibold mb-3">{formatarTitulo(category)}</h2>
                            <div className="space-y-2">
                                {configuracoes[category].map((item, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                                        <span>{item}</span>
                                        <button 
                                            onClick={() => handleDeleteItem(category, index)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Remover item"
                                        >
                                            &#x2716;
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="Novo item..."
                                    className="w-full p-2 border rounded"
                                    value={newItemTexts[category] || ''}
                                    onChange={(e) => setNewItemTexts({...newItemTexts, [category]: e.target.value})}
                                />
                                <button 
                                    onClick={() => handleAddItem(category)}
                                    className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}