// /components/Layout.js

import Link from "next/link";
import { useRouter } from "next/router";

// Lista de links do menu para facilitar a manutenção
const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/pagamentos", label: "Pagamentos" },
  { href: "/despesas", label: "Despesas" },
  { href: "/outras-receitas", label: "Outras Receitas" },
  { href: "/configuracoes", label: "Configurações" },
];

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-60 bg-violet-950 text-white p-4 space-y-6 flex flex-col">
        <h2 className="text-xl font-bold">Sistema de Comissões</h2>
        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} legacyBehavior>
              <a
                className={`p-2 rounded-md text-left transition-colors ${
                  router.pathname === link.href
                    ? "bg-violet-700 font-bold text-white"
                    : "hover:bg-violet-800 hover:text-violet-300"
                }`}
              >
                {link.label}
              </a>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
