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
import { getAllPrisoners, Prisoner } from "../services/prisonerService";
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
      const allPrisoners = await getAllPrisoners(user.uid);
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