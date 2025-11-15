// ============================================
// MENU - SEM LOOP
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
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../hooks/useAuth";
import { getAllPrisoners } from "../services/prisonerService";
import { getAllConferences } from "../services/conferenceService";
import styles from "./styles";

export default function MenuFirebase() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [totalPrisoners, setTotalPrisoners] = useState(0);
  const [totalConferences, setTotalConferences] = useState(0);
  const [loading, setLoading] = useState(true);

  // Bloquear botão voltar
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Atenção", "Deseja sair do aplicativo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: () => BackHandler.exitApp() }
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Carregar estatísticas
  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  const loadStatistics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const prisoners = await getAllPrisoners(user.uid);
      setTotalPrisoners(prisoners.length);
      
      const conferences = await getAllConferences(user.uid);
      setTotalConferences(conferences.length);
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas:", error);
      Alert.alert("Atenção", "Não foi possível carregar os dados");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Confirmar", "Deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair", 
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (error: any) {
            Alert.alert("Erro", error.message);
          }
        }
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.menuContainer}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.menuContainer}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={{ fontSize: 24, color: '#fff' }}>🔒</Text>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sistema Prisional</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ marginTop: 10, color: '#64748b' }}>
            Carregando dados...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.menuContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <TouchableOpacity 
            style={styles.menuCard} 
            onPress={() => router.push("/conferencia")}
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuCardTitle}>Adicionar Internos</Text>
            <Text style={styles.menuCardDescription}>
              Cadastrar novos internos no sistema
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuCard} 
            onPress={() => router.push("/lista")}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuCardTitle}>Lista e Conferência</Text>
            <Text style={styles.menuCardDescription}>
              Visualizar e conferir internos cadastrados
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
          
          <TouchableOpacity 
            style={[styles.menuCard, {backgroundColor: '#dbeafe'}]} 
            onPress={loadStatistics}
          >
            <Text style={styles.menuIcon}>🔄</Text>
            <Text style={styles.menuCardTitle}>Sincronizar</Text>
            <Text style={styles.menuCardDescription}>
              Atualizar dados do servidor
            </Text>
          </TouchableOpacity>
          
          <View style={styles.totalBox}>
            <Text style={styles.totalText}>
              Total: {totalPrisoners} internos
            </Text>
            <Text style={{ color: '#bfdbfe', fontSize: 14, marginTop: 5 }}>
              Bem-vindo, {user?.displayName || user?.email}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}