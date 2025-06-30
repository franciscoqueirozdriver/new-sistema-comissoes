export default function handler(req, res) {
  const pagamentos = [
    { id_oportunidade: "OP-001", status: "Recebido", data_prevista: "2025-06-01" },
    { id_oportunidade: "OP-002", status: "Recebido", data_prevista: "2025-03-10" },
    { id_oportunidade: "OP-003", status: "Recebido", data_prevista: "2025-01-15" },
    { id_oportunidade: "OP-004", status: "Recebido", data_prevista: "2024-12-25" },
    { id_oportunidade: "OP-001", status: "Recebido", data_prevista: "2025-06-20" },
  ]

  const ano = new Date().getFullYear()

  const contratos = pagamentos
    .filter(p => {
      const data = new Date(p.data_prevista)
      return p.status === "Recebido" && data.getFullYear() === ano
    })
    .map(p => p.id_oportunidade)

  const unicos = [...new Set(contratos)]

  res.status(200).json({ total: unicos.length })
}

