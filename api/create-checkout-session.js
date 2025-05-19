import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { email, nom, prenom, adresse } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Starter Pack ${prenom} ${nom}`,
            },
            unit_amount: 9000,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: 'https://ton-site.vercel.app/merci',
      cancel_url: 'https://ton-site.vercel.app/erreur',
      metadata: { nom, prenom, adresse },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}