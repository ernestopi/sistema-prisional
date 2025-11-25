// =============================================
// services/prisonerService.ts  (VERSÃO CORRIGIDA)
// =============================================

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

// ===================================================
// NORMALIZAÇÃO DE CAMPOS
// ===================================================
function normalizeDados(input: any): Omit<Preso, "id" | "criadoEm"> {
  const nome = input.nome ?? input.name ?? "";
  const matricula = input.matricula ?? input.registration ?? "";
  const foto = input.foto ?? input.photo ?? "";
  const tv = input.tv ?? input.hasTV ?? false;
  const radio = input.radio ?? input.hasRadio ?? false;
  const ventilador = input.ventilador ?? input.hasFan ?? false;
  const colchao = input.colchao ?? input.hasMattress ?? false;
  const pavilhao = input.pavilhao ?? input.pavilion ?? "";
  const cela = input.cela ?? input.cellId ?? "";
  const diaVisita = input.diaVisita ?? input.visitDay ?? "";
  const entryDate = input.entryDate ?? input.entry_date ?? "";

  const sitRaw = input.situacao ?? input.status ?? "Triagem";
  const validSits = [
    "Triagem",
    "Provisório",
    "Sentenciado",
    "Saída Temporária",
    "Transferido",
    "Fuga",
    "Hospitalizado",
  ];

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
    presidioId: input.presidioId ?? "",
    presidioNome: input.presidioNome ?? "",
  };
}

// ===================================================
// ADICIONAR PRESO
// ===================================================
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

// ===================================================
// ATUALIZAR PRESO
// ===================================================
export const updatePreso = async (
  presoId: string,
  updatesRaw: Partial<any>
): Promise<void> => {
  try {
    const updates = normalizeDados(updatesRaw);

    // remueve campos vazios
    Object.keys(updates).forEach((key) => {
      if (
        updates[key as keyof typeof updates] === "" ||
        typeof updates[key as keyof typeof updates] === "undefined"
      ) {
        delete updates[key as keyof typeof updates];
      }
    });

    const ref = doc(db, COLLECTION, presoId);
    await updateDoc(ref, updates);
  } catch (err) {
    console.error("Erro ao atualizar preso:", err);
    throw new Error("Não foi possível atualizar o preso.");
  }
};

// ===================================================
// REMOVER PRESO
// ===================================================
export const deletePreso = async (presoId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, presoId));
  } catch (err) {
    console.error("Erro ao remover preso:", err);
    throw new Error("Não foi possível remover o preso.");
  }
};

// ===================================================
// BUSCAR PRESO POR ID
// ===================================================
export const getPreso = async (presoId: string): Promise<Preso | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, presoId));
    return snap.exists()
      ? { id: snap.id, ...(snap.data() as Preso) }
      : null;
  } catch (err) {
    console.error("Erro ao buscar preso:", err);
    throw new Error("Não foi possível buscar o preso.");
  }
};

// ===================================================
// LISTAR TODOS OS PRESOS  (CORRIGIDO!!!)
// ===================================================
export const listarPresos = async (): Promise<Preso[]> => {
  try {
    const snap = await getDocs(collection(db, COLLECTION));

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Preso, "id">),
    })) as Preso[];
  } catch (err) {
    console.error("Erro ao listar presos:", err);
    throw new Error("Não foi possível listar os presos.");
  }
};

// ===================================================
// LISTAR PRESOS POR PRESÍDIO (NOVO!!!)
// Filtra os presos de uma unidade prisional específica
// ===================================================
export const listarPresosPorPresidio = async (presidioId: string): Promise<Preso[]> => {
  try {
    if (!presidioId) {
      console.warn("presidioId vazio, retornando todos os presos");
      return await listarPresos();
    }

    const q = query(
      collection(db, COLLECTION),
      where("presidioId", "==", presidioId)
    );
    
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Preso, "id">),
    })) as Preso[];
  } catch (err) {
    console.error("Erro ao listar presos por presídio:", err);
    throw new Error("Não foi possível listar os presos do presídio.");
  }
};

// ===================================================
// BUSCAR POR PAVILHÃO  (CORRIGIDO!!!)
// ===================================================
export const getPresosPorPavilhao = async (
  pavilhao: string
): Promise<Preso[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("pavilhao", "==", pavilhao),
      where("situacao", "!=", "Hospitalizado")
    );
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Preso, "id">),
    }));
  } catch (err) {
    console.error("Erro ao buscar pavilhão:", err);
    throw new Error("Erro ao buscar presos do pavilhão.");
  }
};

// ===================================================
// BUSCAR POR PAVILHÃO E PRESÍDIO (NOVO!!!)
// ===================================================
export const getPresosPorPavilhaoEPresidio = async (
  pavilhao: string,
  presidioId: string
): Promise<Preso[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("pavilhao", "==", pavilhao),
      where("presidioId", "==", presidioId),
      where("situacao", "!=", "Hospitalizado")
    );
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Preso, "id">),
    }));
  } catch (err) {
    console.error("Erro ao buscar pavilhão:", err);
    throw new Error("Erro ao buscar presos do pavilhão.");
  }
};

// ===================================================
// BUSCAR HOSPITALIZADOS (CORRIGIDO!!!)
// ===================================================
export const getPresosHospitalizados = async (): Promise<Preso[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("situacao", "==", "Hospitalizado")
    );
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Preso, "id">),
    }));
  } catch (err) {
    console.error("Erro ao buscar hospitalizados:", err);
    throw new Error("Erro ao buscar presos hospitalizados.");
  }
};

// ===================================================
// BUSCAR HOSPITALIZADOS POR PRESÍDIO (NOVO!!!)
// ===================================================
export const getPresosHospitalizadosPorPresidio = async (
  presidioId: string
): Promise<Preso[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("situacao", "==", "Hospitalizado"),
      where("presidioId", "==", presidioId)
    );
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Preso, "id">),
    }));
  } catch (err) {
    console.error("Erro ao buscar hospitalizados:", err);
    throw new Error("Erro ao buscar presos hospitalizados.");
  }
};

// ===================================================
// BUSCAR POR MATRÍCULA (CORRIGIDO!!!)
// ===================================================
export const getPresoPorMatricula = async (
  matricula: string
): Promise<Preso | null> => {
  try {
    const q = query(collection(db, COLLECTION), where("matricula", "==", matricula));
    const snap = await getDocs(q);

    return snap.empty
      ? null
      : ({
          id: snap.docs[0].id,
          ...(snap.docs[0].data() as Omit<Preso, "id">),
        } as Preso);
  } catch (err) {
    console.error("Erro ao buscar matrícula:", err);
    throw new Error("Erro ao buscar preso por matrícula.");
  }
};