export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { prenom, metier, accessoire1, accessoire2, extra } = req.body;

  const extraDetails = extra?.trim() ? `Caractéristiques physiques : ${extra}.` : '';

  const prompt = `
  Ultra-realistic photo of a Starter Pack action figure of a person named ${prenom}, whose profession is ${metier}.
  Figure includes two accessories: ${accessoire1} and ${accessoire2}.
  The character is packaged inside a plastic blister toy box, with a cardboard label reading "${prenom.toUpperCase()} - ${metier.toUpperCase()} Starter Pack".
  ${extraDetails}
  Inspired by the recent social media trend of customized starter pack action figures. High quality studio lighting, clear focus, soft shadows.
  `.trim();

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024'
      })
    });

    const data = await openaiRes.json();
    const imageUrl = data.data[0].url;

    res.status(200).json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur génération image' });
  }
}
