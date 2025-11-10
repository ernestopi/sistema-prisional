// ============================================
// TELA DE CONFERÊNCIA - Sistema Prisional
// Com abas, fotos, checkboxes e todas funcionalidades
// Estilos separados no arquivo styles.ts
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
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import styles from "../styles";

// ============================================
// CONSTANTES
// ============================================
const STORAGE_KEYS = {
  PAVILIONS: "@prison_pavilions",
  HOSPITAL: "@prison_hospital",
};

export default function Conferencia() {
  const router = useRouter();

  // ============================================
  // ESTADOS
  // ============================================
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("A");

  // Estrutura de pavilhões
  const [pavilions, setPavilions] = useState({
    A: Array(20).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
    B: Array(20).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
    Triagem: Array(8).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
    SAT: Array(1).fill(null).map((_, i) => ({ id: 1, prisoners: [] })),
  });

  const [hospital, setHospital] = useState([]);

  // Modais e seleção
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedPavilion, setSelectedPavilion] = useState(null);
  const [isHospital, setIsHospital] = useState(false);

  const [editingPrisoner, setEditingPrisoner] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);

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
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // Carrega pavilhões
      const savedPavilions = await AsyncStorage.getItem(STORAGE_KEYS.PAVILIONS);
      if (savedPavilions) setPavilions(JSON.parse(savedPavilions));

      // Carrega hospital
      const savedHospital = await AsyncStorage.getItem(STORAGE_KEYS.HOSPITAL);
      if (savedHospital) setHospital(JSON.parse(savedHospital));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FUNÇÕES DE SALVAMENTO
  // ============================================
  const savePavilions = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PAVILIONS, JSON.stringify(data));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  const saveHospital = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HOSPITAL, JSON.stringify(data));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
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
      return null;
    }
  };

  // ============================================
  // FUNÇÃO: Adicionar preso
  // ============================================
  const handleAddPrisoner = async () => {
    if (!newPrisoner.name.trim() || !newPrisoner.matricula.trim()) {
      Alert.alert("Atenção", "Preencha nome e matrícula");
      return;
    }

    if (isHospital) {
      const newHospital = [...hospital, { id: Date.now(), ...newPrisoner }];
      setHospital(newHospital);
      await saveHospital(newHospital);
    } else {
      const updated = { ...pavilions };
      updated[selectedPavilion][selectedCell].prisoners.push({
        id: Date.now(),
        ...newPrisoner,
      });
      setPavilions(updated);
      await savePavilions(updated);
    }

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
  };

  // ============================================
  // FUNÇÃO: Editar preso
  // ============================================
  const handleEditPrisoner = async () => {
    if (!editingPrisoner.name.trim() || !editingPrisoner.matricula.trim()) {
      Alert.alert("Atenção", "Preencha nome e matrícula");
      return;
    }

    try {
      if (editingLocation.isHospital) {
        const newHospital = hospital.map((p) =>
          p.id === editingLocation.prisonerId ? { ...p, ...editingPrisoner } : p
        );
        setHospital(newHospital);
        await saveHospital(newHospital);
      } else {
        const { pavilion, cellIndex, prisonerId } = editingLocation;
        const updated = { ...pavilions };
        updated[pavilion][cellIndex].prisoners = updated[pavilion][
          cellIndex
        ].prisoners.map((p) =>
          p.id === prisonerId ? { ...p, ...editingPrisoner } : p
        );
        setPavilions(updated);
        await savePavilions(updated);
      }
      Alert.alert("Sucesso", "Atualizado!");
      setShowEditModal(false);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar.");
    }
  };

  // ============================================
  // FUNÇÃO: Remover preso
  // ============================================
  const handleRemovePrisoner = async (pavilion, cellIndex, prisonerId) => {
    Alert.alert("Confirmar", "Remover preso?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          const updated = { ...pavilions };
          updated[pavilion][cellIndex].prisoners = updated[pavilion][
            cellIndex
          ].prisoners.filter((p) => p.id !== prisonerId);
          setPavilions(updated);
          await savePavilions(updated);
        },
      },
    ]);
  };

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================
  const getTotalPrisoners = (pavilion) => {
    return pavilions[pavilion].reduce(
      (sum, cell) => sum + cell.prisoners.length,
      0
    );
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  // ============================================
  // RENDERIZAÇÃO - LOADING
  // ============================================
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutBtnList} onPress={() => router.push("/menu") }>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Lista</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/login")}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* ABAS DE NAVEGAÇÃO */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
      >
        {["A", "B", "Triagem", "SAT", "Hospital"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={styles.tabText}>{tab === "Hospital" ? "Hosp" : tab}</Text>
            <Text style={styles.tabCount}>
              {tab === "Hospital" ? hospital.length : getTotalPrisoners(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTEÚDO */}
      <ScrollView style={styles.content}>
        {activeTab === "Hospital" ? (
          // ABA HOSPITAL
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Hospital</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  setIsHospital(true);
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.addBtnText}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>

            {hospital.map((p) => (
              <View key={p.id} style={styles.card}>
                {p.photo ? (
                  <Image source={{ uri: p.photo }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text>?</Text>
                  </View>
                )}

                <View style={styles.prisonerInfo}>
                  <Text style={styles.prisonerName}>{p.name}</Text>
                  <Text style={styles.prisonerDetail}>Mat: {p.matricula}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingPrisoner(p);
                      setEditingLocation({ isHospital: true, prisonerId: p.id });
                      setShowEditModal(true);
                    }}
                    style={styles.editBtn}
                  >
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("Confirmar", "Remover?", [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Remover",
                          style: "destructive",
                          onPress: async () => {
                            const newH = hospital.filter((x) => x.id !== p.id);
                            setHospital(newH);
                            await saveHospital(newH);
                          },
                        },
                      ]);
                    }}
                    style={styles.delBtn}
                  >
                    <Text style={styles.delText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          // ABAS DE PAVILHÕES
          <View>
            <Text style={styles.sectionTitle}>
              Pavilhão {activeTab} - {getTotalPrisoners(activeTab)} presos
            </Text>

            {pavilions[activeTab].map((cell, idx) => (
              <View key={cell.id} style={styles.cellCardNew}>
                <View style={styles.cellHeaderNew}>
                  <Text style={styles.cellTitleNew}>Cela {cell.id}</Text>
                  <Text style={styles.cellCount}>{cell.prisoners.length}</Text>
                </View>

                {cell.prisoners.map((p) => (
                  <View key={p.id} style={styles.card}>
                    {p.photo ? (
                      <Image source={{ uri: p.photo }} style={styles.photo} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Text>?</Text>
                      </View>
                    )}

                    <View style={styles.prisonerInfo}>
                      <Text style={styles.prisonerName}>{p.name}</Text>
                      <Text style={styles.prisonerDetail}>
                        Mat: {p.matricula}
                      </Text>
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
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingPrisoner(p);
                          setEditingLocation({
                            pavilion: activeTab,
                            cellIndex: idx,
                            prisonerId: p.id,
                          });
                          setShowEditModal(true);
                        }}
                        style={styles.editBtn}
                      >
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleRemovePrisoner(activeTab, idx, p.id)
                        }
                        style={styles.delBtn}
                      >
                        <Text style={styles.delText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addPrisonerBtn}
                  onPress={() => {
                    setSelectedPavilion(activeTab);
                    setSelectedCell(idx);
                    setIsHospital(false);
                    setShowAddModal(true);
                  }}
                >
                  <Text style={styles.addPrisonerText}>+ Adicionar Preso</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
            <Text style={styles.modalTitle}>
              {isHospital
                ? "Hospital"
                : `Pav. ${selectedPavilion}, Cela ${
                    pavilions[selectedPavilion]?.[selectedCell]?.id
                  }`}
            </Text>

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
              onChangeText={(t) =>
                setNewPrisoner({ ...newPrisoner, matricula: t })
              }
            />

            <TouchableOpacity
              style={styles.photoBtn}
              onPress={async () => {
                const uri = await takePhoto();
                if (uri) setNewPrisoner({ ...newPrisoner, photo: uri });
              }}
            >
              <Text style={styles.photoBtnText}>
                {newPrisoner.photo ? "📷 Alterar" : "📷 Adicionar"}
              </Text>
            </TouchableOpacity>

            {newPrisoner.photo && (
              <Image
                source={{ uri: newPrisoner.photo }}
                style={styles.photoPreview}
              />
            )}

            {!isHospital && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Data (AAAA-MM-DD)"
                  value={newPrisoner.entryDate}
                  onChangeText={(t) =>
                    setNewPrisoner({ ...newPrisoner, entryDate: t })
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
                        setNewPrisoner({
                          ...newPrisoner,
                          [key]: !newPrisoner[key],
                        })
                      }
                    >
                      <View
                        style={[
                          styles.checkBox,
                          newPrisoner[key] && styles.checkBoxActive,
                        ]}
                      >
                        {newPrisoner[key] && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                      <Text style={styles.checkLabel}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

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

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={editingPrisoner?.name || ""}
              onChangeText={(t) =>
                setEditingPrisoner({ ...editingPrisoner, name: t })
              }
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
                if (uri)
                  setEditingPrisoner({ ...editingPrisoner, photo: uri });
              }}
            >
              <Text style={styles.photoBtnText}>
                {editingPrisoner?.photo ? "📷 Alterar" : "📷 Adicionar"}
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
