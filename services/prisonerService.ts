// services/prisonerService.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export type Situacao =
  | "Triagem"
  | "Provisório"
  | "Sentenciado"
  | "Saída Temporária"
  | "Transferido"
  | "Fuga"
  | "Hospitalizado";

export interface Preso {
  id: string;
  nome: string;
  matricula: string;
  foto?: string | null;

  tv: boolean;
  radio: boolean;
  ventilador: boolean;
  colchao: boolean;

  pavilhao: string;
  cela: string;

  diaVisita?: string;
  situacao: Situacao;

  entryDate?: string;

  presidioId?: string;
  presidioNome?: string;

  criadoEm: Timestamp;
}

const COLLECTION = "presos";

function normalizeDados(input: any): Omit<Preso, "id" | "criadoEm"> {
  const nome = input.nome ?? input.name ?? "";
  const matricula = input.matricula ?? input.matricula ?? "";
  const foto = input.foto ?? input.photo ?? "";
  const tv = typeof input.tv !== "undefined" ? input.tv : input.hasTV ?? false;
  const radio = typeof input.radio !== "undefined" ? input.radio : input.hasRadio ?? false;
  const ventilador = typeof input.ventilador !== "undefined" ? input.ventilador : input.hasFan ?? false;
  const colchao = typeof input.colchao !== "undefined" ? input.colchao : input.hasMattress ?? false;
  const pavilhao = input.pavilhao ?? input.pavilion ?? "";
  const cela = input.cela ?? input.cellId ?? "";
  const diaVisita = input.diaVisita ?? input.visitDay ?? "";
  const presidioId = input.presidioId ?? input.presidio ?? "";
  const presidioNome = input.presidioNome ?? input.presidioName ?? "";
  const entryDate = input.entryDate ?? input.entry_date ?? "";

  const sitRaw = input.situacao ?? input.status ?? "";
  const validSits = ["Triagem","Provisório","Sentenciado","Saída Temporária","Transferido","Fuga","Hospitalizado"];
  const situacao = validSits.includes(sitRaw) ? sitRaw : "Triagem";

  return {
    nome,
    matricula,
    foto,
    tv,
    radio,
    ventilador,
    colchao,
    pavilhao,
    cela,
    diaVisita,
    situacao: situacao as Situacao,
    entryDate,
    presidioId,
    presidioNome,
  };
}

export const addPreso = async (dadosRaw: any): Promise<string> => {
  try {
    const dados = normalizeDados(dadosRaw);
    const ref = doc(collection(db, COLLECTION));
    const preso: Preso = {
      ...dados,
      id: ref.id,
      criadoEm: Timestamp.now(),
    };
    await setDoc(ref, preso);
    return ref.id;
  } catch (err) {
    console.error("Erro ao adicionar preso:", err);
    throw new Error("Não foi possível adicionar o preso.");
  }
};

export const updatePreso = async (presoId: string, updatesRaw: Partial<any>): Promise<void> => {
  try {
    const updates = normalizeDados(updatesRaw) as Partial<Preso>;
    Object.keys(updates).forEach((k) => {
      const val = (updates as any)[k];
      if (val === "" || typeof val === "undefined") {
        delete (updates as any)[k];
      }
    });
    const ref = doc(db, COLLECTION, presoId);
    await updateDoc(ref, updates);
  } catch (err) {
    console.error("Erro ao atualizar preso:", err);
    throw new Error("Não foi possível atualizar o preso.");
  }
};

export const deletePreso = async (presoId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, presoId));
  } catch (err) {
    console.error("Erro ao remover preso:", err);
    throw new Error("Não foi possível remover o preso.");
  }
};

export const getPreso = async (presoId: string): Promise<Preso | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, presoId));
    return snap.exists() ? (snap.data() as Preso) : null;
  } catch (err) {
    console.error("Erro ao buscar preso:", err);
    throw new Error("Não foi possível buscar o preso.");
  }
};

export const listarPresos = async (): Promise<Preso[]> => {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map((d) => d.data() as Preso);
  } catch (err) {
    console.error("Erro ao listar presos:", err);
    throw new Error("Não foi possível listar os presos.");
  }
};

export const getPresosPorPavilhao = async (pavilhao: string): Promise<Preso[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("pavilhao", "==", pavilhao),
      where("situacao", "!=", "Hospitalizado")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Preso);
  } catch (err) {
    console.error("Erro ao buscar pavilhão:", err);
    throw new Error("Erro ao buscar presos do pavilhão.");
  }
};

export const getPresosHospitalizados = async (): Promise<Preso[]> => {
  try {
    const q = query(collection(db, COLLECTION), where("situacao", "==", "Hospitalizado"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Preso);
  } catch (err) {
    console.error("Erro ao buscar hospitalizados:", err);
    throw new Error("Erro ao buscar presos hospitalizados.");
  }
};

export const getPresoPorMatricula = async (matricula: string): Promise<Preso | null> => {
  try {
    const q = query(collection(db, COLLECTION), where("matricula", "==", matricula));
    const snap = await getDocs(q);
    return snap.empty ? null : (snap.docs[0].data() as Preso);
  } catch (err) {
    console.error("Erro ao buscar matrícula:", err);
    throw new Error("Erro ao buscar preso por matrícula.");
  }
};






// // ============================================
// // SERVIÇO DE DADOS DOS PRESOS
// // services/prisonerService.ts
// // ============================================

// import {
//   collection,
//   doc,
//   setDoc,
//   getDoc,
//   getDocs,
//   updateDoc,
//   deleteDoc,
//   query,
//   where,
//   Timestamp,
//   writeBatch,
// } from 'firebase/firestore';
// import { db } from '../firebaseConfig';

// // Tipos
// export interface Prisoner {
//   id: string;
//   name: string;
//   matricula: string;
//   photo?: string;
//   hasTV: boolean;
//   hasRadio: boolean;
//   hasFan: boolean;
//   hasMattress: boolean;
//   entryDate: string;
//   pavilion?: string;
//   cellId?: string;
//   isHospital: boolean;
//   createdAt: Timestamp;
//   updatedAt: Timestamp;
//   userId: string; // ID do usuário que cadastrou
// }

// export interface Pavilion {
//   id: string;
//   name: string; // A, B, Triagem, SAT
//   cells: Cell[];
//   userId: string;
// }

// export interface Cell {
//   id: number;
//   prisoners: string[]; // IDs dos presos
// }

// const COLLECTIONS = {
//   PRISONERS: 'prisoners',
//   PAVILIONS: 'pavilions',
//   CONFERENCES: 'conferences',
// };

// /**
//  * Adiciona novo preso
//  */
// export const addPrisoner = async (
//   prisonerData: Omit<Prisoner, 'id' | 'createdAt' | 'updatedAt'>,
//   userId: string
// ): Promise<string> => {
//   try {
//     const prisonerRef = doc(collection(db, COLLECTIONS.PRISONERS));
//     const prisoner: Prisoner = {
//       ...prisonerData,
//       id: prisonerRef.id,
//       userId,
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now(),
//     };

//     await setDoc(prisonerRef, prisoner);
//     return prisonerRef.id;
//   } catch (error) {
//     console.error('Erro ao adicionar preso:', error);
//     throw new Error('Não foi possível adicionar o preso');
//   }
// };

// /**
//  * Atualiza dados de um preso
//  */
// export const updatePrisoner = async (
//   prisonerId: string,
//   updates: Partial<Prisoner>
// ): Promise<void> => {
//   try {
//     const prisonerRef = doc(db, COLLECTIONS.PRISONERS, prisonerId);
//     await updateDoc(prisonerRef, {
//       ...updates,
//       updatedAt: Timestamp.now(),
//     });
//   } catch (error) {
//     console.error('Erro ao atualizar preso:', error);
//     throw new Error('Não foi possível atualizar o preso');
//   }
// };

// /**
//  * Remove preso
//  */
// export const deletePrisoner = async (prisonerId: string): Promise<void> => {
//   try {
//     await deleteDoc(doc(db, COLLECTIONS.PRISONERS, prisonerId));
//   } catch (error) {
//     console.error('Erro ao remover preso:', error);
//     throw new Error('Não foi possível remover o preso');
//   }
// };

// /**
//  * Busca preso por ID
//  */
// export const getPrisoner = async (prisonerId: string): Promise<Prisoner | null> => {
//   try {
//     const prisonerDoc = await getDoc(doc(db, COLLECTIONS.PRISONERS, prisonerId));
//     return prisonerDoc.exists() ? (prisonerDoc.data() as Prisoner) : null;
//   } catch (error) {
//     console.error('Erro ao buscar preso:', error);
//     throw new Error('Não foi possível buscar o preso');
//   }
// };

// /**
//  * Lista todos os presos de um usuário
//  */
// export const getAllPrisoners = async (userId: string): Promise<Prisoner[]> => {
//   try {
//     const q = query(
//       collection(db, COLLECTIONS.PRISONERS),
//       where('userId', '==', userId)
//     );
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map((doc) => doc.data() as Prisoner);
//   } catch (error) {
//     console.error('Erro ao listar presos:', error);
//     throw new Error('Não foi possível listar os presos');
//   }
// };

// /**
//  * Busca presos por pavilhão
//  */
// export const getPrisonersByPavilion = async (
//   userId: string,
//   pavilion: string
// ): Promise<Prisoner[]> => {
//   try {
//     const q = query(
//       collection(db, COLLECTIONS.PRISONERS),
//       where('userId', '==', userId),
//       where('pavilion', '==', pavilion),
//       where('isHospital', '==', false)
//     );
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map((doc) => doc.data() as Prisoner);
//   } catch (error) {
//     console.error('Erro ao buscar presos do pavilhão:', error);
//     throw new Error('Não foi possível buscar os presos');
//   }
// };

// /**
//  * Busca presos no hospital
//  */
// export const getHospitalPrisoners = async (userId: string): Promise<Prisoner[]> => {
//   try {
//     const q = query(
//       collection(db, COLLECTIONS.PRISONERS),
//       where('userId', '==', userId),
//       where('isHospital', '==', true)
//     );
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map((doc) => doc.data() as Prisoner);
//   } catch (error) {
//     console.error('Erro ao buscar presos do hospital:', error);
//     throw new Error('Não foi possível buscar os presos');
//   }
// };

// /**
//  * Busca preso por matrícula
//  */
// export const getPrisonerByMatricula = async (
//   userId: string,
//   matricula: string
// ): Promise<Prisoner | null> => {
//   try {
//     const q = query(
//       collection(db, COLLECTIONS.PRISONERS),
//       where('userId', '==', userId),
//       where('matricula', '==', matricula)
//     );
//     const snapshot = await getDocs(q);
//     if (snapshot.empty) return null;
//     return snapshot.docs[0].data() as Prisoner;
//   } catch (error) {
//     console.error('Erro ao buscar por matrícula:', error);
//     throw new Error('Não foi possível buscar o preso');
//   }
// };

// /**
//  * Salva estrutura de pavilhões
//  */
// export const savePavilionStructure = async (
//   userId: string,
//   pavilionData: Omit<Pavilion, 'id'>
// ): Promise<void> => {
//   try {
//     const pavilionRef = doc(db, COLLECTIONS.PAVILIONS, `${userId}_${pavilionData.name}`);
//     await setDoc(pavilionRef, {
//       ...pavilionData,
//       id: pavilionRef.id,
//       updatedAt: Timestamp.now(),
//     });
//   } catch (error) {
//     console.error('Erro ao salvar pavilhão:', error);
//     throw new Error('Não foi possível salvar a estrutura');
//   }
// };

// /**
//  * Carrega estrutura de pavilhões
//  */
// export const loadPavilionStructure = async (
//   userId: string
// ): Promise<{ [key: string]: Cell[] }> => {
//   try {
//     const q = query(
//       collection(db, COLLECTIONS.PAVILIONS),
//       where('userId', '==', userId)
//     );
//     const snapshot = await getDocs(q);

//     const pavilions: { [key: string]: Cell[] } = {};
//     snapshot.docs.forEach((doc) => {
//       const data = doc.data() as Pavilion;
//       pavilions[data.name] = data.cells;
//     });

//     return pavilions;
//   } catch (error) {
//     console.error('Erro ao carregar pavilhões:', error);
//     throw new Error('Não foi possível carregar os pavilhões');
//   }
// };

// /**
//  * Sincroniza todos os dados locais com o Firebase
//  */
// export const syncAllData = async (
//   userId: string,
//   localPrisoners: Prisoner[]
// ): Promise<void> => {
//   try {
//     const batch = writeBatch(db);

//     localPrisoners.forEach((prisoner) => {
//       const prisonerRef = doc(db, COLLECTIONS.PRISONERS, prisoner.id || doc(collection(db, COLLECTIONS.PRISONERS)).id);
//       batch.set(prisonerRef, {
//         ...prisoner,
//         userId,
//         updatedAt: Timestamp.now(),
//       });
//     });

//     await batch.commit();
//   } catch (error) {
//     console.error('Erro ao sincronizar dados:', error);
//     throw new Error('Não foi possível sincronizar os dados');
//   }
// };

// // // 23 de outubro de 2025
// // // ============================================
// // // SERVIÇO ATUALIZADO - usa apenas campo `situacao`
// // // services/prisonerService.ts
// // // Atualizado para: Default situacao = "Triagem" e mapeamento de campos
// // // ============================================

// // import {
// //   collection,
// //   doc,
// //   setDoc,
// //   getDoc,
// //   getDocs,
// //   updateDoc,
// //   deleteDoc,
// //   query,
// //   where,
// //   Timestamp,
// // } from "firebase/firestore";
// // import { db } from "../firebaseConfig";

// // // ===========================
// // // TIPOS (situação como union para facilitar autocompletar)
// // // ===========================
// // export type Situacao =
// //   | "Triagem"
// //   | "Provisório"
// //   | "Sentenciado"
// //   | "Saída Temporária"
// //   | "Transferido"
// //   | "Fuga"
// //   | "Hospitalizado";

// // export interface Preso {
// //   id: string;
// //   nome: string;
// //   matricula: string;
// //   foto?: string;
// //   tv?: boolean;
// //   radio?: boolean;
// //   ventilador?: boolean;
// //   colchao?: boolean;
// //   pavilhao?: string;
// //   cela?: string;
// //   diaVisita?: string;
// //   situacao: Situacao;
// //   presidioId?: string;
// //   presidioNome?: string;
// //   criadoEm: Timestamp;
// // }

// // const COLLECTION = "presos";

// // /**
// //  * Helper: normaliza dados recebidos (aceita keys em inglês ou português)
// //  * e garante campos mínimos. Também define situacao padrão = "Triagem" quando não informado.
// //  */
// // function normalizeDados(input: any): Omit<Preso, "id" | "criadoEm"> {
// //   // mapeamentos simples inglês -> português
// //   const nome = input.nome ?? input.name ?? "";
// //   const matricula = input.matricula ?? input.matriculation ?? input.registration ?? "";
// //   const foto = input.foto ?? input.photo ?? input.image ?? "";
// //   const tv = typeof input.tv !== "undefined" ? input.tv : input.hasTV ?? false;
// //   const radio = typeof input.radio !== "undefined" ? input.radio : input.hasRadio ?? false;
// //   const ventilador = typeof input.ventilador !== "undefined" ? input.ventilador : input.hasFan ?? false;
// //   const colchao = typeof input.colchao !== "undefined" ? input.colchao : input.hasMattress ?? false;
// //   const pavilhao = input.pavilhao ?? input.pavilion ?? input.pav ?? "";
// //   const cela = input.cela ?? input.cellId ?? input.celle ?? "";
// //   const diaVisita = input.diaVisita ?? input.visitDay ?? "";
// //   const presidioId = input.presidioId ?? input.prisonId ?? input.presidio ?? "";
// //   const presidioNome = input.presidioNome ?? input.presidioName ?? "";
// //   // situacao default = "Triagem"
// //   const situacaoRaw = input.situacao ?? input.status ?? "";
// //   const situacao: Situacao = (
// //     situacaoRaw === "Provisório" ||
// //     situacaoRaw === "Sentenciado" ||
// //     situacaoRaw === "Saída Temporária" ||
// //     situacaoRaw === "Transferido" ||
// //     situacaoRaw === "Fuga" ||
// //     situacaoRaw === "Hospitalizado" ||
// //     situacaoRaw === "Triagem"
// //   )
// //     ? situacaoRaw
// //     : "Triagem";

// //   return {
// //     nome,
// //     matricula,
// //     foto,
// //     tv,
// //     radio,
// //     ventilador,
// //     colchao,
// //     pavilhao,
// //     cela,
// //     diaVisita,
// //     situacao,
// //     presidioId,
// //     presidioNome,
// //   };
// // }

// // // ============================================
// // // ADICIONAR PRESO
// // // ============================================
// // export const addPreso = async (
// //   dadosRaw: any // aceitamos qualquer shape e normalizamos
// // ): Promise<string> => {
// //   try {
// //     const dados = normalizeDados(dadosRaw);
// //     const ref = doc(collection(db, COLLECTION));

// //     const preso: Preso = {
// //       ...dados,
// //       id: ref.id,
// //       criadoEm: Timestamp.now(),
// //     };

// //     await setDoc(ref, preso);
// //     return ref.id;
// //   } catch (err) {
// //     console.error("Erro ao adicionar preso:", err);
// //     throw new Error("Não foi possível adicionar o preso.");
// //   }
// // };

// // // ============================================
// // // ATUALIZAR PRESO
// // // ============================================
// // // updates pode conter campos em inglês/português — fazemos um normalize parcial
// // export const updatePreso = async (
// //   presoId: string,
// //   updatesRaw: Partial<any>
// // ): Promise<void> => {
// //   try {
// //     // não sobrescrevemos criadoEm ou id aqui
// //     const updates = normalizeDados(updatesRaw) as Partial<Preso>;

// //     // remove chaves vazias (para não sobrescrever com "")
// //     Object.keys(updates).forEach((k) => {
// //       const val = (updates as any)[k];
// //       if (val === "" || typeof val === "undefined") {
// //         delete (updates as any)[k];
// //       }
// //     });

// //     const ref = doc(db, COLLECTION, presoId);
// //     await updateDoc(ref, updates);
// //   } catch (err) {
// //     console.error("Erro ao atualizar preso:", err);
// //     throw new Error("Não foi possível atualizar o preso.");
// //   }
// // };

// // // ============================================
// // // REMOVER PRESO
// // // ============================================
// // export const deletePreso = async (presoId: string): Promise<void> => {
// //   try {
// //     await deleteDoc(doc(db, COLLECTION, presoId));
// //   } catch (err) {
// //     console.error("Erro ao remover preso:", err);
// //     throw new Error("Não foi possível remover o preso.");
// //   }
// // };

// // // ============================================
// // // BUSCAR PRESO POR ID
// // // ============================================
// // export const getPreso = async (presoId: string): Promise<Preso | null> => {
// //   try {
// //     const snap = await getDoc(doc(db, COLLECTION, presoId));
// //     return snap.exists() ? (snap.data() as Preso) : null;
// //   } catch (err) {
// //     console.error("Erro ao buscar preso:", err);
// //     throw new Error("Não foi possível buscar o preso.");
// //   }
// // };

// // // ============================================
// // // LISTAR TODOS
// // // ============================================
// // export const listarPresos = async (): Promise<Preso[]> => {
// //   try {
// //     const snap = await getDocs(collection(db, COLLECTION));
// //     return snap.docs.map((d) => d.data() as Preso);
// //   } catch (err) {
// //     console.error("Erro ao listar presos:", err);
// //     throw new Error("Não foi possível listar os presos.");
// //   }
// // };

// // // ============================================
// // // LISTAR POR PAVILHÃO (exclui hospitalizados)
// // // ============================================
// // export const getPresosPorPavilhao = async (
// //   pavilhao: string
// // ): Promise<Preso[]> => {
// //   try {
// //     const q = query(
// //       collection(db, COLLECTION),
// //       where("pavilhao", "==", pavilhao),
// //       where("situacao", "!=", "Hospitalizado")
// //     );

// //     const snap = await getDocs(q);
// //     return snap.docs.map((d) => d.data() as Preso);
// //   } catch (err) {
// //     console.error("Erro ao buscar pavilhão:", err);
// //     throw new Error("Erro ao buscar presos do pavilhão.");
// //   }
// // };

// // // ============================================
// // // LISTAR PRESOS HOSPITALIZADOS
// // // ============================================
// // export const getPresosHospitalizados = async (): Promise<Preso[]> => {
// //   try {
// //     const q = query(
// //       collection(db, COLLECTION),
// //       where("situacao", "==", "Hospitalizado")
// //     );

// //     const snap = await getDocs(q);
// //     return snap.docs.map((d) => d.data() as Preso);
// //   } catch (err) {
// //     console.error("Erro ao buscar hospitalizados:", err);
// //     throw new Error("Erro ao buscar presos hospitalizados.");
// //   }
// // };

// // // ============================================
// // // BUSCAR POR MATRÍCULA
// // // ============================================
// // export const getPresoPorMatricula = async (
// //   matricula: string
// // ): Promise<Preso | null> => {
// //   try {
// //     const q = query(
// //       collection(db, COLLECTION),
// //       where("matricula", "==", matricula)
// //     );

// //     const snap = await getDocs(q);
// //     return snap.empty ? null : (snap.docs[0].data() as Preso);
// //   } catch (err) {
// //     console.error("Erro ao buscar matrícula:", err);
// //     throw new Error("Erro ao buscar preso por matrícula.");
// //   }
// // };
