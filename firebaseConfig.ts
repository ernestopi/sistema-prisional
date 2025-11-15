// ============================================
// CONFIGURAÇÃO DO FIREBASE
// firebaseConfig.ts
// ============================================

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
// IMPORTANTE: Substitua estas credenciais pelas suas do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyArtt4drlnqlw7_UFOcXtvaXLx4ylpTpzo",
  authDomain: "conferenciapreso.firebaseapp.com",
  projectId: "conferenciapreso",
  storageBucket: "conferenciapreso.firebasestorage.app",
  messagingSenderId: "1048757487455",
  appId: "1:1048757487455:web:51e07730cf410ef3e8d8ea",
  measurementId: "G-64T85TC99K"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar serviços do Firebase

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
