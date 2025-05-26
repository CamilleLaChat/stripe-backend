export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { prenom, metier, accessoire1, accessoire2, extra } = req.body;

  const prompt = `Boîte de figurine Starter Pack en style jouet réaliste. Le personnage est ${prenom}, un(e) ${metier}. Il/elle est placé(e) dans un emballage plastique moulé vert, comme un jouet, avec son prénom "${prenom}" écrit en gros en bas à droite. 
À droite de la figurine se trouvent deux accessoires visibles : ${accessoire1} et ${accessoire2}. 
Le style est réaliste mais propre, bien éclairé, fond uni vert mat, étiquette "STARTER PACK" en haut, typographie claire. L’image est bien centrée et vue de face. ${extra || ''}`;

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
