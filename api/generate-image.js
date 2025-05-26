export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { prenom, metier, accessoire1, accessoire2, extra } = req.body;

const prompt = `
Design d'un blister "Starter Pack" professionnel. Vue de face. Le packaging est vert, en plastique moulé avec une figurine au centre. 
La figurine représente une personne nommée "${prenom}", métier : ${metier}. Elle est accompagnée de deux accessoires à droite : ${accessoire1} et ${accessoire2}. 
En haut à gauche du blister, une étiquette indique "4+", en haut à droite un badge bleu indique "ACTION FIGURE". 
En haut au centre, un texte lisible en lettres majuscules "STARTER PACK". 
En bas, écrit en noir : "${prenom} — ${metier}". 
Style photoréaliste ou 3D cartoon réaliste avec ombrages propres. 
Pas de texte aléatoire. Emballage complet, proportions réalistes, pas de distorsion. ${extra || ''}
`;

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
