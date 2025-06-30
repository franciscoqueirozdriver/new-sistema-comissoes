export default function handler(req, res) {
  const pagamentos = [
    { id_oportunidade: "OP-001", status: "Recebido", data_prevista: "2025-06-01", valor_liquido_comissao: 1000 },
    { id_oportunidade: "OP-002", status: "Recebido", data_prevista: "2025-03-10", valor_liquido_comissao: 1500 },
    { id_oportunidade: "OP-003", status: "Pendente", data_prevista: "2025-06-20", valor_liquido_comissao: 2000 },
    { id_oportunidade: "OP-004", status: "Pendente", data_prevista: "2025-06-22", valor_liquido_comissao: 1800 },
    { id_oportunidade: "OP-005", status: "Recebido", data_prevista: "2025-01-15", valor_liquido_comissao: 2500 },
    { id_oportunidade: "OP-006", status: "Recebido", data_prevista: "2024-12-20", valor_liquido_comissao: 3000 },
    { id_oportunidade: "OP-001", status: "Recebido", data_prevista: "2025-06-10", valor_liquido_comissao: 800 },
  ]

  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  // Total a receber no mês
  const totalMes = pagamentos
    .filter(p => {
      const data = new Date(p.data_prevista)
      return (
        p.status !== "Recebido" &&
        data.getMonth() === mesAtual &&
        data.getFullYear() === anoAtual
      )
    })
    .reduce((sum, p) => sum + Number(p.valor_liquido_comissao || 0), 0)

  // Total a receber no ano
  const totalAno = pagamentos
    .filter(p => {
      const data = new Date(p.data_prevista)
      return p.status !== "Recebido" && data.getFullYear() === anoAtual
    })
    .reduce((sum, p) => sum + Number(p.valor_liquido_comissao || 0), 0)

  // Total recebido
  const totalRecebido = pagamentos
    .filter(p => p.status === "Recebido")
    .reduce((sum, p) => sum + Number(p.valor_liquido_comissao || 0), 0)

  // Contratos vendidos no mês
  const vendidosMes = [
    ...new Set(
      pagamentos
        .filter(p => {
          const data = new Date(p.data_prevista)
          return (
            p.status === "Recebido" &&
            data.getMonth() === mesAtual &&
            data.getFullYear() === anoAtual
          )
        })
        .map(p => p.id_oportunidade)
    ),
  ].length

  // Contratos vendidos no ano
  const vendidosAno = [
    ...new Set(
      pagamentos
        .filter(p => {
          const data = new Date(p.data_prevista)
          return p.status === "Recebido" && data.getFullYear() === anoAtual
        })
        .map(p => p.id_oportunidade)
    ),
  ].length

  res.status(200).json({
    totalMes,
    totalAno,
    totalRecebido,
    vendidosMes,
    vendidosAno,
  })
}
