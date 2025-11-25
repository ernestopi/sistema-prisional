// ============================================
// TELA DE CONFERÊNCIA COM FIREBASE - Sistema Prisional
// app/conferencia/index.tsx - COM FILTRO POR PRESÍDIO
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
  listarPresosPorPresidio,
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
  A: 30,  // ✅ Aumentado de 20 para 30
  B: 30,  // ✅ Aumentado de 20 para 30
  Triagem: 10,  // ✅ Aumentado de 8 para 10
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
// HELPER - Abrir modal add
// ============================================
function openAddModal(
  pavilion?: string,
  cellIndex?: number,
  isHospital?: boolean
) {
  // Esta função precisa estar disponível no escopo do componente
  // Será definida dentro do componente
}

function openEditModal(preso: Preso) {
  // Esta função precisa estar disponível no escopo do componente
  // Será definida dentro do componente
}

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

  // ✅ NOVOS ESTADOS PARA DIA DE VISITA
  const [diaSemana, setDiaSemana] = useState<string>("");
  const [turnoVisita, setTurnoVisita] = useState<string>("");

  // ✅ DIAS DA SEMANA
  const diasSemana = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo"
  ];

  const turnos = ["Manhã", "Tarde"];

  // ============================================
  // CARREGAMENTO INICIAL
  // ============================================

  useEffect(() => {
    if (user && userData) {
      loadAllData();
    }
  }, [user, userData]);

  const loadAllData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // ✅ FILTRO POR PRESÍDIO
      let allPresos: Preso[];
      if (userData?.presidioId) {
        allPresos = await listarPresosPorPresidio(userData.presidioId);
      } else {
        allPresos = await listarPresos();
      }

      // ✅ DESCOBRIR O NÚMERO MÁXIMO DE CELAS DINAMICAMENTE
      const maxCells = {
        A: 20,
        B: 20,
        Triagem: 8,
        SAT: 1,
      };

      // Percorre todos os presos para encontrar o número máximo de celas
      allPresos.forEach((preso) => {
        if (preso.situacao === "Hospitalizado") return;
        
        const pavRaw = (preso.pavilhao || "").toString().toUpperCase();
        let pavKey = pavRaw;

        if (pavRaw === "A" || pavRaw === "B" || pavRaw === "TRIAGEM" || pavRaw === "SAT") {
          const celaNum = preso.cela ? parseInt(preso.cela, 10) : 0;
          
          // Atualiza o máximo se encontrar uma cela maior
          if (celaNum > maxCells[pavKey]) {
            maxCells[pavKey] = celaNum;
          }
        }
      });

      // ✅ CRIAR PAVILHÕES COM O NÚMERO CORRETO DE CELAS
      const newPavilions: any = {
        A: Array(maxCells.A)
          .fill(null)
          .map((_, i) => ({ id: i + 1, prisoners: [] })),
        B: Array(maxCells.B)
          .fill(null)
          .map((_, i) => ({ id: i + 1, prisoners: [] })),
        Triagem: Array(maxCells.Triagem)
          .fill(null)
          .map((_, i) => ({ id: i + 1, prisoners: [] })),
        SAT: Array(maxCells.SAT)
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
      console.error("Erro ao carregar dados:", err);
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
  // FUNÇÕES DE MODAL
  // ============================================

  const handleOpenAddModal = (
    pavilion?: string,
    cellIndex?: number,
    isHospital?: boolean
  ) => {
    if (isHospital) {
      setSelectedPavilion(null);
      setSelectedCell(null);
      setNewPrisoner((prev) => ({ ...prev, situacao: "Hospitalizado" }));
    } else if (pavilion !== undefined && cellIndex !== undefined) {
      setSelectedPavilion(pavilion);
      setSelectedCell(cellIndex);
      setNewPrisoner((prev) => ({ ...prev, situacao: "Triagem" }));
    }
    setShowAddModal(true);
  };

  const handleOpenEditModal = (preso: Preso) => {
    setEditingPrisoner(preso);
    setShowEditModal(true);
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

      // ✅ COMBINAR DIA + TURNO
      const diaVisitaCompleto = diaSemana && turnoVisita 
        ? `${diaSemana} - ${turnoVisita}`
        : newPrisoner.diaVisita;

      const data: any = {
        ...newPrisoner,
        foto: fotoUrl,
        diaVisita: diaVisitaCompleto,
        presidioId: userData?.presidioId || "",
        presidioNome: userData?.presidioNome || "",
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
      setDiaSemana("");
      setTurnoVisita("");

      loadAllData();
    } catch (err) {
      console.error("Erro ao adicionar:", err);
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
    } catch (err) {
      console.error("Erro ao editar:", err);
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
          } catch (err) {
            console.error("Erro ao remover:", err);
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

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
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
                onPress={() => handleOpenAddModal(undefined, undefined, true)}
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
                    {preso.diaVisita && (
                      <Text style={[styles.prisonerDetail, { color: "#3b82f6", fontWeight: "600" }]}>
                        📅 Visita: {preso.diaVisita}
                      </Text>
                    )}
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleOpenEditModal(preso)}
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

                    {preso.diaVisita && (
                      <Text style={[styles.prisonerDetail, { color: "#3b82f6", fontWeight: "600" }]}>
                        📅 Visita: {preso.diaVisita}
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
                      onPress={() => handleOpenEditModal(preso)}
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
                  handleOpenAddModal(
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

                  {/* ✅ SELETOR DE DIA DA SEMANA */}
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b", marginBottom: 8 }}>
                    Dia de Visita:
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 15 }}
                  >
                    {diasSemana.map((dia) => (
                      <TouchableOpacity
                        key={dia}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: diaSemana === dia ? "#3b82f6" : "#f1f5f9",
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: diaSemana === dia ? "#3b82f6" : "#cbd5e1",
                        }}
                        onPress={() => setDiaSemana(dia)}
                      >
                        <Text style={{
                          color: diaSemana === dia ? "#fff" : "#475569",
                          fontWeight: diaSemana === dia ? "bold" : "normal",
                          fontSize: 13,
                        }}>
                          {dia}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* ✅ SELETOR DE TURNO */}
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b", marginBottom: 8 }}>
                    Turno:
                  </Text>
                  
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                    {turnos.map((turno) => (
                      <TouchableOpacity
                        key={turno}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: 8,
                          backgroundColor: turnoVisita === turno ? "#10b981" : "#f1f5f9",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: turnoVisita === turno ? "#10b981" : "#cbd5e1",
                        }}
                        onPress={() => setTurnoVisita(turno)}
                      >
                        <Text style={{
                          color: turnoVisita === turno ? "#fff" : "#475569",
                          fontWeight: turnoVisita === turno ? "bold" : "normal",
                          fontSize: 15,
                        }}>
                          {turno === "Manhã" ? "☀️ Manhã" : "🌙 Tarde"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* ✅ PREVIEW DO DIA SELECIONADO */}
                  {diaSemana && turnoVisita && (
                    <View style={{
                      backgroundColor: "#eff6ff",
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 15,
                      borderWidth: 1,
                      borderColor: "#bfdbfe",
                    }}>
                      <Text style={{ color: "#1e40af", fontSize: 13, fontWeight: "600" }}>
                        📅 Dia de Visita Selecionado:
                      </Text>
                      <Text style={{ color: "#3b82f6", fontSize: 15, fontWeight: "bold", marginTop: 4 }}>
                        {diaSemana} - {turnoVisita}
                      </Text>
                    </View>
                  )}

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
                  setDiaSemana("");
                  setTurnoVisita("");
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