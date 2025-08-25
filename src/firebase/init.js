import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
/**
 * Firebase configuration values are normally provided via environment
 * variables. Jest tests and other non‑production environments may run
 * without these variables defined, which would cause Firebase to throw a
 * runtime error (auth/invalid-api-key) during initialization. To keep tests
 * isolated from real Firebase projects, fallback placeholder strings are
 * supplied when the expected variables are missing.
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'test-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'test-auth-domain',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'test-project-id',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'test-storage-bucket',
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'test-messaging-sender',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || 'test-app-id'
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
