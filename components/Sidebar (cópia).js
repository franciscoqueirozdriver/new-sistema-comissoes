// /components/Sidebar.js (Versão com autenticação forçada)

import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/pagamentos", label: "Pagamentos" },
  { href: "/metas", label: "Metas" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "#", label: "Despesas", emDesenvolvimento: true },
  { href: "/outras-receitas", label: "Outras Receitas", emDesenvolvimento: true },
  { href: "/configuracoes", label: "Configurações" },
];

export default function Sidebar() {
  const router = useRouter();
  const { data: session, status } = useSession();

  return (
    <aside className="w-60 bg-violet-950 text-white p-4 space-y-6 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6">Sistema de Comissões</h2>

        {status === "authenticated" && session.user.status === 'aprovado' && (
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href || '#'} legacyBehavior>
                <a
                  title={link.emDesenvolvimento ? "Em desenvolvimento" : ""}
                  className={`p-2 rounded-md text-left transition-colors ${
                    router.pathname === link.href && !link.emDesenvolvimento
                      ? "bg-violet-700 font-bold text-white"
                      : "hover:bg-violet-800 hover:text-violet-300"
                  } ${
                    link.emDesenvolvimento
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="border-t border-violet-800 pt-4">
        {status === "loading" && <p className="text-xs">Carregando...</p>}

        {status === "authenticated" && session.user && (
          <div>
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-violet-300 mb-2">{session.user.email}</p>
            <button
              onClick={() => signOut()}
              className="w-full text-left text-sm p-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Sair
            </button>
          </div>
        )}

        {status === "unauthenticated" && (
          <button
            // --- ALTERAÇÃO PRINCIPAL AQUI ---
            // Adicionamos o objeto de opções para forçar a seleção de conta
            onClick={() => signIn('google', null, { prompt: 'select_account' })}
            // ------------------------------------
            className="w-full text-left text-sm p-2 rounded-md hover:bg-violet-700 transition-colors"
          >
            Login com Google
          </button>
        )}
      </div>
    </aside>
  );
}
