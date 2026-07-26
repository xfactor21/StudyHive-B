// Firebase initialization. Real project values come from environment
// variables in .env.local — never hardcode keys here.

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const REQUIRED_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

export const missingFirebaseEnv = REQUIRED_ENV_KEYS.filter((key) => !import.meta.env[key]);
export const FIREBASE_READY = missingFirebaseEnv.length === 0;

const firebaseConfig = FIREBASE_READY ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
} : null;

export const app = FIREBASE_READY ? initializeApp(firebaseConfig) : null;
export const auth = FIREBASE_READY ? getAuth(app) : null;
export const googleProvider = FIREBASE_READY ? new GoogleAuthProvider() : null;
export const db = FIREBASE_READY ? getFirestore(app) : null;
export const storage = FIREBASE_READY ? getStorage(app) : null;

if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export default firebaseConfig;
