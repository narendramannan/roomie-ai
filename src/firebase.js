import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyDTestKey',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'test',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'test.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'test',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:1234567890:web:test'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
