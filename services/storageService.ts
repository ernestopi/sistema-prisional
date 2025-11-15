// ============================================
// SERVIÇO DE ARMAZENAMENTO (STORAGE)
// services/storageService.ts
// ============================================

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from 'firebase/storage';
import { storage } from '../firebaseConfig';

/**
 * Faz upload de foto do preso
 */
export const uploadPrisonerPhoto = async (
  uri: string,
  prisonerId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Buscar o arquivo da URI
    const response = await fetch(uri);
    const blob = await response.blob();

    // Referência no Storage
    const storageRef = ref(storage, `prisoners/${prisonerId}/photo.jpg`);

    // Upload com progresso
    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Erro no upload:', error);
            reject(new Error('Erro ao fazer upload da foto'));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      // Upload simples sem progresso
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    }
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw new Error('Não foi possível fazer upload da foto');
  }
};

/**
 * Remove foto do preso
 */
export const deletePrisonerPhoto = async (prisonerId: string): Promise<void> => {
  try {
    const storageRef = ref(storage, `prisoners/${prisonerId}/photo.jpg`);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignora erro se arquivo não existir
    if ((error as any).code !== 'storage/object-not-found') {
      console.error('Erro ao deletar foto:', error);
      throw new Error('Não foi possível deletar a foto');
    }
  }
};

/**
 * Faz upload de arquivo PDF (relatórios)
 */
export const uploadReport = async (
  uri: string,
  reportName: string,
  userId: string
): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const storageRef = ref(storage, `reports/${userId}/${timestamp}_${reportName}.pdf`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload do relatório:', error);
    throw new Error('Não foi possível fazer upload do relatório');
  }
};
