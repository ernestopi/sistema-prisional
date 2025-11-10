import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert 
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";

export default function Menu() {
  const router = useRouter();
  const { name } = useLocalSearchParams();
  const [totalPrisoners, setTotalPrisoners] = useState(0);

  // Carrega o total de presos ao abrir o menu
  useEffect(() => {
    loadTotalPrisoners();
  }, []);

  const loadTotalPrisoners = async () => {
    try {
      const pavs = await AsyncStorage.getItem("@prison_pavilions");
      const hosp = await AsyncStorage.getItem("@prison_hospital");
      
      let total = 0;
      
      // Conta presos dos pavilhões
      if (pavs) {
        const pavilions = JSON.parse(pavs);
        Object.keys(pavilions).forEach(pav => {
          pavilions[pav].forEach(cell => {
            total += cell.prisoners.length;
          });
        });
      }
      
      // Conta presos do hospital
      if (hosp) {
        const hospital = JSON.parse(hosp);
        total += hospital.length;
      }
      
      setTotalPrisoners(total);
    } catch (error) {
      console.error("Erro ao calcular total:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Confirmar", "Deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair", 
        onPress: () => router.replace("/login") 
      },
    ]);
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        "@prison_pavilions", 
        "@prison_hospital", 
        "@prison_conferencias"
      ]);
      
      // Recria estrutura vazia dos pavilhões
      const emptyPavilions = {
        A: Array(20).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
        B: Array(20).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
        Triagem: Array(8).fill(null).map((_, i) => ({ id: i + 1, prisoners: [] })),
        SAT: Array(1).fill(null).map((_, i) => ({ id: 1, prisoners: [] })),
      };
      
      await AsyncStorage.setItem("@prison_pavilions", JSON.stringify(emptyPavilions));
      await AsyncStorage.setItem("@prison_hospital", JSON.stringify([]));
      
      setTotalPrisoners(0);
      Alert.alert("Sucesso", "Todos os dados foram apagados!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível limpar os dados.");
    }
  };

  const handleClearData = () => {
    Alert.alert("Confirmar", "Apagar tudo?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Apagar", 
        style: "destructive", 
        onPress: clearAllData 
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.menuContainer}>
      <StatusBar style="light" />
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sistema Prisional</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
      
      {/* Cards do menu */}
      <View style={styles.menuContent}>
        {/* Card: Adicionar Preso */}
        <TouchableOpacity 
          style={styles.menuCard} 
          onPress={() => router.push("/conferencia")}
        >
          <Text style={styles.menuIcon}>✏️</Text>
          <Text style={styles.menuCardTitle}>Adicionar Preso</Text>
        </TouchableOpacity>
        
        {/* Card: Lista e Conferência */}
        <TouchableOpacity 
          style={styles.menuCard} 
          onPress={() => router.push("/lista")}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuCardTitle}>Lista e Conferência</Text>
        </TouchableOpacity>
        
        {/* Card: Histórico */}
        <TouchableOpacity 
          style={styles.menuCard} 
          onPress={() => router.push("/historico")}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuCardTitle}>Histórico</Text>
        </TouchableOpacity>
        
        {/* Card: Limpar Dados */}
        <TouchableOpacity 
          style={[styles.menuCard, {backgroundColor: '#fee'}]} 
          onPress={handleClearData}
        >
          <Text style={styles.menuIcon}>🗑️</Text>
          <Text style={styles.menuCardTitle}>Limpar Dados</Text>
        </TouchableOpacity>
        
        {/* Box com total de presos */}
        <View style={styles.totalBox}>
          <Text style={styles.totalText}>Total: {totalPrisoners}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}