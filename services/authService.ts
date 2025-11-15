// ============================================
// SERVIÇO DE AUTENTICAÇÃO
// services/authService.ts
// ============================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

/**
 * Realiza login com email e senha
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(handleAuthError(error.code));
  }
};

/**
 * Cria novo usuário
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Atualizar perfil com nome
    await updateProfile(user, { displayName });

    return user;
  } catch (error: any) {
    throw new Error(handleAuthError(error.code));
  }
};

/**
 * Realiza logout
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Erro ao fazer logout');
  }
};

/**
 * Obtém usuário atual
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Trata erros de autenticação
 */
const handleAuthError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Email inválido';
    case 'auth/user-disabled':
      return 'Usuário desabilitado';
    case 'auth/user-not-found':
      return 'Usuário não encontrado';
    case 'auth/wrong-password':
      return 'Senha incorreta';
    case 'auth/email-already-in-use':
      return 'Email já cadastrado';
    case 'auth/weak-password':
      return 'Senha muito fraca (mínimo 6 caracteres)';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet';
    default:
      return 'Erro ao autenticar. Tente novamente';
  }
};
