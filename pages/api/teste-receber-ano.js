export default function handler(req, res) {
  // Dados fictícios para teste
  const pagamentos = [
    { status: "Pendente", data_prevista: "2025-01-15", valor_liquido_comissao: 2000 },
    { status: "Pendente", data_prevista: "2025-03-10", valor_liquido_comissao: 1500 },
    { status: "Recebido", data_prevista: "2025-04-20", valor_liquido_comissao: 3000 },
    { status: "Pendente", data_prevista: "2025-06-05", valor_liquido_comissao: 1800 },
    { status: "Recebido", data_prevista: "2024-12-25", valor_liquido_comissao: 2500 },
  ]

  const hoje = new Date()
  const ano = hoje.getFullYear()

  const total = pagamentos
    .filter(p => {
      const data = new Date(p.data_prevista)
      return (
        p.status !== "Recebido" &&
        data.getFullYear() === ano
      )
    })
    .reduce((total, p) => total + Number(p.valor_liquido_comissao || 0), 0)

  res.status(200).json({ total })
}
