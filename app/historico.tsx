// ============================================
// TELA DE HISTÓRICO - Sistema Prisional
// Exibe histórico de conferências realizadas
// ============================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import styles from "./styles";

// ============================================
// CONSTANTES
// ============================================
const STORAGE_KEYS = {
  CONFERENCIAS: "@prison_conferencias",
};

export default function Historico() {
  const router = useRouter();

  // ============================================
  // ESTADOS
  // ============================================
  const [conferencias, setConferencias] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================
  // CARREGAMENTO INICIAL
  // ============================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONFERENCIAS);
      if (data) setConferencias(JSON.parse(data));
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNÇÃO: Limpar histórico
  // ============================================
  const handleClearHistory = () => {
    Alert.alert(
      "Limpar histórico",
      "Tem certeza que deseja apagar todo o histórico de conferências?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEYS.CONFERENCIAS);
              setConferencias([]);
              Alert.alert("Sucesso", "Histórico apagado!");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível apagar o histórico.");
            }
          },
        },
      ]
    );
  };

  // ============================================
  // FUNÇÃO: Formatar data
  // ============================================
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR");
    } catch {
      return "Data inválida";
    }
  };

  // ============================================
  // RENDERIZAÇÃO - LOADING
  // ============================================
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
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
        <TouchableOpacity style={styles.logoutBtnList} onPress={() => router.push("/menu")}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/login")}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO */}
      <ScrollView style={styles.content}>
        {conferencias.length === 0 ? (
          // Mensagem quando não há histórico
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 50, marginBottom: 20 }}>📊</Text>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 10 }}>
              Nenhuma conferência salva
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}>
              As conferências realizadas aparecerão aqui
            </Text>
          </View>
        ) : (
          // Lista de conferências
          conferencias.map((conf, index) => (
            <View key={conf.id || index} style={styles.historyCard}>
              {/* Data e hora */}
              <Text style={styles.historyTitle}>
                📅 {formatDate(conf.date)}
              </Text>

              {/* Responsável */}
              <Text style={styles.historyDate}>
                👤 Responsável: {conf.user || "Não informado"}
              </Text>

              {/* Estatísticas */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginTop: 15,
                  paddingTop: 15,
                  borderTopWidth: 1,
                  borderTopColor: "#e5e7eb",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 5 }}>
                    Total
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1f2937" }}>
                    {conf.totalPrisoners || 0}
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 5 }}>
                    Conferidos
                  </Text>
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "#16a34a" }}
                  >
                    {conf.checkedCount || 0}
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 5 }}>
                    Faltantes
                  </Text>
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "#ef4444" }}
                  >
                    {conf.missingCount || 0}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* BOTÕES */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/menu")}
        >
          <Text style={styles.backButtonText}>← Voltar ao Menu</Text>
        </TouchableOpacity>

        {conferencias.length > 0 && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#dc2626", marginTop: 10 }]}
            onPress={handleClearHistory}
          >
            <Text style={styles.addButtonText}>🗑️ Limpar Histórico</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
