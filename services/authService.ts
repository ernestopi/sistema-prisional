// services/authService.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  } catch (err: any) {
    throw new Error(handleAuthError(err.code));
  }
};

export const registerUser = async (email: string, password: string, displayName: string, role: "admin" | "diretor" | "agente" = "agente"): Promise<User> => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    await updateProfile(user, { displayName });
    await setDoc(doc(db, "usuarios", user.uid), {
      nome: displayName,
      email,
      role,
      presidioId: null,
      presidioNome: null,
      ativo: true,
      criadoEm: Timestamp.now(),
    });
    return user;
  } catch (err: any) {
    throw new Error(handleAuthError(err.code));
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err) {
    throw new Error("Erro ao fazer logout");
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

const handleAuthError = (code: string) => {
  switch (code) {
    case "auth/invalid-email": return "Email inválido";
    case "auth/user-disabled": return "Usuário desabilitado";
    case "auth/user-not-found": return "Usuário não encontrado";
    case "auth/wrong-password": return "Senha incorreta";
    case "auth/email-already-in-use": return "Email já cadastrado";
    case "auth/weak-password": return "Senha muito fraca (mínimo 6 caracteres)";
    case "auth/network-request-failed": return "Erro de conexão. Verifique sua internet";
    default: return "Erro ao autenticar. Tente novamente";
  }
};


