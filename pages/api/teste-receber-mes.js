export default function handler(req, res) {
  // Dados fictícios para teste
  const pagamentos = [
    { status: "Pendente", data_prevista: "2025-06-05", valor_liquido_comissao: 1000 },
    { status: "Recebido", data_prevista: "2025-06-10", valor_liquido_comissao: 2000 },
    { status: "Pendente", data_prevista: "2025-06-20", valor_liquido_comissao: 1500 },
    { status: "Pendente", data_prevista: "2025-05-10", valor_liquido_comissao: 800 },
  ]

  const hoje = new Date()
  const mes = hoje.getMonth()
  const ano = hoje.getFullYear()

  const total = pagamentos
    .filter(p => {
      const data = new Date(p.data_prevista)
      return (
        p.status !== "Recebido" &&
        data.getMonth() === mes &&
        data.getFullYear() === ano
      )
    })
    .reduce((total, p) => total + Number(p.valor_liquido_comissao || 0), 0)

  res.status(200).json({ total })
}

