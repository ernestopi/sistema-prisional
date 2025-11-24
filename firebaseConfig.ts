// firebaseConfig.ts
// CONFIGURAÇÃO DO FIREBASE - APP MOBILE (UNIFICADO com o SITE)
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBKIGKLfhPHpFOSpkPaqm8v1D6GadSe7Lg",
  authDomain: "sistema-prisional-multi.firebaseapp.com",
  projectId: "sistema-prisional-multi",
  storageBucket: "sistema-prisional-multi.firebasestorage.app",
  messagingSenderId: "658221532460",
  appId: "1:658221532460:web:2eab7399c21f3a89f61889"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;


// // ============================================
// // CONFIGURAÇÃO DO FIREBASE
// // firebaseConfig.ts
// // ============================================

// import { initializeApp } from 'firebase/app';
// import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';

// // Configuração do Firebase
// // IMPORTANTE: Substitua estas credenciais pelas suas do Firebase Console
// const firebaseConfig = {
//   apiKey: "AIzaSyArtt4drlnqlw7_UFOcXtvaXLx4ylpTpzo",
//   authDomain: "conferenciapreso.firebaseapp.com",
//   projectId: "conferenciapreso",
//   storageBucket: "conferenciapreso.firebasestorage.app",
//   messagingSenderId: "1048757487455",
//   appId: "1:1048757487455:web:51e07730cf410ef3e8d8ea",
//   measurementId: "G-64T85TC99K"
// };

// // Inicializar Firebase
// const app = initializeApp(firebaseConfig);

// // Exportar serviços do Firebase

// export const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage)
// });
// export const db = getFirestore(app);
// export const storage = getStorage(app);

// export default app;

