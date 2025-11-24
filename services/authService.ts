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




// // ============================================
// // SERVIÇO DE AUTENTICAÇÃO
// // services/authService.ts
// // ============================================

// import {
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   User,
//   updateProfile,
// } from 'firebase/auth';
// import { auth } from '../firebaseConfig';

// /**
//  * Realiza login com email e senha
//  */
// export const loginUser = async (email: string, password: string): Promise<User> => {
//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     return userCredential.user;
//   } catch (error: any) {
//     throw new Error(handleAuthError(error.code));
//   }
// };

// /**
//  * Cria novo usuário
//  */
// export const registerUser = async (
//   email: string,
//   password: string,
//   displayName: string
// ): Promise<User> => {
//   try {
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     // Atualizar perfil com nome
//     await updateProfile(user, { displayName });

//     return user;
//   } catch (error: any) {
//     throw new Error(handleAuthError(error.code));
//   }
// };

// /**
//  * Realiza logout
//  */
// export const logoutUser = async (): Promise<void> => {
//   try {
//     await signOut(auth);
//   } catch (error) {
//     throw new Error('Erro ao fazer logout');
//   }
// };

// /**
//  * Obtém usuário atual
//  */
// export const getCurrentUser = (): User | null => {
//   return auth.currentUser;
// };

// /**
//  * Trata erros de autenticação
//  */
// const handleAuthError = (errorCode: string): string => {
//   switch (errorCode) {
//     case 'auth/invalid-email':
//       return 'Email inválido';
//     case 'auth/user-disabled':
//       return 'Usuário desabilitado';
//     case 'auth/user-not-found':
//       return 'Usuário não encontrado';
//     case 'auth/wrong-password':
//       return 'Senha incorreta';
//     case 'auth/email-already-in-use':
//       return 'Email já cadastrado';
//     case 'auth/weak-password':
//       return 'Senha muito fraca (mínimo 6 caracteres)';
//     case 'auth/network-request-failed':
//       return 'Erro de conexão. Verifique sua internet';
//     default:
//       return 'Erro ao autenticar. Tente novamente';
//   }
// };


// // // =======================================================
// // // SERVIÇO DE AUTENTICAÇÃO — COMPATÍVEL COM FIREBASE DO SITE
// // // services/authService.ts
// // // =======================================================

// // import {
// //   signInWithEmailAndPassword,
// //   createUserWithEmailAndPassword,
// //   signOut,
// //   User,
// //   updateProfile,
// // } from "firebase/auth";

// // import {
// //   doc,
// //   setDoc,
// //   Timestamp
// // } from "firebase/firestore";

// // import { auth, db } from "../firebaseConfig";

// // /**
// //  * LOGIN DE USUÁRIO
// //  */
// // export const loginUser = async (
// //   email: string,
// //   password: string
// // ): Promise<User> => {
// //   try {
// //     const userCredential = await signInWithEmailAndPassword(auth, email, password);
// //     return userCredential.user;

// //   } catch (error: any) {
// //     throw new Error(handleAuthError(error.code));
// //   }
// // };

// // /**
// //  * REGISTRAR NOVO USUÁRIO
// //  * Agora também cria o documento em `usuarios/{uid}` igual ao site
// //  */
// // export const registerUser = async (
// //   email: string,
// //   password: string,
// //   displayName: string,
// //   role: "admin" | "diretor" | "agente" = "agente"
// // ): Promise<User> => {
// //   try {
// //     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
// //     const user = userCredential.user;

// //     // Atualizar o nome no perfil do Auth
// //     await updateProfile(user, { displayName });

// //     // Criar documento no Firestore igual ao site
// //     await setDoc(doc(db, "usuarios", user.uid), {
// //       nome: displayName,
// //       email: email,
// //       role: role,
// //       presidioId: null,
// //       presidioNome: null,
// //       ativo: true,
// //       criadoEm: Timestamp.now(),
// //     });

// //     return user;

// //   } catch (error: any) {
// //     throw new Error(handleAuthError(error.code));
// //   }
// // };

// // /**
// //  * LOGOUT
// //  */
// // export const logoutUser = async (): Promise<void> => {
// //   try {
// //     await signOut(auth);
// //   } catch (error) {
// //     throw new Error("Erro ao fazer logout");
// //   }
// // };

// // /**
// //  * OBTÉM USUÁRIO ATUAL
// //  */
// // export const getCurrentUser = (): User | null => {
// //   return auth.currentUser;
// // };

// // /**
// //  * ERROS DE AUTENTICAÇÃO HUMANIZADOS
// //  */
// // const handleAuthError = (errorCode: string): string => {
// //   switch (errorCode) {
// //     case "auth/invalid-email":
// //       return "Email inválido";
// //     case "auth/user-disabled":
// //       return "Usuário desabilitado";
// //     case "auth/user-not-found":
// //       return "Usuário não encontrado";
// //     case "auth/wrong-password":
// //       return "Senha incorreta";
// //     case "auth/email-already-in-use":
// //       return "Email já cadastrado";
// //     case "auth/weak-password":
// //       return "Senha muito fraca (mínimo 6 caracteres)";
// //     case "auth/network-request-failed":
// //       return "Erro de conexão. Verifique sua internet";
// //     default:
// //       return "Erro ao autenticar. Tente novamente";
// //   }
// // };
