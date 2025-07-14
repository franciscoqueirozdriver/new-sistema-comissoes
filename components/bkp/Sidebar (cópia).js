// components/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const router = useRouter();
  const path = router.pathname;

  const menu = [
    { label: "Dashboard", path: "/" },
    { label: "Oportunidades", path: "/oportunidades" },
    { label: "Pagamentos", path: "/pagamentos" },
    { label: "Despesas", path: "/despesas" },
    { label: "Outras Receitas", path: "/outras-receitas" },
    { label: "Configurações", path: "/configuracoes" },
  ];

  return (
    <aside className="w-48 bg-violet-950 text-white p-4 space-y-6">
      <h2 className="text-xl font-bold">Sistema de Comissões</h2>
      <nav className="flex flex-col gap-4">
        {menu.map(item => (
          <Link key={item.path} href={item.path} legacyBehavior>
            <a className={`text-left ${path === item.path ? "text-violet-300 font-bold" : "hover:text-violet-400"}`}>{item.label}</a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
