import { getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'MISSING_API_KEY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'MISSING_AUTH_DOMAIN',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://example.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'MISSING_PROJECT_ID',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'MISSING_BUCKET',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'MISSING_SENDER',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? 'MISSING_APP_ID',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const fsdb = getFirestore(app);
