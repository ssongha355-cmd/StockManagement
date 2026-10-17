import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB-PN57EWfk17BQUMPpoa5-yUSehaBE7_Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "finance-manager-852fd.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "finance-manager-852fd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "finance-manager-852fd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "246583569658",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:246583569658:web:3c3f57e937e4955406ad43",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YKGNFPXRG5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
