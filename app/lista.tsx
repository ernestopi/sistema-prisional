// ============================================
// TELA DE LISTA E CONFERÊNCIA - Sistema Prisional
// Lista todos os presos com busca, conferência e geração de PDF
// ============================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import styles from "./styles";

// ============================================
// CONSTANTES
// ============================================
const STORAGE_KEYS = {
  PAVILIONS: "@prison_pavilions",
  HOSPITAL: "@prison_hospital",
  CONFERENCIAS: "@prison_conferencias",
};

export default function Lista() {
  const router = useRouter();

  // ============================================
  // ESTADOS
  // ============================================
  const [pavilions, setPavilions] = useState({});
  const [hospital, setHospital] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ name: "Usuário" });

  // Estados de busca e conferência
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [conferenciaMode, setConferenciaMode] = useState(false);
  const [conferenciaChecked, setConferenciaChecked] = useState([]);

  // ============================================
  // CARREGAMENTO INICIAL
  // ============================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const pavs = await AsyncStorage.getItem(STORAGE_KEYS.PAVILIONS);
      const hosp = await AsyncStorage.getItem(STORAGE_KEYS.HOSPITAL);
      if (pavs) setPavilions(JSON.parse(pavs));
      if (hosp) setHospital(JSON.parse(hosp));
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  const getAllPrisoners = () => {
    let all = [];

    // Percorre todos os pavilhões
    Object.keys(pavilions).forEach((pav) => {
      pavilions[pav].forEach((cell) => {
        cell.prisoners.forEach((p) => {
          all.push({
            ...p,
            location: `Pav. ${pav} - Cela ${cell.id}`,
            isHospital: false,
          });
        });
      });
    });

    // Adiciona presos do hospital
    hospital.forEach((p) => all.push({ ...p, location: "Hospital", isHospital: true }));

    return all;
  };

  const filterPrisoners = () => {
    const all = getAllPrisoners();
    if (!searchQuery.trim()) return all;

    const q = searchQuery.toLowerCase();
    return all.filter((p) => {
      if (searchType === "name") return p.name.toLowerCase().includes(q);
      if (searchType === "matricula") return p.matricula?.toLowerCase().includes(q);
      if (searchType === "cell") return p.location.toLowerCase().includes(q);
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
    const total = getAllPrisoners().length;
    const checked = conferenciaChecked.length;

    if (checked === 0) {
      Alert.alert("Atenção", "Nenhum preso conferido!");
      return;
    }

    const conf = {
      id: Date.now(),
      date: new Date().toISOString(),
      user: currentUser.name,
      totalPrisoners: total,
      checkedCount: checked,
      missingCount: total - checked,
    };

    try {
      const savedConfs = await AsyncStorage.getItem(STORAGE_KEYS.CONFERENCIAS);
      const confs = savedConfs ? JSON.parse(savedConfs) : [];
      const newHistory = [conf, ...confs];
      await AsyncStorage.setItem(STORAGE_KEYS.CONFERENCIAS, JSON.stringify(newHistory));

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
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  // ============================================
  // FUNÇÃO: Gerar PDF
  // ============================================
  const generatePDF = async () => {
    try {
      const prisoners = searchQuery ? filterPrisoners() : getAllPrisoners();
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString("pt-BR");
      const timeStr = currentDate.toLocaleTimeString("pt-BR");

      const total = prisoners.length;
      const conferidos = conferenciaMode ? conferenciaChecked.length : 0;
      const faltantes = conferenciaMode ? total - conferidos : 0;

      // Agrupa presos por localização
      const groupedByLocation = prisoners.reduce((acc, p) => {
        if (!acc[p.location]) acc[p.location] = [];
        acc[p.location].push(p);
        return acc;
      }, {});

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
            <div class="info-row"><strong>👤 Responsável:</strong> ${currentUser.name}</div>
            ${searchQuery ? `<div class="info-row"><strong>🔍 Filtro:</strong> ${searchQuery}</div>` : ""}
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
                ${location} (${prisionersList.length} ${prisionersList.length === 1 ? "preso" : "presos"})
              </div>
              ${prisionersList
                .map(
                  (p) => `
                <div class="prisoner">
                  ${
                    conferenciaMode
                      ? `
                    <span class="checkbox ${conferenciaChecked.includes(p.id) ? "checked" : ""}">
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
                      <div class="prisoner-detail">Entrada: ${formatDate(p.entryDate)}</div>
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
            Documento gerado pelo Sistema Prisional em ${dateStr} às ${timeStr}
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
        <View>
          <Text style={styles.headerTitle}>Lista</Text>
          <Text style={styles.headerSub}>Total: {getAllPrisoners().length}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/login")}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA DE BUSCA E CONTROLES */}
      <View style={styles.searchArea}>
        {/* Botões de tipo de busca */}
        <View style={styles.searchBtns}>
          {["name", "matricula", "cell"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.searchBtn, searchType === t && styles.searchBtnActive]}
              onPress={() => setSearchType(t)}
            >
              <Text
                style={[styles.searchBtnText, searchType === t && { color: "#fff" }]}
              >
                {t === "name" ? "Nome" : t === "matricula" ? "Matrícula" : "Local"}
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
            onPress={toggleConferenciaMode}
          >
            <Text style={styles.confBtnText}>
              {conferenciaMode ? "❌ Cancelar" : "✅ Iniciar Conferência"}
            </Text>
          </TouchableOpacity>
          {conferenciaMode && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveConferencia}>
              <Text style={styles.saveBtnText}>
                💾 Salvar ({conferenciaChecked.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botão de gerar PDF */}
        <TouchableOpacity style={styles.printBtn} onPress={generatePDF}>
          <Text style={styles.printBtnText}>🖨️ Gerar PDF</Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO - LISTA DE PRESOS */}
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>
          {searchQuery
            ? `Resultados: ${filterPrisoners().length}`
            : `Total: ${getAllPrisoners().length}`}
        </Text>

        {(searchQuery ? filterPrisoners() : getAllPrisoners()).map((p, i) => (
          <TouchableOpacity
            key={`${p.id}-${i}`}
            style={styles.listCard}
            onPress={() =>
              conferenciaMode &&
              setConferenciaChecked((prev) =>
                prev.includes(p.id)
                  ? prev.filter((id) => id !== p.id)
                  : [...prev, p.id]
              )
            }
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
              <Text style={styles.location}>{p.location}</Text>
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
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
