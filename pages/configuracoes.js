"use client";
// pages/configuracoes.js
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";

// Função para formatar títulos (ex: "fase_do_funil" → "Fase do Funil")
const formatarTitulo = (texto) =>
  texto
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

export default function ConfiguracoesPage() {
  const { data: session, status } = useSession();
  const [configuracoes, setConfiguracoes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newItemTexts, setNewItemTexts] = useState({});

  const isAdmin = session?.user?.role === "admin";

  // Buscar dados da planilha
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/configuracoes");
      if (!response.ok) throw new Error("Falha ao buscar configurações.");
      const data = await response.json();
      setConfiguracoes(data);
      const iniciais = Object.keys(data).reduce((acc, key) => ({ ...acc, [key]: "" }), {});
      setNewItemTexts(iniciais);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchData();
    }
  }, [status, isAdmin, fetchData]);

  const handleAddItem = (category) => {
    const novoItem = newItemTexts[category]?.trim();
    if (!novoItem) {
      alert("Por favor, digite um nome para o novo item.");
      return;
    }

    const jaExiste = configuracoes[category]?.some(
      (item) => item.toLowerCase() === novoItem.toLowerCase()
    );

    if (jaExiste) {
      alert(`O item "${novoItem}" já existe nesta categoria.`);
      return;
    }

    setConfiguracoes((prev) => ({
      ...prev,
      [category]: [...prev[category], novoItem],
    }));

    setNewItemTexts((prev) => ({ ...prev, [category]: "" }));
  };

  const handleDeleteItem = (category, index) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;

    setConfiguracoes((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configuracoes),
      });
      if (!response.ok) throw new Error("Erro ao salvar alterações.");
      alert("Configurações salvas com sucesso!");
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Feedbacks visuais por status
  if (status === "loading")
    return <div className="p-6 text-center">Verificando autenticação...</div>;

  if (!isAdmin)
    return (
      <div className="p-6 text-center text-red-500">
        Acesso restrito. Esta seção é exclusiva para administradores.
      </div>
    );

  if (loading)
    return <div className="p-6 text-center">Carregando configurações...</div>;

  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        Erro ao carregar dados: {error}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <button
          onClick={handleSaveChanges}
          className="bg-violet-600 text-white px-6 py-2 rounded hover:bg-violet-700 disabled:bg-gray-400"
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(configuracoes).map(([categoria, itens]) => (
          <Card key={categoria}>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-3">{formatarTitulo(categoria)}</h2>
              <div className="space-y-2">
                {itens.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-100 p-2 rounded"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleDeleteItem(categoria, index)}
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
                  value={newItemTexts[categoria] || ""}
                  onChange={(e) =>
                    setNewItemTexts((prev) => ({
                      ...prev,
                      [categoria]: e.target.value,
                    }))
                  }
                />
                <button
                  onClick={() => handleAddItem(categoria)}
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

