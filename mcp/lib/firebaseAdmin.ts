import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App;

function getApp(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }

  const serviceAccount = JSON.parse(raw);
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

let dbInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getApp());
  return dbInstance;
}
