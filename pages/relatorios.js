import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const relatoriosDisponiveis = [
  {
    titulo: "Extrato Mensal de Comissões",
    descricao: "Gere um extrato detalhado de todos os pagamentos de um mês específico.",
    link: "/relatorios/extrato-mensal"
  },
  {
    titulo: "Detalhamento de Oportunidade",
    descricao: "Visualize todos os pagamentos e detalhes financeiros de uma única oportunidade.",
    link: "/relatorios/detalhamento-oportunidade"
  },
  // --- NOVO RELATÓRIO ADICIONADO AQUI ---
    {
    titulo: "Relatório de DSR",
    descricao: "Cálculo consolidado de DSR por pagamento.",
    link: "/relatorios/dsr"
  },
  {
    titulo: "Pagamentos em Atraso",
    descricao: "Liste todos os pagamentos previstos cuja data já passou e que ainda não foram recebidos.",
    link: "/relatorios/pagamentos-em-atraso", // Link a ser criado
    
    
  },
  // ------------------------------------
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Central de Relatórios</h1>
      <p className="text-gray-600">Selecione um dos relatórios abaixo para configurar e gerar.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatoriosDisponiveis.map((relatorio) => (
          <Link 
            key={relatorio.titulo} 
            href={relatorio.desabilitado ? '#' : relatorio.link}
            className={`
              block
              ${relatorio.desabilitado ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1 transition-transform duration-200'}
            `}
            onClick={(e) => { if (relatorio.desabilitado) e.preventDefault(); }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{relatorio.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{relatorio.descricao}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
