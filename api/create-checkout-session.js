import Stripe from 'stripe';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, increment, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialiser Firebase Admin SDK (si pas déjà initialisé)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, nom, prenom, adresse, codePromo } = req.body;

  let discountAmount = 0;
  let affiliateEmail = null;

  // Cherche si un code promo valide est enregistré en base
  if (codePromo) {
    const promoQuery = query(collection(db, 'codesPromo'), where('code', '==', codePromo.toUpperCase()));
    const snapshot = await getDocs(promoQuery);
    if (!snapshot.empty) {
      const promoDoc = snapshot.docs[0];
      const promoData = promoDoc.data();
      affiliateEmail = promoData.email;
      discountAmount = 1000; // 10€ de réduction

      // Incrément optionnel : statistiques d'usage du code
      await updateDoc(doc(db, 'codesPromo', promoDoc.id), {
        ventes: increment(1),
        gains: increment(10)
      });
    }
  }

  const basePrice = 8000; // 80€
  const finalPrice = basePrice - discountAmount;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Starter Pack - Prix public 80 €',
          },
          unit_amount: finalPrice,
        },
        quantity: 1
      }],
      customer_email: email,
      success_url: 'https://ton-site.vercel.app/merci',
      cancel_url: 'https://ton-site.vercel.app/erreur',
      metadata: {
        nom,
        prenom,
        adresse,
        codePromo: codePromo || 'aucun',
        affiliateEmail: affiliateEmail || 'aucun',
        commission: discountAmount ? '10' : '0'
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erreur Stripe :', error);
    res.status(500).json({ error: error.message });
  }
}
