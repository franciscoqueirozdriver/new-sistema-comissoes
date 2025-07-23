export const dynamic = 'force-dynamic';

export default async function handler(req, res) {
  const { initialDate, finalDate } = req.query;

  if (!initialDate || !finalDate) {
    return res.status(400).json({ error: 'Parâmetros initialDate e finalDate são obrigatórios.' });
  }

  try {
    const url = `http://elekto.com.br/api/Calendars/br-BC/Delta?initialDate=${initialDate}&finalDate=${finalDate}&type=financial`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro na API interna /api/dias-do-mes:', error);
    return res.status(500).json({ error: 'Falha ao obter dias do mês da Elekto.', details: error.message });
  }
}
