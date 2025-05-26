export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { prenom, metier, accessoire1, accessoire2, extra } = req.body;

const prompt = `Photo réaliste d'une boîte de figurine type Starter Pack. Le packaging est vert, avec une typographie lisible "STARTER PACK" en haut. 
À l’intérieur, une figurine de ${prenom}, un(e) ${metier}, en position debout, style cartoon réaliste, bien éclairée. 
La boîte est en plastique moulé, avec deux accessoires visibles à droite : ${accessoire1} et ${accessoire2}. 
Nom "${prenom}" écrit en bas à droite du blister. 
Style propre, fond uni, style produit marketing photographié de face. ${extra || ''}`;

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
