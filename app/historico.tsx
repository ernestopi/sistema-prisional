// ============================================
// TELA DE HISTÓRICO COM FIREBASE E PDF
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
  // PDF DE CONFERÊNCIA (APENAS RESUMO: SERVIDOR, TOTAL, HORÁRIO)
  // ============================================
  const generateConferenciaPDF = async (conference: Conference) => {
    try {
      const dateStr = formatDate(conference.date).split(" às ")[0];
      const timeStr = formatDate(conference.date).split(" às ")[1];

      const total = conference.totalPrisoners || 0;
      const conferidos = conference.checkedCount || 0;
      const faltantes = conference.missingCount || 0;
      const porcentagem = total > 0 ? Math.round((conferidos / total) * 100) : 0;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              background: #f9fafb;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #1e3a8a; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .header h1 { 
              color: #1e3a8a; 
              margin: 0 0 10px 0; 
              font-size: 28px; 
            }
            .subtitle {
              font-size: 16px;
              color: #6b7280;
              font-weight: 500;
            }
            .info-card {
              background: #eff6ff;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              border-left: 4px solid #1e3a8a;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .info-label {
              color: #6b7280;
              font-weight: 500;
            }
            .info-value {
              color: #1f2937;
              font-weight: 600;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin: 30px 0;
            }
            .stat-card {
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
            }
            .stat-label {
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 8px;
              text-transform: uppercase;
              font-weight: 600;
            }
            .stat-value {
              font-size: 36px;
              font-weight: bold;
              line-height: 1;
            }
            .stat-total { color: #1f2937; }
            .stat-checked { color: #16a34a; }
            .stat-missing { color: #ef4444; }
            .progress-section {
              margin-top: 30px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
            }
            .progress-label {
              font-size: 13px;
              color: #6b7280;
              margin-bottom: 8px;
              font-weight: 600;
            }
            .progress-bar {
              height: 24px;
              background: #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
              position: relative;
            }
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #16a34a, #22c55e);
              transition: width 0.3s;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 11px;
            }
            .signature {
              margin-top: 50px;
              padding-top: 30px;
              border-top: 1px solid #e5e7eb;
            }
            .signature-line {
              border-top: 2px solid #1f2937;
              margin: 60px auto 10px;
              width: 300px;
            }
            .signature-label {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 CONFERÊNCIA PRISIONAL</h1>
              <div class="subtitle">Relatório de Conferência</div>
            </div>
            
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">📅 Data:</span>
                <span class="info-value">${dateStr}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🕐 Horário:</span>
                <span class="info-value">${timeStr}</span>
              </div>
              <div class="info-row">
                <span class="info-label">👤 Servidor Responsável:</span>
                <span class="info-value">${conference.userName || conference.user || "Não informado"}</span>
              </div>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total</div>
                <div class="stat-value stat-total">${total}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Conferidos</div>
                <div class="stat-value stat-checked">${conferidos}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Faltantes</div>
                <div class="stat-value stat-missing">${faltantes}</div>
              </div>
            </div>
            
            <div class="progress-section">
              <div class="progress-label">Taxa de Conferência</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${porcentagem}%;">
                  ${porcentagem}%
                </div>
              </div>
            </div>

            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-label">
                ${conference.userName || conference.user || "Servidor Responsável"}<br>
                Assinatura
              </div>
            </div>
            
            <div class="footer">
              Documento gerado pelo Sistema Prisional<br>
              ☁️ Dados sincronizados com Firebase
            </div>
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
              } else {
                Alert.alert(
                  "Gerar PDF",
                  "Escolha uma conferência na lista abaixo clicando no ícone 📄",
                  [{ text: "OK" }]
                );
              }
            }}
          >
            <Text style={styles.printBtnText}>📄 PDF</Text>
            <Text style={styles.printBtnText}>Conferências</Text>

          </TouchableOpacity>
        </View>

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
            <View key={conf.id} style={styles.historyCard}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={styles.historyTitle}>📅 {formatDate(conf.date)}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {/* Botão Deletar */}
                  <TouchableOpacity 
                    onPress={() => handleDeleteConference(conf)}
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