// Firebase SDK imports
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDEHtof_bQF2IXcd_MQE_NU7E4dPkXtbTw',
  authDomain: 'admin-c2542.firebaseapp.com',
  projectId: 'admin-c2542',
  storageBucket: 'admin-c2542.firebasestorage.app',
  messagingSenderId: '327388088561',
  appId: '1:327388088561:web:4cabfd6afd44d708ccc150',
  measurementId: 'G-HRLZ790M68',
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);