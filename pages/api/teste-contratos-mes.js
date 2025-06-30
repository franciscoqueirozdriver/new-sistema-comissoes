export default function handler(req, res) {
  const pagamentos = [
    { id_oportunidade: "OP-001", status: "Recebido", data_prevista: "2025-06-01" },
    { id_oportunidade: "OP-002", status: "Recebido", data_prevista: "2025-06-10" },
    { id_oportunidade: "OP-001", status: "Recebido", data_prevista: "2025-06-20" },
    { id_oportunidade: "OP-003", status: "Pendente", data_prevista: "2025-06-15" },
    { id_oportunidade: "OP-004", status: "Recebido", data_prevista: "2025-05-25" },
  ]

  const hoje = new Date()
  const mes = hoje.getMonth()
  const ano = hoje.getFullYear()

  const contratos = pagamentos
    .filter(p => {
      const data = new Date(p.data_prevista)
      return (
        p.status === "Recebido" &&
        data.getMonth() === mes &&
        data.getFullYear() === ano
      )
    })
    .map(p => p.id_oportunidade)

  const unicos = [...new Set(contratos)]

  res.status(200).json({ total: unicos.length })
}
