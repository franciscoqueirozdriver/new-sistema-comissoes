export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { dataType, data, mapping } = req.body;
    // TODO: persist data and trigger commission calculations based on dataType
    console.log('Received import payload for', dataType, { data, mapping });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

