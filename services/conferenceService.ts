// ============================================
// SERVIÇO DE CONFERÊNCIAS
// services/conferenceService.ts
// ============================================

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Conference {
  id: string;
  date: Timestamp;
  user: string;
  userName: string;
  totalPrisoners: number;
  checkedCount: number;
  missingCount: number;
  checkedIds: string[];
  userId: string;
}

const COLLECTION = 'conferences';

/**
 * Salva nova conferência
 */
export const saveConference = async (
  conferenceData: Omit<Conference, 'id' | 'date'>,
  userId: string
): Promise<string> => {
  try {
    const conferenceRef = doc(collection(db, COLLECTION));
    const conference: Conference = {
      ...conferenceData,
      id: conferenceRef.id,
      date: Timestamp.now(),
      userId,
    };

    await setDoc(conferenceRef, conference);
    return conferenceRef.id;
  } catch (error) {
    console.error('Erro ao salvar conferência:', error);
    throw new Error('Não foi possível salvar a conferência');
  }
};

/**
 * Lista todas as conferências de um usuário
 */
export const getAllConferences = async (userId: string): Promise<Conference[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    // Ordenar localmente em vez de usar orderBy
    const conferences = snapshot.docs
      .map((doc) => doc.data() as Conference)
      .sort((a, b) => b.date.seconds - a.date.seconds);
    
    return conferences;
  } catch (error) {
    console.error('Erro ao listar conferências:', error);
    throw new Error('Não foi possível listar as conferências');
  }
};

/**
 * Remove uma conferência
 */
export const deleteConference = async (conferenceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, conferenceId));
  } catch (error) {
    console.error('Erro ao remover conferência:', error);
    throw new Error('Não foi possível remover a conferência');
  }
};

/**
 * Limpa todo o histórico de conferências
 */
export const clearAllConferences = async (userId: string): Promise<void> => {
  try {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    throw new Error('Não foi possível limpar o histórico');
  }
};