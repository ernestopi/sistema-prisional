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
import { listarPresos, listarPresosPorPresidio } from "../services/prisonerService";
import { salvarConferencia } from "../services/conferenceService";
import styles from "./styles";
import { Ionicons } from '@expo/vector-icons';

export default function Lista() {
  const router = useRouter();
  const { user, userData } = useAuth();

  // ============================================
  // ESTADOS
  // ============================================
  const [prisoners, setPrisoners] = useState<any[]>([]);
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
    if (user && userData) {
      loadData();
    }
  }, [user, userData]); // ✅ Adicionar userData como dependência

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let allPrisoners;
      
      // Filtro por presídio: se usuário tem presidioId, filtra apenas seu presídio
      if (userData?.presidioId) {
        allPrisoners = await listarPresosPorPresidio(userData.presidioId);
      } else {
        // Admin sem presidioId vê todos
        allPrisoners = await listarPresos();
      }
      
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
  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não informada";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return dateString; // Retorna a string original se não conseguir formatar
    }
  };

  // ✅ FUNÇÃO CORRIGIDA - compatível com campos em português e inglês
  const getLocation = (prisoner: any): string => {
    // Verifica se está hospitalizado
    if (prisoner.isHospital || prisoner.situacao === "Hospitalizado") {
      return "Hospital";
    }
    
    // Tenta pegar tanto em inglês quanto português
    const pav = prisoner.pavilhao || prisoner.pavilion || "?";
    const cela = prisoner.cela || prisoner.cellId || "?";
    return `Pav. ${pav} - Cela ${cela}`;
  };

  const filterPrisoners = (): any[] => {
    if (!searchQuery.trim()) return prisoners;

    const q = searchQuery.toLowerCase();
    return prisoners.filter((p) => {
      // Suporta tanto 'name' quanto 'nome'
      const name = (p.nome || p.name || "").toLowerCase();
      const matricula = (p.matricula || "").toLowerCase();
      const location = getLocation(p).toLowerCase();

      if (searchType === "name") return name.includes(q);
      if (searchType === "matricula") return matricula.includes(q);
      if (searchType === "cell") return location.includes(q);
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
      await salvarConferencia({
        observacao: `Conferência realizada por ${user.displayName || user.email}`,
        presidioId: "default", // ou pegar do userData se disponível
        totalConferidos: checked,
        totalPresos: total,
        usuarioId: user.uid,
      });

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
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.circleBackButton} onPress={() => router.push("/menu")}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Lista</Text>
          <Text style={styles.headerSub}>Total: {prisoners.length}</Text>
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
              <Text style={styles.confBtnText}>
                {conferenciaMode ? "❌ Cancelar" : "✅ Iniciar Conferência"}
              </Text>
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

              {/* FOTO CORRIGIDA - suporta 'foto' e 'photo' */}
              {(p.foto || p.photo) ? (
                <Image 
                  source={{ uri: p.foto || p.photo }} 
                  style={styles.photo} 
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text>?</Text>
                </View>
              )}

              {/* Informações do preso */}
              <View style={styles.prisonerInfo}>
                {/* NOME CORRIGIDO - suporta 'nome' e 'name' */}
                <Text style={styles.prisonerName}>
                  {p.nome || p.name || "Sem nome"}
                </Text>
                
                <Text style={styles.prisonerDetail}>
                  Mat: {p.matricula || "N/A"}
                </Text>
                
                <Text style={styles.location}>{getLocation(p)}</Text>
                
                {/* DATA CORRIGIDA - só mostra se não for hospital */}
                {!(p.isHospital || p.situacao === "Hospitalizado") && p.entryDate && (
                  <Text style={styles.prisonerDetail}>
                    Entrada: {formatDate(p.entryDate)}
                  </Text>
                )}

                {/* DIA DE VISITA */}
                {p.diaVisita && (
                  <Text style={[styles.prisonerDetail, { color: "#3b82f6", fontWeight: "600" }]}>
                    📅 Visita: {p.diaVisita}
                  </Text>
                )}
                
                {/* BADGES CORRIGIDOS - suporta campos em português e inglês */}
                {!(p.isHospital || p.situacao === "Hospitalizado") && (
                  <View style={styles.badges}>
                    {(p.tv || p.hasTV) && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>📺</Text>
                      </View>
                    )}
                    {(p.radio || p.hasRadio) && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>📻</Text>
                      </View>
                    )}
                    {(p.ventilador || p.hasFan) && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>🌀</Text>
                      </View>
                    )}
                    {(p.colchao || p.hasMattress) && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>🛏️</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}