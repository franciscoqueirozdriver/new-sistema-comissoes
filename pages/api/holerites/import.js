import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { HoleriteSchema } from '@/lib/schemas/holerite';
import { upsertHoleriteRow } from '@/lib/googleSheetsService';

export const dynamic = 'force-dynamic';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ ok: false, error: 'Não autorizado.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  const parsed = HoleriteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, issues: parsed.error.issues });
  }

  try {
    await upsertHoleriteRow(parsed.data);
    return res.status(201).json({ ok: true, holerite_ID: parsed.data.holerite_ID });
  } catch (error) {
    console.error('Erro ao salvar holerite:', error);
    return res.status(500).json({ ok: false, error: 'Erro ao salvar holerite.' });
  }
}
