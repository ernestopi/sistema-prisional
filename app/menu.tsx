// ============================================
// MENU COM CABEÇALHO FINO E MINIMALISTA
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

  // Carrega estatísticas ao abrir o menu
  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Buscar total de presos
      const prisoners = await getAllPrisoners(user!.uid);
      setTotalPrisoners(prisoners.length);
      
      // Buscar total de conferências
      const conferences = await getAllConferences(user!.uid);
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

  const clearAllData = async () => {
    Alert.alert(
      "Confirmar", 
      "Apagar todos os dados do Firebase? Esta ação não pode ser desfeita!", 
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar", 
          style: "destructive", 
          onPress: async () => {
            try {
              Alert.alert("Atenção", "Função de limpeza não implementada por segurança");
              setTotalPrisoners(0);
              setTotalConferences(0);
            } catch (error: any) {
              Alert.alert("Erro", error.message);
            }
          }
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.menuContainer}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Usuário não autenticado</Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.loginButtonText}>Fazer Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.menuContainer}>
      <StatusBar style="light" />
      
      {/* CABEÇALHO FINO E MINIMALISTA */}
      <View style={styles.header}>
        {/* Esquerda - Logo/Ícone */}
        <View style={styles.headerLeft}>
          <Text style={{ fontSize: 24, color: '#fff' }}>🔒</Text>
        </View>

        {/* Centro - Título */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sistema Prisional</Text>
        </View>

        {/* Direita - Botão Sair */}
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
          {/* Card: Adicionar Preso */}
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
          
          {/* Card: Lista e Conferência */}
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
          
          {/* Card: Histórico */}
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
          
          {/* Card: Sincronizar */}
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
          
         {/* Box com estatísticas */}
          <View style={styles.totalBox}>
            <Text style={styles.totalText}>
              Total: {totalPrisoners} internos
            </Text>
            <Text style={{ color: '#bfdbfe', fontSize: 14, marginTop: 5 }}>
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}