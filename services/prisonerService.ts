// ============================================
// SERVIÇO DE DADOS DOS PRESOS
// services/prisonerService.ts
// ============================================

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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Tipos
export interface Prisoner {
  id: string;
  name: string;
  matricula: string;
  photo?: string;
  hasTV: boolean;
  hasRadio: boolean;
  hasFan: boolean;
  hasMattress: boolean;
  entryDate: string;
  pavilion?: string;
  cellId?: string;
  isHospital: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string; // ID do usuário que cadastrou
}

export interface Pavilion {
  id: string;
  name: string; // A, B, Triagem, SAT
  cells: Cell[];
  userId: string;
}

export interface Cell {
  id: number;
  prisoners: string[]; // IDs dos presos
}

const COLLECTIONS = {
  PRISONERS: 'prisoners',
  PAVILIONS: 'pavilions',
  CONFERENCES: 'conferences',
};

/**
 * Adiciona novo preso
 */
export const addPrisoner = async (
  prisonerData: Omit<Prisoner, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> => {
  try {
    const prisonerRef = doc(collection(db, COLLECTIONS.PRISONERS));
    const prisoner: Prisoner = {
      ...prisonerData,
      id: prisonerRef.id,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(prisonerRef, prisoner);
    return prisonerRef.id;
  } catch (error) {
    console.error('Erro ao adicionar preso:', error);
    throw new Error('Não foi possível adicionar o preso');
  }
};

/**
 * Atualiza dados de um preso
 */
export const updatePrisoner = async (
  prisonerId: string,
  updates: Partial<Prisoner>
): Promise<void> => {
  try {
    const prisonerRef = doc(db, COLLECTIONS.PRISONERS, prisonerId);
    await updateDoc(prisonerRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao atualizar preso:', error);
    throw new Error('Não foi possível atualizar o preso');
  }
};

/**
 * Remove preso
 */
export const deletePrisoner = async (prisonerId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRISONERS, prisonerId));
  } catch (error) {
    console.error('Erro ao remover preso:', error);
    throw new Error('Não foi possível remover o preso');
  }
};

/**
 * Busca preso por ID
 */
export const getPrisoner = async (prisonerId: string): Promise<Prisoner | null> => {
  try {
    const prisonerDoc = await getDoc(doc(db, COLLECTIONS.PRISONERS, prisonerId));
    return prisonerDoc.exists() ? (prisonerDoc.data() as Prisoner) : null;
  } catch (error) {
    console.error('Erro ao buscar preso:', error);
    throw new Error('Não foi possível buscar o preso');
  }
};

/**
 * Lista todos os presos de um usuário
 */
export const getAllPrisoners = async (userId: string): Promise<Prisoner[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRISONERS),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Prisoner);
  } catch (error) {
    console.error('Erro ao listar presos:', error);
    throw new Error('Não foi possível listar os presos');
  }
};

/**
 * Busca presos por pavilhão
 */
export const getPrisonersByPavilion = async (
  userId: string,
  pavilion: string
): Promise<Prisoner[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRISONERS),
      where('userId', '==', userId),
      where('pavilion', '==', pavilion),
      where('isHospital', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Prisoner);
  } catch (error) {
    console.error('Erro ao buscar presos do pavilhão:', error);
    throw new Error('Não foi possível buscar os presos');
  }
};

/**
 * Busca presos no hospital
 */
export const getHospitalPrisoners = async (userId: string): Promise<Prisoner[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRISONERS),
      where('userId', '==', userId),
      where('isHospital', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Prisoner);
  } catch (error) {
    console.error('Erro ao buscar presos do hospital:', error);
    throw new Error('Não foi possível buscar os presos');
  }
};

/**
 * Busca preso por matrícula
 */
export const getPrisonerByMatricula = async (
  userId: string,
  matricula: string
): Promise<Prisoner | null> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRISONERS),
      where('userId', '==', userId),
      where('matricula', '==', matricula)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as Prisoner;
  } catch (error) {
    console.error('Erro ao buscar por matrícula:', error);
    throw new Error('Não foi possível buscar o preso');
  }
};

/**
 * Salva estrutura de pavilhões
 */
export const savePavilionStructure = async (
  userId: string,
  pavilionData: Omit<Pavilion, 'id'>
): Promise<void> => {
  try {
    const pavilionRef = doc(db, COLLECTIONS.PAVILIONS, `${userId}_${pavilionData.name}`);
    await setDoc(pavilionRef, {
      ...pavilionData,
      id: pavilionRef.id,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao salvar pavilhão:', error);
    throw new Error('Não foi possível salvar a estrutura');
  }
};

/**
 * Carrega estrutura de pavilhões
 */
export const loadPavilionStructure = async (
  userId: string
): Promise<{ [key: string]: Cell[] }> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAVILIONS),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    const pavilions: { [key: string]: Cell[] } = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Pavilion;
      pavilions[data.name] = data.cells;
    });

    return pavilions;
  } catch (error) {
    console.error('Erro ao carregar pavilhões:', error);
    throw new Error('Não foi possível carregar os pavilhões');
  }
};

/**
 * Sincroniza todos os dados locais com o Firebase
 */
export const syncAllData = async (
  userId: string,
  localPrisoners: Prisoner[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    localPrisoners.forEach((prisoner) => {
      const prisonerRef = doc(db, COLLECTIONS.PRISONERS, prisoner.id || doc(collection(db, COLLECTIONS.PRISONERS)).id);
      batch.set(prisonerRef, {
        ...prisoner,
        userId,
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    throw new Error('Não foi possível sincronizar os dados');
  }
};
