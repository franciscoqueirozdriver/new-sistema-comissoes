export default function handler(req, res) {
  const pagamentos = [
    { status: "Recebido", data_prevista: "2025-01-15", valor_liquido_comissao: 2000 },
    { status: "Pendente", data_prevista: "2025-03-10", valor_liquido_comissao: 1500 },
    { status: "Recebido", data_prevista: "2025-04-20", valor_liquido_comissao: 3000 },
    { status: "Pendente", data_prevista: "2025-06-05", valor_liquido_comissao: 1800 },
    { status: "Recebido", data_prevista: "2025-06-18", valor_liquido_comissao: 2500 },
  ]

  const total = pagamentos
    .filter(p => p.status === "Recebido")
    .reduce((total, p) => total + Number(p.valor_liquido_comissao || 0), 0)

  res.status(200).json({ total })
}
