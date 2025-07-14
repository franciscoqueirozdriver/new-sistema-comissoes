// /components/Layout.js (Versão Refatorada)

import Sidebar from './Sidebar'; // Importa o componente Sidebar que você já criou

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 1. Usamos o componente Sidebar aqui, tornando o Layout mais limpo */}
      <Sidebar />

      {/* 2. A área de conteúdo principal permanece a mesma */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
