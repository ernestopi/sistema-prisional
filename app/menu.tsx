// ============================================
// MENU COM FILTRO POR PRESÍDIO
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

import { listarPresos, listarPresosPorPresidio } from "../services/prisonerService";
import { listarConferencias } from "../services/conferenceService";

import styles from "./styles";

export default function MenuFirebase() {
  const router = useRouter();
  const { user, userData, logout } = useAuth();

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
    if (user && userData) {
      loadStatistics();
    }
  }, [user, userData]);

  // Sincronização automática
  useEffect(() => {
    if (!user || !isOnline || !userData) return;

    const interval = setInterval(() => {
      loadStatistics(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, userData, isOnline]);

  const loadStatistics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // ✅ FILTRO POR PRESÍDIO
      let presos;
      if (userData?.presidioId) {
        presos = await listarPresosPorPresidio(userData.presidioId);
      } else {
        presos = await listarPresos();
      }
      setTotalPrisoners(presos.length);

      // Conferências do usuário
      const confs = await listarConferencias(user.uid);
      setTotalConferences(confs.length);

      setLastSync(new Date());
    } catch (error) {
      if (!silent) {
        console.error("Erro ao carregar estatísticas:", error);
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
          {userData?.presidioNome && (
            <Text style={[styles.headerSub, { fontSize: 11 }]}>
              {userData.presidioNome}
            </Text>
          )}
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
            
            {userData?.role && (
              <Text style={{ color: "#93c5fd", fontSize: 12, marginTop: 2 }}>
                Perfil: {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}