import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/** @typedef {"admin"|"usuario"|"usuarioplus"} Papel */
/** @typedef {{ tipo:Papel, rota:string, visualizar:boolean, editar:boolean, excluir:boolean, exportar:boolean }} LinhaPermissao */

const defaultLinha = {
  tipo: "usuario",
  rota: "/nova-rota",
  visualizar: true,
  editar: false,
  excluir: false,
  exportar: true,
};
const tipos = ["admin", "usuario", "usuarioplus"];

const keyOf = (item) => `${item.tipo}|${item.rota}`;

export default function PermissoesPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? "usuario";
  const isAdmin = role === "admin";

  const [itens, setItens] = useState([]);
  const [alterados, setAlterados] = useState({});
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroRota, setFiltroRota] = useState("");
  const [somenteAlterados, setSomenteAlterados] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/permissoes")
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data) => setItens(data.items || []));
    }
  }, [isAdmin]);

  if (status === "loading") {
    return <p className="p-4">Carregando...</p>;
  }

  if (!isAdmin) {
    return <p className="p-4">Acesso negado. Somente administradores.</p>;
  }

  const marcarAlterado = (item) => {
    setAlterados((prev) => ({ ...prev, [keyOf(item)]: item }));
  };

  const atualizarItem = (index, campo, valor) => {
    const novos = [...itens];
    novos[index][campo] = valor;
    setItens(novos);
    marcarAlterado(novos[index]);
  };

  const adicionarLinha = () => {
    const nova = { ...defaultLinha };
    setItens((prev) => [...prev, nova]);
    marcarAlterado(nova);
  };

  const removerLinha = async (item) => {
    await fetch(
      `/api/permissoes?tipo=${encodeURIComponent(item.tipo)}&rota=${encodeURIComponent(
        item.rota
      )}`,
      { method: "DELETE" }
    );
    setItens((prev) => prev.filter((i) => keyOf(i) !== keyOf(item)));
    setAlterados((prev) => {
      const novo = { ...prev };
      delete novo[keyOf(item)];
      return novo;
    });
  };

  const salvarAlteracoes = async () => {
    const itensSalvar = Object.values(alterados);
    if (itensSalvar.length === 0) return;
    await fetch("/api/permissoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: itensSalvar }),
    });
    setAlterados({});
    const res = await fetch("/api/permissoes");
    const data = await res.json();
    setItens(data.items || []);
  };

  const filtrados = itens.filter((item) => {
    if (filtroTipo !== "todos" && item.tipo !== filtroTipo) return false;
    if (filtroRota && !item.rota.includes(filtroRota)) return false;
    if (somenteAlterados && !alterados[keyOf(item)]) return false;
    return true;
  });

  const camposBooleanos = [
    "visualizar",
    "editar",
    "excluir",
    "exportar",
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Permissões</h1>
      <div className="flex flex-wrap gap-4 items-center">
        <select
          className="border p-1"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="todos">todos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="border p-1"
          placeholder="Buscar rota"
          value={filtroRota}
          onChange={(e) => setFiltroRota(e.target.value)}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={somenteAlterados}
            onChange={(e) => setSomenteAlterados(e.target.checked)}
          />
          Somente alterados
        </label>
      </div>
      <table className="min-w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">tipo</th>
            <th className="p-2 border">rota</th>
            {camposBooleanos.map((c) => (
              <th key={c} className="p-2 border">
                {c}
              </th>
            ))}
            <th className="p-2 border">ações</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((item, idx) => (
            <tr key={idx} className="text-center">
              <td className="border p-1">
                <select
                  className="border p-1"
                  value={item.tipo}
                  onChange={(e) => atualizarItem(idx, "tipo", e.target.value)}
                >
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>
              <td className="border p-1">
                <input
                  className="border p-1 w-full"
                  value={item.rota}
                  onChange={(e) => atualizarItem(idx, "rota", e.target.value)}
                />
              </td>
              {camposBooleanos.map((c) => (
                <td key={c} className="border p-1">
                  <input
                    type="checkbox"
                    checked={item[c]}
                    onChange={() => atualizarItem(idx, c, !item[c])}
                  />
                </td>
              ))}
              <td className="border p-1">
                <button
                  className="text-red-600"
                  onClick={() => removerLinha(item)}
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={adicionarLinha}
        >
          Adicionar linha
        </button>
        <button
          className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
          disabled={Object.keys(alterados).length === 0}
          onClick={salvarAlteracoes}
        >
          Salvar alterações ({Object.keys(alterados).length})
        </button>
      </div>
    </div>
  );
}
