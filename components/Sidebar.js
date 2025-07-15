// /components/Sidebar.js (Versão Final com status de desenvolvimento)

import Link from "next/link";
import { useRouter } from "next/router";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/pagamentos", label: "Pagamentos" },
  { href: "/metas", label: "Metas" },
  // Adicionando a propriedade 'emDesenvolvimento' aos itens futuros
  { href: "#", label: "Despesas", emDesenvolvimento: true },
  { href: "#", label: "Outras Receitas", emDesenvolvimento: true },
  { href: "/configuracoes", label: "Configurações" },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-60 bg-violet-950 text-white p-4 space-y-6 flex flex-col">
      <h2 className="text-xl font-bold">Sistema de Comissões</h2>
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} legacyBehavior>
            <a
              // Adiciona o título (tooltip) se estiver em desenvolvimento
              title={link.emDesenvolvimento ? "Em desenvolvimento" : ""}
              className={`
                p-2 rounded-md text-left transition-colors
                ${
                  router.pathname === link.href && !link.emDesenvolvimento
                    ? "bg-violet-700 font-bold text-white"
                    : "hover:bg-violet-800 hover:text-violet-300"
                }
                ${
                  // Aplica os estilos de "desabilitado" se estiver em desenvolvimento
                  link.emDesenvolvimento
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
            >
              {link.label}
            </a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}