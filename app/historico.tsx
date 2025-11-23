// ============================================
// TELA DE HISTÃ“RICO COM FIREBASE E PDF
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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  getAllConferences,
  deleteConference,
  clearAllConferences,
  Conference,
} from "../services/conferenceService";
import { getAllPrisoners, Prisoner } from "../services/prisonerService";
import styles from "./styles";
import { Ionicons } from '@expo/vector-icons';


export default function Historico() {
  const router = useRouter();
  const { user } = useAuth();

  const [conferencias, setConferencias] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null);

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
              setSelectedConference(null);
              Alert.alert("Sucesso", "Histórico apagado!");
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível apagar o histórico");
            }
          },
        },
      ]
    );
  };

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
              if (selectedConference?.id === conference.id) {
                setSelectedConference(null);
              }
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

  const handleSelectConference = (conference: Conference) => {
    setSelectedConference(conference);
  };

  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR");
    } catch {
      return "Data inválida";
    }
  };

  const getLocation = (prisoner: Prisoner): string => {
    if (prisoner.isHospital) return "Hospital";
    return `Pav. ${prisoner.pavilion || "?"} - Cela ${prisoner.cellId || "?"}`;
  };

  // ============================================
  // PDF DE LISTA COMPLETA (TODOS OS DADOS DOS INTERNOS)
  // ============================================
  const generateListaPDF = async () => {
    if (!user) return;

    try {
      const allPrisoners = await getAllPrisoners(user.uid);
      
      if (allPrisoners.length === 0) {
        Alert.alert("Atenção", "Não há internos cadastrados");
        return;
      }

      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString("pt-BR");
      const timeStr = currentDate.toLocaleTimeString("pt-BR");

      // Agrupa presos por localização
      const groupedByLocation = allPrisoners.reduce((acc, p) => {
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
            .prisoner { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
            .prisoner:last-child { border-bottom: none; }
            .prisoner-name { font-weight: bold; color: #1f2937; margin-bottom: 4px; font-size: 13px; }
            .prisoner-detail { color: #6b7280; font-size: 11px; margin-bottom: 2px; }
            .badges { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }
            .badge { background: #e9d5ff; padding: 2px 8px; border-radius: 4px; font-size: 10px; display: inline-block; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 SISTEMA PRISIONAL</h1>
            <div style="font-size: 14px; color: #6b7280;">
              Lista Completa de Internos
            </div>
          </div>
          
          <div class="info">
            <div class="info-row"><strong>📅 Data:</strong> ${dateStr}</div>
            <div class="info-row"><strong>🕐 Horário:</strong> ${timeStr}</div>
            <div class="info-row"><strong>👤 Responsável:</strong> ${user?.displayName || user?.email || "Usuário"}</div>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total de Internos</div>
              <div class="stat-value">${allPrisoners.length}</div>
            </div>
          </div>
          
          ${Object.entries(groupedByLocation)
            .map(
              ([location, prisionersList]) => `
            <div class="location-group">
              <div class="location-header">
                ${location} (${prisionersList.length} ${prisionersList.length === 1 ? "interno" : "internos"})
              </div>
              ${prisionersList
                .map(
                  (p) => `
                <div class="prisoner">
                  <div class="prisoner-name">${p.name}</div>
                  <div class="prisoner-detail">📋 Matrícula: ${p.matricula}</div>
                  ${!p.isHospital ? `
                    <div class="prisoner-detail">📅 Entrada: ${new Date(p.entryDate).toLocaleDateString("pt-BR")}</div>
                    <div class="badges">
                      ${p.hasTV ? '<span class="badge">📺 TV</span>' : ""}
                      ${p.hasRadio ? '<span class="badge">📻 Rádio</span>' : ""}
                      ${p.hasFan ? '<span class="badge">🌀 Ventilador</span>' : ""}
                      ${p.hasMattress ? '<span class="badge">🛏️ Colchão</span>' : ""}
                    </div>
                  ` : ""}
                </div>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
          
          <div class="footer">
            Sistema Prisional - Gerado em ${dateStr} às ${timeStr}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === "android") {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Lista de Internos",
          UTI: "com.adobe.pdf",
        });
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      Alert.alert("Erro", error.message || "Não foi possível gerar o PDF");
    }
  };

  // ============================================
  // PDF DE CONFERÊNCIA INDIVIDUAL
  // ============================================
  const generateConferenciaPDF = async (conf: Conference) => {
    if (!user) return;

    try {
      const allPrisoners = await getAllPrisoners(user.uid);
      const checkedIds = conf.checkedIds || [];
      const missingIds = allPrisoners
        .filter((p) => !checkedIds.includes(p.id))
        .map((p) => p.id);

      const checkedPrisoners = allPrisoners.filter((p) => checkedIds.includes(p.id));
      const missingPrisoners = allPrisoners.filter((p) => missingIds.includes(p.id));

      const confDate = conf.date.toDate ? conf.date.toDate() : new Date(conf.date);
      const dateStr = confDate.toLocaleDateString("pt-BR");
      const timeStr = confDate.toLocaleTimeString("pt-BR");

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
            .section { margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
            .section-header { padding: 10px 15px; font-weight: bold; font-size: 14px; color: white; }
            .checked-header { background: #16a34a; }
            .missing-header { background: #ef4444; }
            .prisoner { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
            .prisoner:last-child { border-bottom: none; }
            .prisoner-name { font-weight: bold; color: #1f2937; margin-bottom: 4px; font-size: 13px; }
            .prisoner-detail { color: #6b7280; font-size: 11px; margin-bottom: 2px; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 SISTEMA PRISIONAL</h1>
            <div style="font-size: 14px; color: #6b7280;">
              Relatório de Conferência
            </div>
          </div>
          
          <div class="info">
            <div class="info-row"><strong>📅 Data da Conferência:</strong> ${dateStr}</div>
            <div class="info-row"><strong>🕐 Horário:</strong> ${timeStr}</div>
            <div class="info-row"><strong>👤 Responsável:</strong> ${conf.userName || conf.user || "Não informado"}</div>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total</div>
              <div class="stat-value">${conf.totalPrisoners}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Conferidos</div>
              <div class="stat-value" style="color: #16a34a;">${conf.checkedCount}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Faltantes</div>
              <div class="stat-value" style="color: #ef4444;">${conf.missingCount}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Taxa</div>
              <div class="stat-value">${Math.round((conf.checkedCount / conf.totalPrisoners) * 100)}%</div>
            </div>
          </div>
          
          ${checkedPrisoners.length > 0 ? `
          <div class="section">
            <div class="section-header checked-header">
              ✓ Internos Conferidos (${checkedPrisoners.length})
            </div>
            ${checkedPrisoners.map(p => `
              <div class="prisoner">
                <div class="prisoner-name">${p.name}</div>
                <div class="prisoner-detail">📋 Matrícula: ${p.matricula}</div>
                <div class="prisoner-detail">📍 ${getLocation(p)}</div>
              </div>
            `).join("")}
          </div>
          ` : ""}
          
          ${missingPrisoners.length > 0 ? `
          <div class="section">
            <div class="section-header missing-header">
              ✗ Internos Faltantes (${missingPrisoners.length})
            </div>
            ${missingPrisoners.map(p => `
              <div class="prisoner">
                <div class="prisoner-name">${p.name}</div>
                <div class="prisoner-detail">📋 Matrícula: ${p.matricula}</div>
                <div class="prisoner-detail">📍 ${getLocation(p)}</div>
              </div>
            `).join("")}
          </div>
          ` : ""}
          
          <div class="footer">
            Sistema Prisional - Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === "android") {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Conferência - ${dateStr}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      Alert.alert("Erro", error.message || "Não foi possível gerar o PDF");
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

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

      <ScrollView style={styles.content}>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: "#2563eb", marginBottom: 5 }]}
          onPress={handleRefresh}
          disabled={refreshing}>
          <Text style={styles.addButtonText}>
            {refreshing ? "Atualizando..." : "🔄 Atualizar"}
          </Text>
        </TouchableOpacity>

        {/* Botões de PDF */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          {/* Botão PDF Lista Completa */}
          <TouchableOpacity 
            style={[styles.printBtn, { backgroundColor: "#8b5cf6", flex: 1 }]} 
            onPress={generateListaPDF}
          >
            <Text style={styles.printBtnText}>📋 PDF</Text>
            <Text style={styles.printBtnText}>Lista de internos</Text>
          </TouchableOpacity>

          {/* Botão PDF Conferências */}
          <TouchableOpacity 
            style={[styles.printBtn, { backgroundColor: "#8b5cf6", flex: 1 }]} 
            onPress={() => {
              if (conferencias.length === 0) {
                Alert.alert("Atenção", "Não há conferências para gerar PDF");
              } else if (!selectedConference) {
                Alert.alert(
                  "Selecione uma conferência",
                  "Clique em uma conferência na lista abaixo para selecioná-la",
                  [{ text: "OK" }]
                );
              } else {
                generateConferenciaPDF(selectedConference);
              }
            }}
          >
            <Text style={styles.printBtnText}>📄 PDF</Text>
            <Text style={styles.printBtnText}>Conferências</Text>
          </TouchableOpacity>
        </View>

        {selectedConference && (
          <View style={{
            backgroundColor: "#8b5cf6",
            padding: 12,
            borderRadius: 8,
            marginBottom: 10,
          }}>
            <Text style={{ color: "#fff", fontWeight: "bold", marginBottom: 4 }}>
              ✓ Conferência Selecionada
            </Text>
            <Text style={{ color: "#fff", fontSize: 12 }}>
              {formatDate(selectedConference.date)}
            </Text>
          </View>
        )}

        {conferencias.length === 0 ? (
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
              Nenhuma conferência salva
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}>
              As conferências realizadas aparecerão aqui
            </Text>
          </View>
        ) : (
          conferencias.map((conf) => (
            <TouchableOpacity
              key={conf.id}
              onPress={() => handleSelectConference(conf)}
            >
              <View style={[
                styles.historyCard,
                selectedConference?.id === conf.id && {
                  borderWidth: 3,
                  borderColor: "#8b5cf6",
                  backgroundColor: "#f5f3ff",
                }
              ]}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {selectedConference?.id === conf.id && (
                      <Text style={{ fontSize: 20 }}>✓</Text>
                    )}
                    <Text style={styles.historyTitle}>📅 {formatDate(conf.date)}</Text>
                  </View>
                  
                  {/* Botão Deletar */}
                  <TouchableOpacity 
                    onPress={(e) => {
                      handleDeleteConference(conf);
                    }}
                    style={{
                      backgroundColor: "#ef4444",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.historyDate}>
                  👤 Responsável: {conf.userName || conf.user || "Não informado"}
                </Text>

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
            </TouchableOpacity>
          ))
        )}

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