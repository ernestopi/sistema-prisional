// ============================================
// HOOK DE AUTENTICAÇÃO COMPLETO E CORRIGIDO
// hooks/useAuth.ts
// ============================================

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

import {
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------
  // LISTENER PARA VERIFICAR MUDANÇA DE USUÁRIO LOGADO
  // ---------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(true);

      if (u) {
        try {
          const snap = await getDoc(doc(db, "usuarios", u.uid));
          setUserData(snap.exists() ? snap.data() : null);
        } catch (err) {
          console.error("Erro ao carregar dados do usuário:", err);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ---------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const loggedUser = await loginUser(email, password);
      setUser(loggedUser);

      // Carrega dados do Firestore
      const snap = await getDoc(doc(db, "usuarios", loggedUser.uid));
      setUserData(snap.exists() ? snap.data() : null);

      return loggedUser;
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // REGISTRAR USUÁRIO
  // ---------------------------------------------------------------------
  const register = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);

      const newUser = await registerUser(email, password, displayName);
      setUser(newUser);

      // Carrega os dados do Firestore
      const snap = await getDoc(doc(db, "usuarios", newUser.uid));
      setUserData(snap.exists() ? snap.data() : null);

      return newUser;
    } catch (err: any) {
      console.error("Erro ao registrar:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------
  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
      setUser(null);
      setUserData(null);
    } catch (err: any) {
      console.error("Erro ao sair:", err);
      setError(err.message);
      throw err;
    }
  };

  // ---------------------------------------------------------------------
  return {
    user,
    userData,
    loading,
    error,
    login,
    logout,
    register,
  };
};





// // hooks/useAuth.ts
// import { useState, useEffect } from "react";
// import { onAuthStateChanged, User } from "firebase/auth";
// import { auth, db } from "../firebaseConfig";
// import { doc, getDoc } from "firebase/firestore";

// export const useAuth = () => {
//   const [user, setUser] = useState<User | null>(null);
//   const [userData, setUserData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string|null>(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (u) => {
//       setUser(u);
//       setLoading(true);
//       if (u) {
//         try {
//           const snap = await getDoc(doc(db, "usuarios", u.uid));
//           setUserData(snap.exists() ? snap.data() : null);
//         } catch (err) {
//           console.error("Erro ao carregar dados do usuário:", err);
//         }
//       } else {
//         setUserData(null);
//       }
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, []);

//   return { user, userData, loading, error };
// };



// // // ============================================
// // // HOOK DE AUTENTICAÇÃO
// // // hooks/useAuth.ts
// // // ============================================

// // import { useState, useEffect } from 'react';
// // import { onAuthStateChanged, User } from 'firebase/auth';
// // import { auth } from '../firebaseConfig';
// // import { loginUser, logoutUser, registerUser } from '../services/authService';

// // export const useAuth = () => {
// //   const [user, setUser] = useState<User | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);

// //   useEffect(() => {
// //     // Listener para mudanças no estado de autenticação
// //     const unsubscribe = onAuthStateChanged(auth, (user) => {
// //       setUser(user);
// //       setLoading(false);
// //     });

// //     // Cleanup
// //     return unsubscribe;
// //   }, []);

// //   /**
// //    * Faz login
// //    */
// //   const login = async (email: string, password: string) => {
// //     try {
// //       setError(null);
// //       setLoading(true);
// //       const user = await loginUser(email, password);
// //       setUser(user);
// //       return user;
// //     } catch (err: any) {
// //       setError(err.message);
// //       throw err;
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   /**
// //    * Faz logout
// //    */
// //   const logout = async () => {
// //     try {
// //       setError(null);
// //       await logoutUser();
// //       setUser(null);
// //     } catch (err: any) {
// //       setError(err.message);
// //       throw err;
// //     }
// //   };

// //   /**
// //    * Registra novo usuário
// //    */
// //   const register = async (email: string, password: string, displayName: string) => {
// //     try {
// //       setError(null);
// //       setLoading(true);
// //       const user = await registerUser(email, password, displayName);
// //       setUser(user);
// //       return user;
// //     } catch (err: any) {
// //       setError(err.message);
// //       throw err;
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return {
// //     user,
// //     loading,
// //     error,
// //     login,
// //     logout,
// //     register,
// //   };
// // };
