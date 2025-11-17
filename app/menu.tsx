// ============================================
// MENU COM SINCRONIZAÇÃO AUTOMÁTICA
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
import NetInfo from "@react-native-community/netinfo";
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
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

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

  // ============================================
  // MONITORAR CONEXÃO DE REDE
  // ============================================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Carregar estatísticas inicialmente
  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  // ============================================
  // SINCRONIZAÇÃO AUTOMÁTICA A CADA 30 SEGUNDOS
  // ============================================
  useEffect(() => {
    if (!user || !isOnline) return;

    // Sincronizar a cada 30 segundos (apenas se estiver online)
    const syncInterval = setInterval(() => {
      if (isOnline) {
        loadStatistics(true); // true = sincronização silenciosa
      }
    }, 30000); // 30 segundos

    return () => clearInterval(syncInterval);
  }, [user, isOnline]);

  const loadStatistics = async (silent = false) => {
    if (!user) return;

    try {
      if (!silent) {
        setLoading(true);
      }
      
      const prisoners = await getAllPrisoners(user.uid);
      setTotalPrisoners(prisoners.length);
      
      const conferences = await getAllConferences(user.uid);
      setTotalConferences(conferences.length);
      
      setLastSync(new Date());
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas:", error);
      if (!silent) {
        Alert.alert("Atenção", "Não foi possível carregar os dados");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
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

  const formatLastSync = () => {
    if (!lastSync) return "Nunca";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000);
    
    if (diff < 60) return "Agora mesmo";
    if (diff < 120) return "1 minuto atrás";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutos atrás`;
    return lastSync.toLocaleTimeString("pt-BR");
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
          {/* Indicador Online/Offline */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginTop: 4,
            gap: 5,
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isOnline ? '#10b981' : '#ef4444',
            }} />
            <Text style={{ 
              color: isOnline ? '#a7f3d0' : '#fca5a5', 
              fontSize: 11,
              fontWeight: '500',
            }}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
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
          {/* Indicador de Sincronização Automática */}
          <View style={{
            backgroundColor: isOnline ? '#ecfdf5' : '#fef2f2',
            padding: 12,
            borderRadius: 8,
            marginBottom: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: isOnline ? '#10b981' : '#ef4444',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>{isOnline ? '🔄' : '📡'}</Text>
              <View>
                <Text style={{ fontSize: 12, color: isOnline ? '#065f46' : '#7f1d1d', fontWeight: '600' }}>
                  {isOnline ? 'Sincronização Automática' : 'Modo Offline'}
                </Text>
                <Text style={{ fontSize: 10, color: isOnline ? '#059669' : '#dc2626' }}>
                  {isOnline ? `Última: ${formatLastSync()}` : 'Sem conexão com internet'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => loadStatistics()}
              disabled={!isOnline}
              style={{
                backgroundColor: isOnline ? '#10b981' : '#9ca3af',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                {isOnline ? 'Atualizar' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>

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