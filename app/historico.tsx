// ============================================
// TELA DE HISTÓRICO COM FIREBASE
// historico.tsx - Sistema Prisional
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
  getAllConferences,
  deleteConference,
  clearAllConferences,
  Conference,
} from "../services/conferenceService";
import styles from "./styles";
import { Ionicons } from '@expo/vector-icons';

export default function Historico() {
  const router = useRouter();
  const { user } = useAuth();

  // ============================================
  // ESTADOS
  // ============================================
  const [conferencias, setConferencias] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      const conferences = await getAllConferences(user.uid);
      setConferencias(conferences);
    } catch (error: any) {
      console.error("Erro ao carregar histórico:", error);
      Alert.alert("Erro", error.message || "Não foi possível carregar o histórico");
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
  // FUNÇÃO: Limpar histórico
  // ============================================
  const handleClearHistory = () => {
    if (!user) return;

    Alert.alert(
      "Limpar histórico",
      "Tem certeza que deseja apagar todo o histórico de conferências? Esta ação não pode ser desfeita!",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllConferences(user.uid);
              setConferencias([]);
              Alert.alert("Sucesso", "Histórico apagado!");
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível apagar o histórico");
            }
          },
        },
      ]
    );
  };

  // ============================================
  // FUNÇÃO: Deletar conferência individual
  // ============================================
  const handleDeleteConference = (conference: Conference) => {
    Alert.alert(
      "Remover conferência",
      `Deseja remover a conferência de ${formatDate(conference.date)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConference(conference.id);
              Alert.alert("Sucesso", "Conferência removida!");
              loadData();
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível remover");
            }
          },
        },
      ]
    );
  };

  // ============================================
  // FUNÇÃO: Formatar data
  // ============================================
  const formatDate = (timestamp: any) => {
    try {
      // Converter Firestore Timestamp para Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
  // FUNÇÃO: Gerar PDF
  // ============================================
  const generatePDF = async () => {
    try {
      const prisonersToExport = searchQuery ? filterPrisoners() : prisoners;
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString("pt-BR");
      const timeStr = currentDate.toLocaleTimeString("pt-BR");

      const total = prisonersToExport.length;
      const conferidos = conferenciaMode ? conferenciaChecked.length : 0;
      const faltantes = conferenciaMode ? total - conferidos : 0;

      // Agrupa presos por localização
      const groupedByLocation = prisonersToExport.reduce((acc, p) => {
        const location = getLocation(p);
        if (!acc[location]) acc[location] = [];
        acc[location].push(p);
        return acc;
      }, {} as { [key: string]: Prisoner[] });

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { color: #1e3a8a; margin: 0 0 10px 0; font-size: 24px; }
            .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .stats { display: flex; justify-content: space-around; background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .stat-box { text-align: center; }
            .stat-label { color: #6b7280; font-size: 11px; margin-bottom: 5px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            .location-group { margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
            .location-header { background: #1e3a8a; color: white; padding: 10px 15px; font-weight: bold; font-size: 14px; }
            .prisoner { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
            .prisoner:last-child { border-bottom: none; }
            .prisoner-info { flex: 1; }
            .prisoner-name { font-weight: bold; color: #1f2937; margin-bottom: 4px; }
            .prisoner-detail { color: #6b7280; font-size: 11px; margin-bottom: 2px; }
            .badges { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }
            .badge { background: #e9d5ff; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
            .checkbox { width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; }
            .checked { background: #16a34a; border-color: #16a34a; color: white; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 SISTEMA PRISIONAL</h1>
            <div style="font-size: 14px; color: #6b7280;">
              Relatório de ${conferenciaMode ? "Conferência" : "Lista"}
            </div>
          </div>
          
          <div class="info">
            <div class="info-row"><strong>📅 Data:</strong> ${dateStr}</div>
            <div class="info-row"><strong>🕐 Horário:</strong> ${timeStr}</div>
            <div class="info-row"><strong>👤 Responsável:</strong> ${
              user?.displayName || user?.email || "Usuário"
            }</div>
            ${
              searchQuery
                ? `<div class="info-row"><strong>🔍 Filtro:</strong> ${searchQuery}</div>`
                : ""
            }
          </div>
          
          ${
            conferenciaMode
              ? `
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total de Presos</div>
              <div class="stat-value">${total}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Conferidos</div>
              <div class="stat-value" style="color: #16a34a;">${conferidos}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Faltantes</div>
              <div class="stat-value" style="color: #ef4444;">${faltantes}</div>
            </div>
          </div>
          `
              : `
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total de Presos</div>
              <div class="stat-value">${total}</div>
            </div>
          </div>
          `
          }
          
          ${Object.entries(groupedByLocation)
            .map(
              ([location, prisionersList]) => `
            <div class="location-group">
              <div class="location-header">
                ${location} (${prisionersList.length} ${
                prisionersList.length === 1 ? "preso" : "presos"
              })
              </div>
              ${prisionersList
                .map(
                  (p) => `
                <div class="prisoner">
                  ${
                    conferenciaMode
                      ? `
                    <span class="checkbox ${
                      conferenciaChecked.includes(p.id) ? "checked" : ""
                    }">
                      ${conferenciaChecked.includes(p.id) ? "✓" : ""}
                    </span>
                  `
                      : ""
                  }
                  <div class="prisoner-info">
                    <div class="prisoner-name">${p.name}</div>
                    <div class="prisoner-detail">Matrícula: ${p.matricula}</div>
                    ${
                      !p.isHospital
                        ? `
                      <div class="prisoner-detail">Entrada: ${formatDate(
                        p.entryDate
                      )}</div>
                      <div class="badges">
                        ${p.hasTV ? '<span class="badge">📺 TV</span>' : ""}
                        ${p.hasRadio ? '<span class="badge">📻 Rádio</span>' : ""}
                        ${p.hasFan ? '<span class="badge">🌀 Ventilador</span>' : ""}
                        ${p.hasMattress ? '<span class="badge">🛏️ Colchão</span>' : ""}
                      </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
          
          <div class="footer">
            Documento gerado pelo Sistema Prisional em ${dateStr} às ${timeStr}<br>
            ☁️ Dados sincronizados com Firebase
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === "ios") {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("PDF Gerado", "Deseja visualizar ou compartilhar?", [
          { text: "Visualizar", onPress: () => Print.printAsync({ uri }) },
          { text: "Compartilhar", onPress: () => Sharing.shareAsync(uri) },
          { text: "Cancelar", style: "cancel" },
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

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
          <Text style={styles.headerTitle}>Histórico</Text>
          <Text style={styles.headerSub}>{conferencias.length} registros</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/login")}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO */}
      <ScrollView style={styles.content}>
        
        {/* Botão de atualizar */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: "#2563eb", marginBottom: 5 }]}
          onPress={handleRefresh}
          disabled={refreshing}>

          {/* Botão de gerar PDF */}
          <Text style={styles.addButtonText}>
            {refreshing ? "Atualizando..." : "🔄 Atualizar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.printBtn} onPress={generatePDF}>
          <Text style={styles.printBtnText}>🖨️ Gerar PDF</Text>
        </TouchableOpacity>

        {conferencias.length === 0 ? (
          // Mensagem quando não há histórico
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 50, marginBottom: 20 }}>📊</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: 10,
              }}
            >
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}>
              As conferências realizadas aparecerão aqui
            </Text>
          </View>
        ) : (
          // Lista de conferências
          conferencias.map((conf) => (
            <View key={conf.id} style={styles.historyCard}>
              {/* Data e hora */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.historyTitle}>📅 {formatDate(conf.date)}</Text>
                <TouchableOpacity onPress={() => handleDeleteConference(conf)}>
                  <Text style={{ color: "#ef4444", fontSize: 20 }}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {/* Responsável */}
              <Text style={styles.historyDate}>
                👤 Responsável: {conf.userName || conf.user || "Não informado"}
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
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#16a34a" }}>
                    {conf.checkedCount || 0}
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 5 }}>
                    Faltantes
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#ef4444" }}>
                    {conf.missingCount || 0}
                  </Text>
                </View>
              </View>

              {/* Porcentagem de conferidos */}
              <View
                style={{
                  marginTop: 15,
                  paddingTop: 15,
                  borderTopWidth: 1,
                  borderTopColor: "#e5e7eb",
                }}
              >
                <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 5 }}>
                  Taxa de conferência
                </Text>
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#e5e7eb",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${
                        conf.totalPrisoners > 0
                          ? (conf.checkedCount / conf.totalPrisoners) * 100
                          : 0
                      }%`,
                      backgroundColor: "#16a34a",
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 5,
                    textAlign: "right",
                  }}
                >
                  {conf.totalPrisoners > 0
                    ? Math.round((conf.checkedCount / conf.totalPrisoners) * 100)
                    : 0}
                  %
                </Text>
              </View>
            </View>
          ))
        )}

        {/* BOTÕES */}
        {conferencias.length > 0 && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#dc2626", marginTop: 10 }]}
            onPress={handleClearHistory}
          >
            <Text style={styles.addButtonText}>🗑️ Limpar Todo Histórico</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}