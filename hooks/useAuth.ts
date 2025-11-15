// ============================================
// HOOK DE AUTENTICAÇÃO
// hooks/useAuth.ts
// ============================================

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { loginUser, logoutUser, registerUser } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listener para mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup
    return unsubscribe;
  }, []);

  /**
   * Faz login
   */
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const user = await loginUser(email, password);
      setUser(user);
      return user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Faz logout
   */
  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Registra novo usuário
   */
  const register = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const user = await registerUser(email, password, displayName);
      setUser(user);
      return user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
  };
};
