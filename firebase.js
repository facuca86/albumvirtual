import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Pegá acá tus credenciales de Firebase:
  // apiKey: '...'
  // authDomain: '...'
  // projectId: '...'
  // storageBucket: '...'
  // messagingSenderId: '...'
  // appId: '...'
};

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const db = hasFirebaseConfig
  ? getFirestore(initializeApp(firebaseConfig))
  : null;

if (!hasFirebaseConfig) {
  console.warn('Firebase no está configurado. Se usará almacenamiento local en este navegador.');
}
