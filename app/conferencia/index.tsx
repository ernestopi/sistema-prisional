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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import {
  getAllPrisoners,
  addPrisoner,
  updatePrisoner,
  deletePrisoner,
  getPrisonersByPavilion,
  getHospitalPrisoners,
  Prisoner,
} from "../../services/prisonerService";
import { uploadPrisonerPhoto, deletePrisonerPhoto } from "../../services/storageService";
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

export default function Conferencia() {
  const router = useRouter();
  const { user } = useAuth();

  // ============================================
  // ESTADOS
  // ============================================
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("A");

  // Estrutura de dados organizada por pavilhão e cela
  const [pavilions, setPavilions] = useState<{
    [key: string]: Array<{ id: number; prisoners: Prisoner[] }>;
  }>({
    A: Array(20).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
    B: Array(20).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
    Triagem: Array(8).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
    SAT: Array(1).fill(null).map((_, i) => ({ id: 1, prisoners: [] })),
  });

  const [hospital, setHospital] = useState<Prisoner[]>([]);

  // Modais e seleção
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [selectedPavilion, setSelectedPavilion] = useState<string | null>(null);
  const [isHospital, setIsHospital] = useState(false);

  const [editingPrisoner, setEditingPrisoner] = useState<any>(null);
  const [editingLocation, setEditingLocation] = useState<any>(null);

  // Formulário de novo preso
  const [newPrisoner, setNewPrisoner] = useState({
    name: "",
    matricula: "",
    photo: "",
    hasTV: false,
    hasRadio: false,
    hasFan: false,
    hasMattress: false,
    entryDate: new Date().toISOString().split("T")[0],
  });

  // ============================================
  // CARREGAMENTO INICIAL
  // ============================================
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Carregar todos os presos do Firebase
      const allPrisoners = await getAllPrisoners(user.uid);

      // Organizar presos por pavilhão e cela
      const newPavilions: any = {
        A: Array(20).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
        B: Array(20).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
        Triagem: Array(8).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
        SAT: Array(1).fill(null).map((_, i) => ({ id: 1, prisoners: [] })),
      };

      const hospitalPrisoners: Prisoner[] = [];

      allPrisoners.forEach((prisoner) => {
        if (prisoner.isHospital) {
          hospitalPrisoners.push(prisoner);
        } else if (prisoner.pavilion && prisoner.cellId) {
          const pavilion = prisoner.pavilion;
          const cellIndex = parseInt(prisoner.cellId) - 1;
          
          if (newPavilions[pavilion] && newPavilions[pavilion][cellIndex]) {
            newPavilions[pavilion][cellIndex].prisoners.push(prisoner);
          }
        }
      });

      setPavilions(newPavilions);
      setHospital(hospitalPrisoners);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      Alert.alert("Erro", error.message || "Não foi possível carregar os dados");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FUNÇÃO: Tirar foto
  // ============================================
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão necessária", "Acesso à câmera negado");
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      return !result.canceled ? result.assets[0].uri : null;
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      return null;
    }
  };

  // ============================================
  // FUNÇÃO: Adicionar preso
  // ============================================
  const handleAddPrisoner = async () => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    if (!newPrisoner.name.trim() || !newPrisoner.matricula.trim()) {
      Alert.alert("Atenção", "Preencha nome e matrícula");
      return;
    }

    try {
      setUploading(true);

      // Upload da foto se existir
      let photoUrl = newPrisoner.photo;
      if (newPrisoner.photo && newPrisoner.photo.startsWith("file://")) {
        const tempId = `temp_${Date.now()}`;
        photoUrl = await uploadPrisonerPhoto(newPrisoner.photo, tempId);
      }

      // Adicionar preso no Firebase
      const prisonerData: any = {
        name: newPrisoner.name,
        matricula: newPrisoner.matricula,
        photo: photoUrl,
        hasTV: newPrisoner.hasTV,
        hasRadio: newPrisoner.hasRadio,
        hasFan: newPrisoner.hasFan,
        hasMattress: newPrisoner.hasMattress,
        entryDate: newPrisoner.entryDate,
        isHospital: isHospital,
      };

      if (!isHospital && selectedPavilion && selectedCell !== null) {
        prisonerData.pavilion = selectedPavilion;
        prisonerData.cellId = (selectedCell + 1).toString();
      }

      await addPrisoner(prisonerData, user.uid);
      
      Alert.alert("Sucesso", "Preso cadastrado com sucesso!");
      
      // Limpar formulário e recarregar dados
      setNewPrisoner({
        name: "",
        matricula: "",
        photo: "",
        hasTV: false,
        hasRadio: false,
        hasFan: false,
        hasMattress: false,
        entryDate: new Date().toISOString().split("T")[0],
      });
      
      setShowAddModal(false);
      await loadAllData();
    } catch (error: any) {
      console.error("Erro ao adicionar:", error);
      Alert.alert("Erro", error.message || "Não foi possível adicionar o preso");
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // FUNÇÃO: Editar preso
  // ============================================
  const handleEditPrisoner = async () => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    if (!editingPrisoner?.name?.trim() || !editingPrisoner?.matricula?.trim()) {
      Alert.alert("Atenção", "Preencha nome e matrícula");
      return;
    }

    try {
      setUploading(true);

      // Upload da foto se foi alterada
      let photoUrl = editingPrisoner.photo;
      if (editingPrisoner.photo && editingPrisoner.photo.startsWith("file://")) {
        photoUrl = await uploadPrisonerPhoto(
          editingPrisoner.photo,
          editingPrisoner.id
        );
      }

      // Atualizar no Firebase
      await updatePrisoner(editingPrisoner.id, {
        name: editingPrisoner.name,
        matricula: editingPrisoner.matricula,
        photo: photoUrl,
        hasTV: editingPrisoner.hasTV,
        hasRadio: editingPrisoner.hasRadio,
        hasFan: editingPrisoner.hasFan,
        hasMattress: editingPrisoner.hasMattress,
        entryDate: editingPrisoner.entryDate,
      });

      Alert.alert("Sucesso", "Preso atualizado!");
      setShowEditModal(false);
      setEditingPrisoner(null);
      await loadAllData();
    } catch (error: any) {
      console.error("Erro ao editar:", error);
      Alert.alert("Erro", error.message || "Não foi possível atualizar");
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // FUNÇÃO: Remover preso
  // ============================================
  const handleRemovePrisoner = async (prisoner: Prisoner) => {
    Alert.alert("Confirmar", `Remover ${prisoner.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            // Deletar foto se existir
            if (prisoner.photo) {
              await deletePrisonerPhoto(prisoner.id);
            }

            // Deletar preso
            await deletePrisoner(prisoner.id);
            Alert.alert("Sucesso", "Preso removido");
            await loadAllData();
          } catch (error: any) {
            Alert.alert("Erro", error.message || "Não foi possível remover");
          }
        },
      },
    ]);
  };

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const openAddModal = (pavilion?: string, cellIndex?: number, isHosp = false) => {
    setSelectedPavilion(pavilion || null);
    setSelectedCell(cellIndex !== undefined ? cellIndex : null);
    setIsHospital(isHosp);
    setShowAddModal(true);
  };

  const openEditModal = (prisoner: Prisoner) => {
    setEditingPrisoner({ ...prisoner });
    setEditingLocation({
      isHospital: prisoner.isHospital,
      pavilion: prisoner.pavilion,
      cellId: prisoner.cellId,
      prisonerId: prisoner.id,
    });
    setShowEditModal(true);
  };

  // ============================================
  // RENDERIZAÇÃO - LOADING
  // ============================================
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  const currentPavilion = pavilions[activeTab] || [];
  const totalPrisoners =
    Object.values(pavilions)
      .flat()
      .reduce((sum, cell) => sum + cell.prisoners.length, 0) + hospital.length;

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* CABEÇALHO */}
      {/* CABEÇALHO MODERNO */}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.circleBackButton} onPress={() => router.push("/menu")}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Adcionar</Text>
          <Text style={styles.headerSub}>Total: {totalPrisoners}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/login")}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ABAS */}
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
          {["A", "B", "Triagem", "SAT", "Hospital"].map((tab) => { const count = tab === "Hospital" ? hospital.length
          : pavilions[tab]?.reduce((sum, cell) => sum + cell.prisoners.length, 0) || 0;
          return (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && { color: "#fff" }]}>{tab}</Text>
              <Text style={[styles.tabCount, activeTab === tab && { color: "#fff" }]}>{count}</Text>
            </TouchableOpacity>
          );})}
        </ScrollView>
      </View>
      
      {/* CONTEÚDO */}
      <ScrollView style={styles.content}>
        {activeTab === "Hospital" ? (
          // HOSPITAL
          <>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Hospital - {hospital.length} presos</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => openAddModal(undefined, undefined, true)}
              >
                <Text style={styles.addBtnText}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>

            {hospital.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 50, marginBottom: 20 }}>🏥</Text>
                <Text style={{ fontSize: 16, color: "#6b7280", textAlign: "center" }}>
                  Nenhum preso no hospital
                </Text>
              </View>
            ) : (
              hospital.map((prisoner) => (
                <View key={prisoner.id} style={styles.card}>
                  {prisoner.photo ? (
                    <Image source={{ uri: prisoner.photo }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text>?</Text>
                    </View>
                  )}

                  <View style={styles.prisonerInfo}>
                    <Text style={styles.prisonerName}>{prisoner.name}</Text>
                    <Text style={styles.prisonerDetail}>Mat: {prisoner.matricula}</Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(prisoner)}
                    >
                      <Text style={{ color: "#fff" }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => handleRemovePrisoner(prisoner)}
                    >
                      <Text style={styles.delText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          // PAVILHÕES
          currentPavilion.map((cell, cellIndex) => (
            <View key={cell.id} style={styles.cellCardNew}>
              <View style={styles.cellHeaderNew}>
                <Text style={styles.cellTitleNew}>Cela {cell.id}</Text>
                <Text style={styles.cellCount}>{cell.prisoners.length} presos</Text>
              </View>

              {cell.prisoners.map((prisoner) => (
                <View key={prisoner.id} style={styles.card}>
                  {prisoner.photo ? (
                    <Image source={{ uri: prisoner.photo }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text>?</Text>
                    </View>
                  )}

                  <View style={styles.prisonerInfo}>
                    <Text style={styles.prisonerName}>{prisoner.name}</Text>
                    <Text style={styles.prisonerDetail}>Mat: {prisoner.matricula}</Text>
                    <Text style={styles.prisonerDetail}>
                      Entrada: {formatDate(prisoner.entryDate)}
                    </Text>
                    <View style={styles.badges}>
                      {prisoner.hasTV && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>📺</Text>
                        </View>
                      )}
                      {prisoner.hasRadio && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>📻</Text>
                        </View>
                      )}
                      {prisoner.hasFan && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>🌀</Text>
                        </View>
                      )}
                      {prisoner.hasMattress && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>🛏️</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(prisoner)}
                    >
                      <Text style={{ color: "#fff" }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => handleRemovePrisoner(prisoner)}
                    >
                      <Text style={styles.delText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addPrisonerBtn}
                onPress={() => openAddModal(activeTab, cellIndex)}
              >
                <Text style={styles.addPrisonerText}>
                  + Adicionar preso na Cela {cell.id}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* ============================================ */}
      {/* MODAL: ADICIONAR PRESO */}
      {/* ============================================ */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>➕ Adicionar Preso</Text>
            <Text style={{ textAlign: "center", color: "#6b7280", marginBottom: 15 }}>
              {isHospital
                ? "Hospital"
                : `Pav. ${selectedPavilion}, Cela ${
                    selectedCell !== null ? selectedCell + 1 : "?"
                  }`}
            </Text>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Nome"
                value={newPrisoner.name}
                onChangeText={(t) => setNewPrisoner({ ...newPrisoner, name: t })}
              />

              <TextInput
                style={styles.input}
                placeholder="Matrícula"
                value={newPrisoner.matricula}
                onChangeText={(t) => setNewPrisoner({ ...newPrisoner, matricula: t })}
              />

              <TouchableOpacity
                style={styles.photoBtn}
                onPress={async () => {
                  const uri = await takePhoto();
                  if (uri) setNewPrisoner({ ...newPrisoner, photo: uri });
                }}
                disabled={uploading}
              >
                <Text style={styles.photoBtnText}>
                  {newPrisoner.photo ? "📷 Alterar" : "📷 Adicionar Foto"}
                </Text>
              </TouchableOpacity>

              {newPrisoner.photo && (
                <Image source={{ uri: newPrisoner.photo }} style={styles.photoPreview} />
              )}

              {!isHospital && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Data de Entrada (AAAA-MM-DD)"
                    value={newPrisoner.entryDate}
                    onChangeText={(t) => setNewPrisoner({ ...newPrisoner, entryDate: t })}
                  />

                  <View style={styles.checkboxes}>
                    {[
                      { key: "hasTV", label: "📺 TV" },
                      { key: "hasRadio", label: "📻 Rádio" },
                      { key: "hasFan", label: "🌀 Ventilador" },
                      { key: "hasMattress", label: "🛏️ Colchão" },
                    ].map(({ key, label }) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.checkItem}
                        onPress={() =>
                          setNewPrisoner({
                            ...newPrisoner,
                            [key]: !newPrisoner[key as keyof typeof newPrisoner],
                          })
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
                    name: "",
                    matricula: "",
                    photo: "",
                    hasTV: false,
                    hasRadio: false,
                    hasFan: false,
                    hasMattress: false,
                    entryDate: new Date().toISOString().split("T")[0],
                  });
                }}
                disabled={uploading}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn2}
                onPress={handleAddPrisoner}
                disabled={uploading}
              >
                <Text style={styles.btnText}>
                  {uploading ? "Salvando..." : "Adicionar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================ */}
      {/* MODAL: EDITAR PRESO */}
      {/* ============================================ */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
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
                value={editingPrisoner?.name || ""}
                onChangeText={(t) => setEditingPrisoner({ ...editingPrisoner, name: t })}
              />

              <TextInput
                style={styles.input}
                placeholder="Matrícula"
                value={editingPrisoner?.matricula || ""}
                onChangeText={(t) =>
                  setEditingPrisoner({ ...editingPrisoner, matricula: t })
                }
              />

              <TouchableOpacity
                style={styles.photoBtn}
                onPress={async () => {
                  const uri = await takePhoto();
                  if (uri) setEditingPrisoner({ ...editingPrisoner, photo: uri });
                }}
                disabled={uploading}
              >
                <Text style={styles.photoBtnText}>
                  {editingPrisoner?.photo ? "📷 Alterar" : "📷 Adicionar Foto"}
                </Text>
              </TouchableOpacity>

              {editingPrisoner?.photo && (
                <Image
                  source={{ uri: editingPrisoner.photo }}
                  style={styles.photoPreview}
                />
              )}

              {!editingLocation?.isHospital && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Data (AAAA-MM-DD)"
                    value={editingPrisoner?.entryDate || ""}
                    onChangeText={(t) =>
                      setEditingPrisoner({ ...editingPrisoner, entryDate: t })
                    }
                  />

                  <View style={styles.checkboxes}>
                    {[
                      { key: "hasTV", label: "📺 TV" },
                      { key: "hasRadio", label: "📻 Rádio" },
                      { key: "hasFan", label: "🌀 Ventilador" },
                      { key: "hasMattress", label: "🛏️ Colchão" },
                    ].map(({ key, label }) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.checkItem}
                        onPress={() =>
                          setEditingPrisoner({
                            ...editingPrisoner,
                            [key]: !editingPrisoner[key],
                          })
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
                disabled={uploading}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn2}
                onPress={handleEditPrisoner}
                disabled={uploading}
              >
                <Text style={styles.btnText}>
                  {uploading ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}