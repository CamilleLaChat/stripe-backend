import { buffer } from 'micro';
import Stripe from 'stripe';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, increment, query, where, collection, getDocs } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ Empêche l'erreur "Firebase app already exists"
const app = getApps().length === 0 ? initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID
}) : getApp();

const db = getFirestore(app);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let event;

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Erreur de signature Stripe :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object;
      const codePromo = session.metadata?.codePromo;
      const userId = session.metadata?.userId;

      // ✅ Marquer l'utilisateur comme payé
      if (userId) {
        const userRef = doc(db, 'utilisateurs', userId);
        await updateDoc(userRef, {
          paiementEffectue: true
        });
        console.log(`✅ Utilisateur ${userId} marqué comme payé`);
      } else {
        console.warn('⚠️ Aucun userId dans les metadata');
      }

      if (codePromo && codePromo !== 'aucun') {
        const promoQuery = query(collection(db, 'codesPromo'), where('code', '==', codePromo));
        const snapshot = await getDocs(promoQuery);

        if (!snapshot.empty) {
          const promoRef = doc(db, 'codesPromo', snapshot.docs[0].id);
          await updateDoc(promoRef, {
            ventes: increment(1),
            gains: increment(10)
          });
          console.log(`✅ Code ${codePromo} mis à jour`);
        } else {
          console.warn(`⚠️ Code promo ${codePromo} non trouvé dans Firestore`);
        }
      } else {
        console.log('ℹ️ Pas de code promo fourni dans les metadata');
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error('🔥 Erreur interne dans le webhook :', err);
      return res.status(500).send('Erreur webhook');
    }
  } else {
    res.status(200).json({ received: true });
  }
}
