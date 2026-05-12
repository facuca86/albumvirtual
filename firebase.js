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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
