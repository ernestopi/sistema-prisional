// ============================================
// HISTÓRICO COM FILTRO POR PRESÍDIO
// app/historico.tsx
// ============================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";

import {
  listarConferencias,
  deletarConferencia,
  limparConferenciasDoUsuario
} from "../services/conferenceService";

import { listarPresos, listarPresosPorPresidio } from "../services/prisonerService";

import styles from "./styles";
import { Ionicons } from '@expo/vector-icons';

export default function Historico() {
  const router = useRouter();
  const { user, userData } = useAuth();

  const [conferencias, setConferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // CARREGAR DADOS COM FILTRO POR PRESÍDIO
  // ============================================
  useEffect(() => {
    if (user && userData) {
      loadData();
    }
  }, [user, userData]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Conferências do usuário
      const conferences = await listarConferencias(user.uid);
      setConferencias(conferences);
      
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
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
            } catch (err) {
              console.error("Erro ao limpar:", err);
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
  const handleDeleteConference = async (conf: any) => {
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
              loadData();
            } catch (err) {
              console.error("Erro ao deletar:", err);
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR");
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
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.circleBackButton} 
            onPress={() => router.push("/menu")}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Histórico</Text>
          <Text style={styles.headerSub}>{conferencias.length} registros</Text>
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

      {/* Conteúdo */}
      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: "#2563eb", marginBottom: 15 }]}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.addButtonText}>
            {refreshing ? "Atualizando..." : "🔄 Atualizar"}
          </Text>
        </TouchableOpacity>

        {conferencias.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 50, marginBottom: 20 }}>📊</Text>
            <Text style={{ fontSize: 16, color: "#6b7280", textAlign: "center" }}>
              Nenhuma conferência registrada
            </Text>
          </View>
        ) : (
          <>
            {conferencias.map((conf: any) => (
              <View key={conf.id} style={styles.historyCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={styles.historyTitle}>
                    Conferência #{conf.id.substring(0, 8)}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteConference(conf)}>
                    <Text style={{ color: "#ef4444", fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.historyDate}>
                  {formatDate(conf.data)}
                </Text>

                <View style={{ marginTop: 10, gap: 5 }}>
                  <Text style={{ color: "#475569" }}>
                    Total de presos: {conf.totalPresos || 0}
                  </Text>
                  <Text style={{ color: "#059669" }}>
                    ✓ Conferidos: {conf.totalConferidos || 0}
                  </Text>
                  {conf.observacao && (
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 5 }}>
                      {conf.observacao}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: "#dc2626", marginTop: 20 }]}
              onPress={handleClearHistory}
            >
              <Text style={styles.addButtonText}>🗑️ Limpar Todo Histórico</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}