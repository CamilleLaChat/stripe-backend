import { buffer } from 'micro';
import Stripe from 'stripe';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, increment, query, where, collection, getDocs } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const codePromo = session.metadata?.codePromo;
      if (codePromo && codePromo !== 'aucun') {
        const promoQuery = query(collection(db, 'codesPromo'), where('code', '==', codePromo));
        const snapshot = await getDocs(promoQuery);
        if (!snapshot.empty) {
          const promoRef = doc(db, 'codesPromo', snapshot.docs[0].id);
          await updateDoc(promoRef, {
            ventes: increment(1),
            gains: increment(10)
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
