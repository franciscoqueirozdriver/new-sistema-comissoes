export const dynamic = 'force-dynamic';

export default async function handler(req, res) {
  try {
    const response = await fetch('http://elekto.com.br/api/Calendars/br-BC');
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro na API interna /api/feriados-nacionais:', error);
    return res.status(500).json({
      error: 'Falha ao obter feriados nacionais da Elekto.',
      details: error.message,
    });
  }
}
