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


// services/conferenceService.ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface Conferencia {
  id: string;
  data: Timestamp;
  observacao: string;
  presidioId: string;
  totalConferidos: number;
  totalPresos: number;
  usuarioId: string;
}

const COLLECTION = "conferencias";

export const salvarConferencia = async (dados: Omit<Conferencia, "id" | "data">): Promise<string> => {
  try {
    const ref = doc(collection(db, COLLECTION));
    const conferencia: Conferencia = {
      ...dados,
      id: ref.id,
      data: Timestamp.now(),
    };
    await setDoc(ref, conferencia);
    return ref.id;
  } catch (err) {
    console.error("Erro ao salvar conferência:", err);
    throw new Error("Não foi possível salvar a conferência.");
  }
};

export const listarConferencias = async (usuarioId: string): Promise<Conferencia[]> => {
  try {
    const q = query(collection(db, COLLECTION), where("usuarioId", "==", usuarioId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Conferencia).sort((a,b) => b.data.seconds - a.data.seconds);
  } catch (err) {
    console.error("Erro ao listar conferências:", err);
    throw new Error("Não foi possível listar as conferências.");
  }
};

export const deletarConferencia = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    console.error("Erro ao excluir conferência:", err);
    throw new Error("Não foi possível excluir a conferência.");
  }
};

export const limparConferenciasDoUsuario = async (usuarioId: string): Promise<void> => {
  try {
    const q = query(collection(db, COLLECTION), where("usuarioId", "==", usuarioId));
    const snap = await getDocs(q);
    const deletions = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletions);
  } catch (err) {
    console.error("Erro ao limpar conferências:", err);
    throw new Error("Não foi possível limpar o histórico.");
  }
};



// services/storageService.ts
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../firebaseConfig";

export const uploadPrisonerPhoto = async (uri: string, originalName: string, onProgress?: (progress: number)=>void): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${Date.now()}-${originalName}`.replace(/\s+/g, "_");
    const storageRef = ref(storage, `fotos/${fileName}`);
    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, blob);
      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          snapshot => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          error => {
            console.error("Erro no upload:", error);
            reject(new Error("Erro ao fazer upload da foto"));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    }
  } catch (err) {
    console.error("Erro ao fazer upload da foto:", err);
    throw new Error("Não foi possível fazer upload da foto");
  }
};

export const deletePrisonerPhoto = async (photoUrl: string): Promise<void> => {
  try {
    if (!photoUrl) return;
    const pathStart = photoUrl.indexOf("/o/") + 3;
    const pathEnd = photoUrl.indexOf("?alt=");
    if (pathStart < 3 || pathEnd === -1) {
      // fallback: tenta usar como caminho direto
      const storageRef = ref(storage, photoUrl);
      await deleteObject(storageRef);
      return;
    }
    const fullPath = decodeURIComponent(photoUrl.substring(pathStart, pathEnd));
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
  } catch (error: any) {
    if (error?.code !== "storage/object-not-found") {
      console.error("Erro ao deletar foto:", error);
      throw new Error("Não foi possível deletar a foto");
    }
  }
};

export const uploadReport = async (uri: string, reportName: string, userId: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${Date.now()}-${reportName}.pdf`.replace(/\s+/g, "_");
    const storageRef = ref(storage, `relatorios/${userId}/${fileName}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.error("Erro ao fazer upload do relatório:", err);
    throw new Error("Não foi possível fazer upload do relatório");
  }
};



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


// ============================================
// TELA DE CONFERÊNCIA COM FIREBASE - Sistema Prisional
// app/conferencia/index.tsx
// ============================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "../../hooks/useAuth";
import {
  listarPresos,
  addPreso,
  updatePreso,
  deletePreso,
  Preso,
  Situacao,
} from "../../services/prisonerService";
import {
  uploadPrisonerPhoto,
  deletePrisonerPhoto,
} from "../../services/storageService";

import styles from "../styles";

// ============================================
// CONSTANTES
// ============================================

const PAVILIONS_CONFIG = {
  A: 20,
  B: 20,
  Triagem: 8,
  SAT: 1,
};

const SITUACOES: Situacao[] = [
  "Triagem",
  "Provisório",
  "Sentenciado",
  "Saída Temporária",
  "Transferido",
  "Fuga",
  "Hospitalizado",
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Conferencia() {
  const router = useRouter();
  const { user, userData } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "A" | "B" | "Triagem" | "SAT" | "Hospital"
  >("A");

  const [pavilions, setPavilions] = useState<{
    [key: string]: Array<{ id: number; prisoners: Preso[] }>;
  }>({
    A: Array(PAVILIONS_CONFIG.A)
      .fill(null)
      .map((_, i) => ({ id: i + 1, prisoners: [] })),
    B: Array(PAVILIONS_CONFIG.B)
      .fill(null)
      .map((_, i) => ({ id: i + 1, prisoners: [] })),
    Triagem: Array(PAVILIONS_CONFIG.Triagem)
      .fill(null)
      .map((_, i) => ({ id: i + 1, prisoners: [] })),
    SAT: Array(PAVILIONS_CONFIG.SAT)
      .fill(null)
      .map((_, i) => ({ id: 1, prisoners: [] })),
  });

  const [hospital, setHospital] = useState<Preso[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [selectedPavilion, setSelectedPavilion] = useState<string | null>(null);

  const [newPrisoner, setNewPrisoner] = useState<{
    nome: string;
    matricula: string;
    foto: string;
    tv: boolean;
    radio: boolean;
    ventilador: boolean;
    colchao: boolean;
    entryDate: string;
    diaVisita: string;
    situacao: Situacao;
  }>({
    nome: "",
    matricula: "",
    foto: "",
    tv: false,
    radio: false,
    ventilador: false,
    colchao: false,
    entryDate: new Date().toISOString().split("T")[0],
    diaVisita: "",
    situacao: "Triagem",
  });

  const [editingPrisoner, setEditingPrisoner] = useState<Preso | null>(null);

  // ============================================
  // CARREGAMENTO INICIAL
  // ============================================

  useEffect(() => {
    if (user) loadAllData();
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const allPresos = await listarPresos();

      const newPavilions: any = {
        A: Array(PAVILIONS_CONFIG.A)
          .fill(null)
          .map((_, i) => ({ id: i + 1, prisoners: [] })),
        B: Array(PAVILIONS_CONFIG.B)
          .fill(null)
          .map((_, i) => ({ id: i + 1, prisoners: [] })),
        Triagem: Array(PAVILIONS_CONFIG.Triagem)
          .fill(null)
          .map((_, i) => ({ id: i + 1, prisoners: [] })),
        SAT: Array(PAVILIONS_CONFIG.SAT)
          .fill(null)
          .map((_, i) => ({ id: 1, prisoners: [] })),
      };

      const hospitalPresos: Preso[] = [];

      allPresos.forEach((preso) => {
        if (preso.situacao === "Hospitalizado") {
          hospitalPresos.push(preso);
          return;
        }

        const pavRaw = (preso.pavilhao || "").toString();
        let pavKey = pavRaw;

        if (pavRaw.toLowerCase() === "a") pavKey = "A";
        else if (pavRaw.toLowerCase() === "b") pavKey = "B";
        else if (pavRaw.toLowerCase() === "triagem") pavKey = "Triagem";
        else if (pavRaw.toUpperCase() === "SAT") pavKey = "SAT";

        const celaNum = preso.cela ? parseInt(preso.cela, 10) : NaN;
        const cellIndex = !isNaN(celaNum) ? celaNum - 1 : -1;

        if (
          pavKey &&
          newPavilions[pavKey] &&
          cellIndex >= 0 &&
          cellIndex < newPavilions[pavKey].length
        ) {
          newPavilions[pavKey][cellIndex].prisoners.push(preso);
        }
      });

      setPavilions(newPavilions);
      setHospital(hospitalPresos);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FOTO
  // ============================================

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão negada", "Acesso à câmera necessário");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    return !result.canceled ? result.assets[0].uri : null;
  };

  // ============================================
  // ADICIONAR PRESO
  // ============================================

  const handleAddPrisoner = async () => {
    if (!newPrisoner.nome || !newPrisoner.matricula)
      return Alert.alert("Atenção", "Preencha nome e matrícula");

    if (
      newPrisoner.situacao !== "Hospitalizado" &&
      (!selectedPavilion || selectedCell === null)
    ) {
      return Alert.alert("Atenção", "Selecione pavilhão e cela");
    }

    try {
      setUploading(true);

      let fotoUrl = newPrisoner.foto;
      if (fotoUrl?.startsWith("file://"))
        fotoUrl = await uploadPrisonerPhoto(fotoUrl, newPrisoner.nome);

      const data: any = {
        ...newPrisoner,
        foto: fotoUrl,
        presidioId: userData?.presidioId,
        presidioNome: userData?.presidioNome,
      };

      if (newPrisoner.situacao === "Hospitalizado") {
        data.pavilhao = "";
        data.cela = "";
      } else {
        data.pavilhao = selectedPavilion;
        data.cela = String(selectedCell! + 1);
      }

      await addPreso(data);

      setShowAddModal(false);
      setNewPrisoner({
        nome: "",
        matricula: "",
        foto: "",
        tv: false,
        radio: false,
        ventilador: false,
        colchao: false,
        entryDate: new Date().toISOString().split("T")[0],
        diaVisita: "",
        situacao: "Triagem",
      });
      setSelectedPavilion(null);
      setSelectedCell(null);

      loadAllData();
    } catch (err) {
      Alert.alert("Erro", "Não foi possível adicionar preso");
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // EDITAR PRESO
  // ============================================

  const handleEditPrisoner = async () => {
    if (!editingPrisoner) return;

    try {
      setUploading(true);

      let fotoUrl = editingPrisoner.foto;
      if (fotoUrl?.startsWith("file://"))
        fotoUrl = await uploadPrisonerPhoto(fotoUrl, editingPrisoner.nome);

      await updatePreso(editingPrisoner.id, {
        ...editingPrisoner,
        foto: fotoUrl,
      });

      setShowEditModal(false);
      setEditingPrisoner(null);
      loadAllData();
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar preso");
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // REMOVER PRESO
  // ============================================

  const handleRemovePrisoner = (preso: Preso) => {
    Alert.alert("Confirmar", `Remover ${preso.nome}?`, [
      { text: "Cancelar" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            if (preso.foto) await deletePrisonerPhoto(preso.foto);
            await deletePreso(preso.id);
            loadAllData();
          } catch {
            Alert.alert("Erro", "Não foi possível remover");
          }
        },
      },
    ]);
  };

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  if (isLoading)
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </SafeAreaView>
    );

  const currentPavilion = pavilions[activeTab];

  const totalPrisoners =
    Object.values(pavilions)
      .flat()
      .reduce((sum, cell) => sum + cell.prisoners.length, 0) +
    hospital.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.circleBackButton}
            onPress={() => router.push("/menu")}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Adicionar / Organizar</Text>
          <Text style={styles.headerSub}>Total: {totalPrisoners}</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* ABAS */}
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["A", "B", "Triagem", "SAT", "Hospital"].map((tab) => {
            const count =
              tab === "Hospital"
                ? hospital.length
                : pavilions[tab].reduce(
                    (sum, cell) => sum + cell.prisoners.length,
                    0
                  );

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() =>
                  setActiveTab(tab as "A" | "B" | "Triagem" | "SAT" | "Hospital")
                }
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && { color: "#fff" },
                  ]}
                >
                  {tab}
                </Text>
                <Text
                  style={[
                    styles.tabCount,
                    activeTab === tab && { color: "#fff" },
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CONTEÚDO */}
      <ScrollView style={styles.content}>
        {activeTab === "Hospital" ? (
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>
                Hospital - {hospital.length} presos
              </Text>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => openAddModal(undefined, undefined, true)}
              >
                <Text style={styles.addBtnText}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>

            {hospital.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 50 }}>🏥</Text>
                <Text style={{ color: "#6b7280" }}>
                  Nenhum preso no hospital
                </Text>
              </View>
            ) : (
              hospital.map((preso) => (
                <View key={preso.id} style={styles.card}>
                  {preso.foto ? (
                    <Image source={{ uri: preso.foto }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text>?</Text>
                    </View>
                  )}

                  <View style={styles.prisonerInfo}>
                    <Text style={styles.prisonerName}>{preso.nome}</Text>
                    <Text style={styles.prisonerDetail}>
                      Mat: {preso.matricula}
                    </Text>
                    {preso.entryDate && (
                      <Text style={styles.prisonerDetail}>
                        Entrada: {preso.entryDate}
                      </Text>
                    )}
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(preso)}
                    >
                      <Text style={{ color: "#fff" }}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => handleRemovePrisoner(preso)}
                    >
                      <Text style={styles.delText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          currentPavilion.map((cell) => (
            <View key={cell.id} style={styles.cellCardNew}>
              <View style={styles.cellHeaderNew}>
                <Text style={styles.cellTitleNew}>Cela {cell.id}</Text>
                <Text style={styles.cellCount}>
                  {cell.prisoners.length} presos
                </Text>
              </View>

              {cell.prisoners.map((preso) => (
                <View key={preso.id} style={styles.card}>
                  {preso.foto ? (
                    <Image source={{ uri: preso.foto }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text>?</Text>
                    </View>
                  )}

                  <View style={styles.prisonerInfo}>
                    <Text style={styles.prisonerName}>{preso.nome}</Text>
                    <Text style={styles.prisonerDetail}>
                      Mat: {preso.matricula}
                    </Text>

                    {preso.entryDate && (
                      <Text style={styles.prisonerDetail}>
                        Entrada: {preso.entryDate}
                      </Text>
                    )}

                    <View style={styles.badges}>
                      {preso.tv && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>📺</Text>
                        </View>
                      )}
                      {preso.radio && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>📻</Text>
                        </View>
                      )}
                      {preso.ventilador && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>🌀</Text>
                        </View>
                      )}
                      {preso.colchao && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>🛏️</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(preso)}
                    >
                      <Text style={{ color: "#fff" }}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => handleRemovePrisoner(preso)}
                    >
                      <Text style={styles.delText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addPrisonerBtn}
                onPress={() =>
                  openAddModal(
                    activeTab as "A" | "B" | "Triagem" | "SAT",
                    cell.id - 1
                  )
                }
              >
                <Text style={styles.addPrisonerText}>
                  + Adicionar preso na Cela {cell.id}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL ADD */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>➕ Adicionar Preso</Text>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Nome"
                value={newPrisoner.nome}
                onChangeText={(t) =>
                  setNewPrisoner({ ...newPrisoner, nome: t })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Matrícula"
                value={newPrisoner.matricula}
                onChangeText={(t) =>
                  setNewPrisoner({ ...newPrisoner, matricula: t })
                }
              />

              <TouchableOpacity
                style={styles.photoBtn}
                onPress={async () => {
                  const uri = await takePhoto();
                  if (uri) setNewPrisoner({ ...newPrisoner, foto: uri });
                }}
              >
                <Text style={styles.photoBtnText}>
                  {newPrisoner.foto ? "📷 Alterar" : "📷 Adicionar Foto"}
                </Text>
              </TouchableOpacity>

              {newPrisoner.foto && (
                <Image
                  source={{ uri: newPrisoner.foto }}
                  style={styles.photoPreview}
                />
              )}

              {newPrisoner.situacao !== "Hospitalizado" && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Entrada (AAAA-MM-DD)"
                    value={newPrisoner.entryDate}
                    onChangeText={(t) =>
                      setNewPrisoner({ ...newPrisoner, entryDate: t })
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Dia de Visita"
                    value={newPrisoner.diaVisita}
                    onChangeText={(t) =>
                      setNewPrisoner({ ...newPrisoner, diaVisita: t })
                    }
                  />

                  <View style={styles.checkboxes}>
                    {[
                      { key: "tv", label: "📺 TV" },
                      { key: "radio", label: "📻 Rádio" },
                      { key: "ventilador", label: "🌀 Ventilador" },
                      { key: "colchao", label: "🛏️ Colchão" },
                    ].map(({ key, label }) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.checkItem}
                        onPress={() =>
                          setNewPrisoner((prev) => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof prev],
                          }))
                        }
                      >
                        <View
                          style={[
                            styles.checkBox,
                            newPrisoner[key as keyof typeof newPrisoner] &&
                              styles.checkBoxActive,
                          ]}
                        >
                          {newPrisoner[key as keyof typeof newPrisoner] && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                        <Text style={styles.checkLabel}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAddModal(false);
                  setNewPrisoner({
                    nome: "",
                    matricula: "",
                    foto: "",
                    tv: false,
                    radio: false,
                    ventilador: false,
                    colchao: false,
                    entryDate: new Date().toISOString().split("T")[0],
                    diaVisita: "",
                    situacao: "Triagem",
                  });
                }}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn2}
                onPress={handleAddPrisoner}
              >
                <Text style={styles.btnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL EDITAR */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>✏️ Editar</Text>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Nome"
                value={editingPrisoner?.nome || ""}
                onChangeText={(t) =>
                  setEditingPrisoner((prev) =>
                    prev ? { ...prev, nome: t } : prev
                  )
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Matrícula"
                value={editingPrisoner?.matricula || ""}
                onChangeText={(t) =>
                  setEditingPrisoner((prev) =>
                    prev ? { ...prev, matricula: t } : prev
                  )
                }
              />

              <TouchableOpacity
                style={styles.photoBtn}
                onPress={async () => {
                  const uri = await takePhoto();
                  if (uri)
                    setEditingPrisoner((prev) =>
                      prev ? { ...prev, foto: uri } : prev
                    );
                }}
              >
                <Text style={styles.photoBtnText}>
                  {editingPrisoner?.foto ? "📷 Alterar" : "📷 Adicionar Foto"}
                </Text>
              </TouchableOpacity>

              {editingPrisoner?.foto && (
                <Image
                  source={{ uri: editingPrisoner.foto }}
                  style={styles.photoPreview}
                />
              )}

              {editingPrisoner?.situacao !== "Hospitalizado" && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Entrada"
                    value={editingPrisoner?.entryDate || ""}
                    onChangeText={(t) =>
                      setEditingPrisoner((prev) =>
                        prev ? { ...prev, entryDate: t } : prev
                      )
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Dia de visita"
                    value={editingPrisoner?.diaVisita || ""}
                    onChangeText={(t) =>
                      setEditingPrisoner((prev) =>
                        prev ? { ...prev, diaVisita: t } : prev
                      )
                    }
                  />

                  <View style={styles.checkboxes}>
                    {[
                      { key: "tv", label: "📺 TV" },
                      { key: "radio", label: "📻 Rádio" },
                      { key: "ventilador", label: "🌀 Ventilador" },
                      { key: "colchao", label: "🛏️ Colchão" },
                    ].map(({ key, label }) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.checkItem}
                        onPress={() =>
                          setEditingPrisoner((prev: any) =>
                            prev ? { ...prev, [key]: !prev[key] } : prev
                          )
                        }
                      >
                        <View
                          style={[
                            styles.checkBox,
                            editingPrisoner?.[key] && styles.checkBoxActive,
                          ]}
                        >
                          {editingPrisoner?.[key] && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>

                        <Text style={styles.checkLabel}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingPrisoner(null);
                }}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn2}
                onPress={handleEditPrisoner}
              >
                <Text style={styles.btnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

import { Stack } from "expo-router";

export default function RootLayout() {
  // REMOVIDO: useEffect que causava loop infinito
  // A proteção de rotas será feita em cada tela individualmente
  
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        // Opções para Android
        animation: 'fade',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="login" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="menu" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="conferencia" />
      <Stack.Screen name="lista" />
      <Stack.Screen name="historico" />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}


// ============================================
// TELA DE HISTÓRICO ATUALIZADA PARA O FIREBASE DO SITE
// historico.tsx
// ============================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import {
  listarConferencias,
  deletarConferencia,
  limparConferenciasDoUsuario
} from "../services/conferenceService";

import { listarPresos } from "../services/prisonerService";

import styles from "./styles";
import { Ionicons } from '@expo/vector-icons';


export default function Historico() {

  const router = useRouter();
  const { user } = useAuth();

  const [conferencias, setConferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConference, setSelectedConference] = useState(null);

  // ============================================
  // CARREGAR DADOS (AGORA USANDO O FIREBASE DO SITE)
  // ============================================
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 🔥 Puxa da coleção "conferencias" do site
      const conferences = await listarConferencias(user.uid);

      setConferencias(conferences);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ============================================
  // LIMPAR HISTÓRICO DO USUÁRIO
  // ============================================
  const handleClearHistory = () => {
    Alert.alert(
      "Limpar histórico",
      "Deseja realmente excluir todas as conferências?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await limparConferenciasDoUsuario(user.uid);
              setConferencias([]);
              setSelectedConference(null);
            } catch {
              Alert.alert("Erro", "Falha ao limpar histórico.");
            }
          },
        },
      ]
    );
  };

  // ============================================
  // EXCLUIR UMA CONFERÊNCIA INDIVIDUAL
  // ============================================
  const handleDeleteConference = async (conf) => {
    Alert.alert(
      "Excluir",
      "Deseja excluir esta conferência?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletarConferencia(conf.id);
              if (selectedConference?.id === conf.id) {
                setSelectedConference(null);
              }
              loadData();
            } catch {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  };

  const handleSelectConference = (conference) => {
    setSelectedConference(conference);
  };

  const formatDate = (timestamp) => {
    const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR");
  };

  const getLocation = (p) => {
    if (p.isHospital) return "Hospital";
    return `Pavilhão ${p.pavilion ?? "?"} — Cela ${p.cellId ?? "?"}`;
  };

  // ============================================
  // PDF LISTA (ATUALIZADO PARA O FIREBASE DO SITE)
  // ============================================
  const generateListaPDF = async () => {

    try {
      const allPrisoners = await listarPresos(); // 🔥 sem user

      if (allPrisoners.length === 0) {
        Alert.alert("Atenção", "Nenhum interno encontrado.");
        return;
      }

      // ... todo seu código do PDF continua igual
      // (não vou repetir para não duplicar 500 linhas)
      // basta substituir a parte onde buscava:
      // getAllPrisoners(user.uid)
      // por:
      // listarPresos()

    } catch (e) {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

  // ============================================
  // PDF CONFERÊNCIA (ATUALIZADO)
  // ============================================
  const generateConferenciaPDF = async (conf) => {
    try {
      const allPrisoners = await listarPresos(); // 🔥 sem user

      // ... resto igual

    } catch (e) {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // ==================
  // RENDER PRINCIPAL
  // ==================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.circleBackButton} onPress={() => router.push("/menu")}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Histórico</Text>
          <Text style={styles.headerSub}>{conferencias.length} registros</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/login")}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView style={styles.content}>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: "#2563eb", marginBottom: 5 }]}
          onPress={handleRefresh}
          disabled={refreshing}>
          <Text style={styles.addButtonText}>
            {refreshing ? "Atualizando..." : "🔄 Atualizar"}
          </Text>
        </TouchableOpacity>

        {/* Botões PDF — permanecem iguais */}

        {/* Lista */}
        {conferencias.map((conf) => (
          <TouchableOpacity key={conf.id} onPress={() => handleSelectConference(conf)}>
            {/* card igual ao original */}
          </TouchableOpacity>
        ))}

        {conferencias.length > 0 && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#dc2626", marginTop: 10 }]}
            onPress={handleClearHistory}
          >
            <Text style={styles.addButtonText}>🗑️ Limpar Todo Histórico</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/login" />;
}

// ============================================
// TELA DE LISTA E CONFERÊNCIA COM FIREBASE
// lista.tsx - Sistema Prisional
// ============================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useAuth } from "../hooks/useAuth";
import { listarPresos } from "../services/prisonerService";
import { saveConference } from "../services/conferenceService";
import styles from "./styles";
import { Ionicons } from '@expo/vector-icons';

export default function Lista() {
  const router = useRouter();
  const { user } = useAuth();

  // ============================================
  // ESTADOS
  // ============================================
  const [prisoners, setPrisoners] = useState<Prisoner[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de busca e conferência
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [conferenciaMode, setConferenciaMode] = useState(false);
  const [conferenciaChecked, setConferenciaChecked] = useState<string[]>([]);

  // ============================================
  // CARREGAMENTO INICIAL
  // ============================================
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allPrisoners = await listarPresos(user.uid);
      setPrisoners(allPrisoners);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      Alert.alert("Erro", error.message || "Não foi possível carregar os dados");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  const getLocation = (prisoner: Prisoner): string => {
    if (prisoner.isHospital) return "Hospital";
    return `Pav. ${prisoner.pavilion || "?"} - Cela ${prisoner.cellId || "?"}`;
  };

  const filterPrisoners = (): Prisoner[] => {
    if (!searchQuery.trim()) return prisoners;

    const q = searchQuery.toLowerCase();
    return prisoners.filter((p) => {
      if (searchType === "name") return p.name.toLowerCase().includes(q);
      if (searchType === "matricula")
        return p.matricula?.toLowerCase().includes(q);
      if (searchType === "cell") return getLocation(p).toLowerCase().includes(q);
      return false;
    });
  };

  // ============================================
  // FUNÇÕES DE CONFERÊNCIA
  // ============================================
  const toggleConferenciaMode = () => {
    if (conferenciaMode) {
      Alert.alert("Cancelar?", "Cancelar conferência?", [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          onPress: () => {
            setConferenciaMode(false);
            setConferenciaChecked([]);
          },
        },
      ]);
    } else {
      setConferenciaMode(true);
      setConferenciaChecked([]);
    }
  };

  const saveConferencia = async () => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    const total = prisoners.length;
    const checked = conferenciaChecked.length;

    if (checked === 0) {
      Alert.alert("Atenção", "Nenhum preso conferido!");
      return;
    }

    try {
      await saveConference(
        {
          user: user.email || "Usuário",
          userName: user.displayName || user.email || "Usuário",
          totalPrisoners: total,
          checkedCount: checked,
          missingCount: total - checked,
          checkedIds: conferenciaChecked,
        },
        user.uid
      );

      Alert.alert(
        "Salvo!",
        `Conferidos: ${checked}/${total}\nFaltantes: ${total - checked}`,
        [
          {
            text: "OK",
            onPress: () => {
              setConferenciaMode(false);
              setConferenciaChecked([]);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível salvar.");
    }
  };

  // ============================================
  // RENDERIZAÇÃO - LOADING
  // ============================================
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando lista...</Text>
      </SafeAreaView>
    );
  }

  const displayedPrisoners = searchQuery ? filterPrisoners() : prisoners;

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* CABEÇALHO */}
      <View style={styles.header}>

        <TouchableOpacity style={styles.circleBackButton} onPress={() => router.push("/menu")}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View>
          <Text style={styles.headerTitle}>Lista</Text>
          <Text style={styles.headerSub}>Total: {prisoners.length}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA DE BUSCA E CONTROLES */}
      <View style={styles.searchArea}>
        {/* Botões de tipo de busca */}
        <View style={styles.searchBtns}>
          {[
            { key: "name", label: "Nome" },
            { key: "matricula", label: "Matrícula" },
            { key: "cell", label: "Local" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.searchBtn, searchType === t.key && styles.searchBtnActive]}
              onPress={() => setSearchType(t.key)}
            >
              <Text
                style={[
                  styles.searchBtnText,
                  searchType === t.key && { color: "#fff" },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Campo de busca */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Botões de conferência */}
        <View style={styles.confBtns}>
          <TouchableOpacity
            style={[styles.confBtn, conferenciaMode && { backgroundColor: "#ef4444" }]}
            onPress={toggleConferenciaMode}>
              <Text style={styles.confBtnText}>{conferenciaMode ? "❌ Cancelar" : "✅ Iniciar Conferência"}</Text>
          </TouchableOpacity>
          {conferenciaMode && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveConferencia}>
              <Text style={styles.saveBtnText}>
                💾 Salvar ({conferenciaChecked.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

     
      </View>

      {/* CONTEÚDO - LISTA DE PRESOS */}
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>
          {searchQuery
            ? `Resultados: ${displayedPrisoners.length}`
            : `Total: ${prisoners.length}`}
        </Text>

        {displayedPrisoners.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 50, marginBottom: 20 }}>🔍</Text>
            <Text
              style={{
                fontSize: 16,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              {searchQuery
                ? "Nenhum preso encontrado"
                : "Nenhum preso cadastrado"}
            </Text>
          </View>
        ) : (
          displayedPrisoners.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.listCard}
              onPress={() => {
                if (conferenciaMode) {
                  setConferenciaChecked((prev) =>
                    prev.includes(p.id)
                      ? prev.filter((id) => id !== p.id)
                      : [...prev, p.id]
                  );
                }
              }}
              disabled={!conferenciaMode}
            >
              {/* Checkbox de conferência */}
              {conferenciaMode && (
                <View
                  style={[
                    styles.checkbox,
                    conferenciaChecked.includes(p.id) && styles.checkboxActive,
                  ]}
                >
                  {conferenciaChecked.includes(p.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              )}

              {/* Foto do preso */}
              {p.photo ? (
                <Image source={{ uri: p.photo }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text>?</Text>
                </View>
              )}

              {/* Informações do preso */}
              <View style={styles.prisonerInfo}>
                <Text style={styles.prisonerName}>{p.name}</Text>
                <Text style={styles.prisonerDetail}>Mat: {p.matricula}</Text>
                <Text style={styles.location}>{getLocation(p)}</Text>
                {!p.isHospital && (
                  <>
                    <Text style={styles.prisonerDetail}>
                      Entrada: {formatDate(p.entryDate)}
                    </Text>
                    <View style={styles.badges}>
                      {p.hasTV && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>📺</Text>
                        </View>
                      )}
                      {p.hasRadio && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>📻</Text>
                        </View>
                      )}
                      {p.hasFan && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>🌀</Text>
                        </View>
                      )}
                      {p.hasMattress && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>🛏️</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// TELA DE LOGIN ATUALIZADA — COMPATÍVEL COM FIREBASE DO SITE
// login.tsx - Sistema Prisional
// ============================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import styles from "./styles";

export default function LoginFirebase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "diretor" | "agente">("agente");

  const [isRegistering, setIsRegistering] = useState(false);

  const { login, register, loading } = useAuth();
  const router = useRouter();

  // Bloquear botão voltar
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Sair", "Deseja sair do aplicativo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // =============================
  // LOGIN
  // =============================
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Atenção", "Preencha email e senha");
      return;
    }

    try {
      await login(email, password);
      router.replace("/menu");
    } catch (error: any) {
      Alert.alert("Erro de Login", error.message);
    }
  };

  // =============================
  // REGISTRO
  // =============================
  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Atenção", "A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      await register(email, password, displayName, role);
      Alert.alert("Sucesso", "Conta criada com sucesso!");
      router.replace("/menu");
    } catch (error: any) {
      Alert.alert("Erro ao Registrar", error.message);
    }
  };

  // =============================
  // LOADING INITIAL STATE
  // =============================
  if (loading) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  // =============================
  // UI
  // =============================
  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.loginKeyboard}
      >
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>🔒 Sistema Prisional</Text>

          <Text style={styles.loginSubtitle}>
            {isRegistering ? "Criar nova conta" : "Faça login para acessar"}
          </Text>

          {/* Nome (apenas quando registrando) */}
          {isRegistering && (
            <>
              <TextInput
                style={styles.loginInput}
                placeholder="Nome completo"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />

              {/* Seleção de cargo */}
              <View style={{ marginBottom: 15 }}>
                <Text style={{ color: "#fff", marginBottom: 5 }}>
                  Tipo de Usuário:
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  {["admin", "diretor", "agente"].map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r as any)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        backgroundColor: role === r ? "#1e90ff" : "#444",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#fff" }}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* EMAIL */}
          <TextInput
            style={styles.loginInput}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* SENHA */}
          <TextInput
            style={styles.loginInput}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          {/* BOTÃO */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {isRegistering ? "Criar Conta" : "Entrar"}
            </Text>
          </TouchableOpacity>

          {/* ALTERNAR ENTRE LOGIN / REGISTRO */}
          <TouchableOpacity
            onPress={() => setIsRegistering(!isRegistering)}
            style={{ marginTop: 20 }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {isRegistering
                ? "Já tem uma conta? Faça login"
                : "Ainda não tem conta? Registrar"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


// ============================================
// MENU ATUALIZADO — COMPATÍVEL COM FIREBASE DO SITE
// app/menu.tsx
// ============================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  BackHandler,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../hooks/useAuth";

import { listarPresos } from "../services/prisonerService";
import { listarConferencias } from "../services/conferenceService";

import styles from "./styles";

export default function MenuFirebase() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [totalPrisoners, setTotalPrisoners] = useState(0);
  const [totalConferences, setTotalConferences] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Bloquear botão voltar
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Atenção", "Deseja sair do aplicativo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Monitor de internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  // Carregar estatísticas
  useEffect(() => {
    if (user) loadStatistics();
  }, [user]);

  // Sincronização automática
  useEffect(() => {
    if (!user || !isOnline) return;

    const interval = setInterval(() => {
      loadStatistics(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, isOnline]);

  const loadStatistics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // LISTAR TODOS OS PRESOS (igual ao site)
      const presos = await listarPresos();
      setTotalPrisoners(presos.length);

      // LISTAR CONFERÊNCIAS DO USUÁRIO
      const confs = await listarConferencias(user.uid);
      setTotalConferences(confs.length);

      setLastSync(new Date());
    } catch (error) {
      if (!silent) {
        Alert.alert("Erro", "Não foi possível carregar os dados");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Confirmar", "Deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const formatLastSync = () => {
    if (!lastSync) return "Nunca";
    return lastSync.toLocaleTimeString("pt-BR");
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.menuContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.menuContainer}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sistema Prisional</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView style={styles.menuContent}>
          {/* Sincronização */}
          <View style={styles.syncCard}>
            <Text style={styles.syncTitle}>
              {isOnline ? "🔄 Online — Sincronizando" : "📡 Offline"}
            </Text>
            <Text style={styles.syncTime}>
              {isOnline ? `Última: ${formatLastSync()}` : "Sem conexão"}
            </Text>

            <TouchableOpacity
              disabled={!isOnline}
              onPress={() => loadStatistics()}
              style={styles.syncBtn}
            >
              <Text style={styles.syncBtnText}>Atualizar agora</Text>
            </TouchableOpacity>
          </View>

          {/* Menu */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/conferencia")}
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuCardTitle}>Adicionar Internos</Text>
            <Text style={styles.menuCardDescription}>
              Cadastrar novos internos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/lista")}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuCardTitle}>Lista</Text>
            <Text style={styles.menuCardDescription}>
              Visualizar todos os internos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/historico")}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuCardTitle}>Histórico</Text>
            <Text style={styles.menuCardDescription}>
              {totalConferences} conferências realizadas
            </Text>
          </TouchableOpacity>

          {/* Rodapé */}
          <View style={styles.totalBox}>
            <Text style={styles.totalText}>
              Total: {totalPrisoners} internos
            </Text>

            <Text style={{ color: "#bfdbfe", fontSize: 14, marginTop: 5 }}>
              Olá, {user.displayName || user.email}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}


// Tela atualizada para firebase do site
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Informações</ThemedText>

      <ThemedText style={styles.text}>
        Esta é uma janela modal simples.  
        Você pode usar esta tela para avisos, orientações ou confirmações dentro do aplicativo.
      </ThemedText>

      <Link href="/menu" dismissTo style={styles.link}>
        <ThemedText type="link">Voltar ao Menu</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  link: {
    marginTop: 10,
    paddingVertical: 10,
  },
  text: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.8,
  },
});



import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  /* ========= GERAIS ========= */
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 15,
  },

  /* ========= CABEÃ‡ALHO (usado em vÃ¡rias telas) ========= */
  header: { 
    backgroundColor: '#1e3a8a', 
    padding: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 25, 
    fontWeight: 'bold', 
    marginTop: 20 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
    marginLeft: 12,
    color: "#1e3a8a",
  },

  /* ========= BOTÃ•ES DO CABEÃ‡ALHO ========= */
  logoutBtn: { 
    backgroundColor: '#ef4444', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    marginTop: 25, 
    borderRadius: 10 
  },
    logoutBtnList: { 
    backgroundColor: '#797575ff', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    marginTop: 25, 
    borderRadius: 10 
  },
  logoutText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  backText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },

  /* ========= LOGIN ========= */
  loginContainer: {
    flex: 1,
    backgroundColor: "#1e3a8a",
    justifyContent: "center",
  },
  loginKeyboard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 8,
  },
  loginSubtitle: {
    textAlign: "center",
    color: "#475569",
    marginBottom: 20,
  },
  loginInput: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: "#1e3a8a",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginInfo: {
    marginTop: 20,
  },
  loginInfoTitle: {
    fontWeight: "bold",
    color: "#334155",
  },
  loginInfoText: {
    color: "#475569",
  },

  /* ========= MENU PRINCIPAL ========= */
  menuContainer: { 
    flex: 1, 
    backgroundColor: '#f3f4f6' 
  },
  menuContent: { 
    flex: 1, 
    padding: 20 
  },
  menuCard: { 
    backgroundColor: '#e0e0e07a', 
    borderRadius: 10, 
    padding: 20, 
    marginBottom: 10, 
    alignItems: 'center' 
  },
  menuIcon: { 
    fontSize: 30, 
    marginBottom: 10 
  },
  menuCardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1f2937' 
  },
  menuCardDescription: {
    color: "#475569",
    textAlign: "center",
    marginTop: 5,
  },
  totalBox: { 
    backgroundColor: '#2563eb', 
    borderRadius: 10, 
    marginTop: 5, 
    alignItems: 'center',
    padding: 10
  },
  totalText: { 
    color: '#ece7e7ff', 
    fontSize: 32, 
    fontWeight: 'bold' 
  },

  /* ========= MENU ANTIGO (manter compatibilidade) ========= */
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuHeaderTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center"
  },
  menuHeaderSubtitle: {
    color: "#cbd5e1",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1e3a8a",
  },

  /* ========= CONFERÃŠNCIA ========= */
  cellCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cellHeader: {
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 6,
  },
  cellTitle: {
    fontWeight: "bold",
    color: "#1e3a8a",
    fontSize: 16,
    marginTop: 10,
    marginLeft: 12,
  },
  prisonerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  prisonerText: {
    flex: 1,
    color: "#1e293b",
  },
  prisonerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    color: "#2563eb",
    fontWeight: "600",
  },
  deleteButton: {
    color: "#dc2626",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#1e3a8a",
    margin: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#94a3b8",
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  /* ========= MODAL ========= */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#1e3a8a",
    padding: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
    padding: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#1e3a8a",
    fontWeight: "600",
  },

  /* ========= LISTA ========= */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#475569",
  },

  /* ========= HISTÃ“RICO ========= */
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  historyTitle: {
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  historyDate: {
    color: "#475569",
  },

  /* ========= CONFERÊNCIA - ABAS ========= */
  tabs: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    maxHeight: 90,
  },
  tab: { 
    paddingHorizontal: 20, 
    paddingVertical: 5, 
    alignItems: "center" 
    
  },
  tabActive: {
    borderBottomWidth: 5,
    borderBottomColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  tabText: { 
    fontSize: 15, 
    color: "#6b7280", 
    fontWeight: "600" 
  },
  tabCount: { 
    fontSize: 15, 
    color: "#9ca3af", 
    fontWeight: "bold" 
  },

  /* ========= CONFERÊNCIA - CARDS E PRESOS ========= */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  photo: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 10 
  },
  photoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  prisonerInfo: { 
    flex: 1 
  },
  prisonerName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#1f2937" 
  },
  prisonerDetail: { 
    fontSize: 12, 
    color: "#6b7280", 
    marginTop: 2 
  },
  badges: {
    flexDirection: "row",
    marginTop: 5,
    gap: 5,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#e9d5ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: { 
    fontSize: 10, 
    fontWeight: "bold" 
  },
  actions: { 
    flexDirection: "row" 
  },
  editBtn: {
    backgroundColor: "#f59e0b",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  delBtn: {
    backgroundColor: "#ef4444",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  delText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  /* ========= CONFERÊNCIA - CELAS ========= */
  cellCardNew: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cellHeaderNew: {
    backgroundColor: "#1d4ed8",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cellTitleNew: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  cellCount: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "bold" 
  },
  addPrisonerBtn: {
    backgroundColor: "#2563eb",
    margin: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addPrisonerText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  /* ========= CONFERÊNCIA - MODAL COMPLETO ========= */
  modal: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    maxHeight: "90%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  photoBtn: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  photoBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
  },
  checkboxes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 12,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBoxActive: { 
    backgroundColor: "#2563eb", 
    borderColor: "#2563eb" 
  },
  checkmark: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 10 
  },
  checkLabel: { 
    fontSize: 14, 
    color: "#1f2937" 
  },
  modalBtns: { 
    flexDirection: "row", 
    gap: 10 
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#6b7280",
    alignItems: "center",
  },
  saveBtn2: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#16a34a",
    alignItems: "center",
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  /* ========= LISTA E BUSCA ========= */
  searchArea: { 
    backgroundColor: "#fff", 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: "#e5e7eb" 
  },
  searchBtns: { 
    flexDirection: "row", 
    gap: 8, 
    marginBottom: 10 
  },
  searchBtn: { 
    flex: 1, 
    paddingVertical: 8, 
    borderRadius: 8, 
    backgroundColor: "#f3f4f6", 
    alignItems: "center" 
  },
  searchBtnActive: { 
    backgroundColor: "#2563eb" 
  },
  searchBtnText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#6b7280" 
  },
  searchInput: { 
    borderWidth: 1, 
    borderColor: "#d1d5db", 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: "#f9fafb" 
  },
  confBtns: { 
    flexDirection: "row", 
    gap: 10, 
    marginTop: 12 
  },
  confBtn: { 
    flex: 1, 
    backgroundColor: "#16a34a", 
    padding: 12, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  confBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },
  saveBtn: { 
    backgroundColor: "#2563eb", 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    justifyContent: "center" 
  },
  saveBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },
  printBtn: { 
    backgroundColor: "#7c3aed", 
    padding: 12, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 12 
  },
  printBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },
  listCard: { 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    marginBottom: 10, 
    padding: 12, 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#e5e7eb" 
  },
  checkbox: { 
    width: 30, 
    height: 30, 
    borderWidth: 2, 
    borderColor: "#d1d5db", 
    borderRadius: 6, 
    marginRight: 10, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  checkboxActive: { 
    backgroundColor: "#16a34a", 
    borderColor: "#16a34a" 
  },
  location: { 
    fontSize: 12, 
    color: "#2563eb", 
    fontWeight: "bold", 
    marginTop: 4, 
    backgroundColor: "#eff6ff", 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 5, 
    alignSelf: "flex-start" 
  },
  headerSub: { 
    color: "#cfcfcfce", 
    fontSize: 20 
  },

  
});

export default styles;

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  /* ========= GERAIS ========= */
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
  },

  /* ========= CABEÇALHO FINO E MINIMALISTA ========= */
  header: { 
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#4043f3ff',
  },
  
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  
  headerCenter: {
    flex: 3,
    alignItems: 'center',
  },
  
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '600',
    letterSpacing: 0.3,
    flexWrap: 'nowrap', // Adicionei
    numberOfLines: 1, // Adicionei
  },
  headerSub: { 
    color: '#999', 
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 15,
    marginLeft: 5,
    color: "#1e40af",
  },

  /* ========= BOTÕES DO CABEÇALHO MINIMALISTAS ========= */
  logoutBtn: { 
    backgroundColor: '#ef4444', // Adicionei fundo vermelho
    paddingHorizontal: 16, // Aumentei de 8 para 16
    paddingVertical: 8, // Aumentei de 6 para 8
    borderRadius: 8, // Aumentei de 6 para 8
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutBtnList: { 
    backgroundColor: 'transparent',
    paddingHorizontal: 8, 
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: { 
    color: '#fff', // Mudei de '#999' para branco
    fontWeight: '600', // Aumentei de '500' para '600'
    fontSize: 14,
  },
  backText: { 
    color: '#fff', // Mudei de '#999' para branco
    fontWeight: '600', // Aumentei de '500' para '600'
    fontSize: 14,
  },
  circleBackButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#334155', // azul escuro/cinza escuro
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
},


  /* ========= LOGIN ========= */
  loginContainer: {
    flex: 1,
    backgroundColor: "#1e40af",
    justifyContent: "center",
  },
  loginKeyboard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e40af",
    textAlign: "center",
    marginBottom: 8,
  },
  loginSubtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 24,
    fontSize: 15,
  },
  loginInput: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: "#f8fafc",
  },
  loginButton: {
    backgroundColor: "#1e40af",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginInfo: {
    marginTop: 20,
  },
  loginInfoTitle: {
    fontWeight: "bold",
    color: "#334155",
  },
  loginInfoText: {
    color: "#64748b",
  },

  /* ========= MENU PRINCIPAL ========= */
  menuContainer: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  menuContent: { 
    flex: 1, 
    padding: 20 
  },
  menuCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24, 
    marginBottom: 16, 
    alignItems: 'center',
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuIcon: { 
    fontSize: 36, 
    marginBottom: 12 
  },
  menuCardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1e293b',
    marginBottom: 8,
  },
  menuCardDescription: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    fontSize: 14,
  },
  totalBox: { 
    backgroundColor: '#1e40af', 
    borderRadius: 16, 
    marginTop: 10, 
    alignItems: 'center',
    padding: 20,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  totalText: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: 'bold' 
  },

  /* ========= MENU ANTIGO (manter compatibilidade) ========= */
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuHeaderTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center"
  },
  menuHeaderSubtitle: {
    color: "#bfdbfe",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1e40af",
  },

  /* ========= CONFERÊNCIA - MODERNIZADO ========= */
  cellCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cellHeader: {
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8,
    fontSize: 15,
  },
  cellTitle: {
    fontWeight: "bold",
    color: "#1e40af",
    fontSize: 16,
    marginTop: 10,
    marginLeft: 12,
  },
  prisonerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  prisonerText: {
    flex: 1,
    color: "#1e293b",
  },
  prisonerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  deleteButton: {
    color: "#ef4444",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#1e40af",
    margin: 1,
    marginTop: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#64748b",
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  /* ========= MODAL ========= */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: "#f8fafc",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: "#1e40af",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 15,
  },

  /* ========= LISTA ========= */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
  },

  /* ========= HISTÓRICO - MODERNIZADO ========= */
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  historyTitle: {
    fontWeight: "bold",
    color: "#1e40af",
    fontSize: 16,
    marginBottom: 8,
  },
  historyDate: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 4,
  },

  /* ========= CONFERÊNCIA - ABAS MODERNIZADAS ========= */
  tabs: {
  backgroundColor: "#ffffff",
  paddingVertical: 12,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#e5e7eb",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 3,
},

tab: { 
  paddingHorizontal: 20,
  paddingVertical: 12,
  marginHorizontal: 6,
  borderRadius: 12,
  minWidth: 90,
  alignItems: "center",
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: "#e2e8f0",
},

tabActive: {
  backgroundColor: "#3b82f6",
  borderColor: "#3b82f6",
  shadowColor: "#3b82f6",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
},

tabText: { 
  fontSize: 15,
  color: "#64748b",
  fontWeight: "600",
  letterSpacing: 0.3,
},

tabCount: { 
  fontSize: 12,
  color: "#94a3b8",
  fontWeight: "600",
  marginTop: 4,
},

  /* ========= CONFERÊNCIA - CARDS E PRESOS MODERNIZADOS ========= */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 5,
  },
  addBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 14,
  },
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  photo: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#cbd5e1",
  },
  prisonerInfo: { 
    flex: 1 
  },
  prisonerName: { 
    fontSize: 17, 
    fontWeight: "bold", 
    color: "#1e293b",
    marginBottom: 4,
  },
  prisonerDetail: { 
    fontSize: 13, 
    color: "#64748b", 
    marginTop: 3 
  },
  badges: {
    flexDirection: "row",
    marginTop: 8,
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#ddd6fe",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: "bold" 
  },
  actions: { 
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#f59e0b",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  delBtn: {
    backgroundColor: "#ef4444",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  delText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  /* ========= CONFERÊNCIA - CELAS MODERNIZADAS ========= */
  cellCardNew: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cellHeaderNew: {
    backgroundColor: "#3b82f6",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cellTitleNew: { 
    color: "#fff", 
    fontSize: 19, 
    fontWeight: "bold" 
  },
  cellCount: { 
    color: "#fff", 
    fontSize: 13, 
    fontWeight: "bold",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addPrisonerBtn: {
    backgroundColor: "#3b82f6",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#60a5fa",
    borderStyle: "dashed",
  },
  addPrisonerText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },

  /* ========= CONFERÊNCIA - MODAL COMPLETO MODERNIZADO ========= */
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    maxHeight: "90%",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: "#f8fafc",
  },
  photoBtn: {
    backgroundColor: "#8b5cf6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  photoBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },
  checkboxes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 14,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
  },
  checkBox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkBoxActive: { 
    backgroundColor: "#3b82f6", 
    borderColor: "#3b82f6" 
  },
  checkmark: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  checkLabel: { 
    fontSize: 14, 
    color: "#1e293b",
    fontWeight: "500",
  },
  modalBtns: { 
    flexDirection: "row", 
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  saveBtn2: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },

  /* ========= LISTA E BUSCA MODERNIZADOS ========= */
  searchArea: { 
    backgroundColor: "#fff", 
    padding: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchBtns: { 
    flexDirection: "row", 
    gap: 10, 
    marginBottom: 14 
  },
  searchBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 10, 
    backgroundColor: "#f1f5f9", 
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchBtnActive: { 
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  searchBtnText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#64748b" 
  },
  searchInput: { 
    borderWidth: 1.5, 
    borderColor: "#cbd5e1", 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 15, 
    backgroundColor: "#f8fafc" 
  },
  confBtns: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 14 
  },
  confBtn: { 
    flex: 1, 
    backgroundColor: "#10b981", 
    padding: 14, 
    borderRadius: 12, 
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  saveBtn: { 
    backgroundColor: "#3b82f6", 
    paddingHorizontal: 24, 
    borderRadius: 12, 
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  printBtn: { 
    backgroundColor: "#8b5cf6", 
    padding: 14, 
    borderRadius: 12, 
    alignItems: "center", 
    marginTop: 5,
    marginBottom: 10,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  printBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  listCard: { 
    backgroundColor: "#fff", 
    borderRadius: 14, 
    marginBottom: 12, 
    padding: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#e2e8f0",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: { 
    width: 32, 
    height: 32, 
    borderWidth: 2, 
    borderColor: "#cbd5e1", 
    borderRadius: 8, 
    marginRight: 12, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: { 
    backgroundColor: "#10b981", 
    borderColor: "#10b981" 
  },
  location: { 
    fontSize: 12, 
    color: "#3b82f6", 
    fontWeight: "bold", 
    marginTop: 6, 
    backgroundColor: "#eff6ff", 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    alignSelf: "flex-start",
    overflow: "hidden",
  },
});

export default styles;

