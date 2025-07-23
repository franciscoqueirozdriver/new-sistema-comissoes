import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";

// Adicionamos o novo link à lista
const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/pagamentos", label: "Pagamentos" },
  { href: "/metas", label: "Metas" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/configuracoes", label: "Configurações" },
  // Link que só será exibido para administradores
  { href: "/gerenciar-usuarios", label: "Gerenciar Usuários", admin: true },
  { href: "/calcular-dsr", label: "Calcular DSR", admin: true }, 
];



export default function Sidebar() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Filtra os links visíveis com base na role do usuário
  const linksVisiveis = navLinks.filter(link => 
    !link.admin || (link.admin && session?.user?.role === 'admin')
  );

  return (
    <aside className="w-60 bg-violet-950 text-white p-4 space-y-6 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6">Sistema de Comissões</h2>

        {/* O menu de navegação só aparece se o usuário estiver logado e aprovado */}
        {status === "authenticated" && session.user.status === 'aprovado' && (
          <nav className="flex flex-col gap-2">
            {/* Mapeia apenas os links visíveis */}
            {linksVisiveis.map((link) => (
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

      {/* Seção de Login/Logout */}
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
            onClick={() => signIn('google', null, { prompt: 'select_account' })}
            className="w-full text-left text-sm p-2 rounded-md hover:bg-violet-700 transition-colors"
          >
            Login com Google
          </button>
        )}
      </div>
    </aside>
  );
}
