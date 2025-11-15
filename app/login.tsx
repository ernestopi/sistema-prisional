// ============================================
// TELA DE LOGIN COM FIREBASE
// login_firebase.tsx - Exemplo de implementação
// ============================================

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import styles from "./styles";

export default function LoginFirebase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [displayName, setDisplayName] = useState("");
  
  const { login, register, loading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Atenção", "Preencha email e senha");
      return;
    }

    try {
      await login(email, password);
      router.replace("/menu");
    } catch (error: any) {
      Alert.alert("Erro de Login", error.message);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Atenção", "A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      await register(email, password, displayName);
      Alert.alert("Sucesso", "Conta criada com sucesso!");
      router.replace("/menu_firebase");
    } catch (error: any) {
      Alert.alert("Erro ao Registrar", error.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.loginKeyboard}
      >
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>
            🔒 Sistema Prisional
          </Text>
          <Text style={styles.loginSubtitle}>
            {isRegistering ? "Criar nova conta" : "Faça login para acessar"}
          </Text>

          {isRegistering && (
            <TextInput
              style={styles.loginInput}
              placeholder="Nome completo"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.loginInput}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.loginInput}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {isRegistering ? "Criar Conta" : "Entrar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 15 }}
            onPress={() => setIsRegistering(!isRegistering)}
          >
            <Text style={{ textAlign: 'center', color: '#475569' }}>
              {isRegistering
                ? "Já tem conta? Fazer login"
                : "Não tem conta? Registrar-se"}
            </Text>
          </TouchableOpacity>

          {!isRegistering && (
            <View style={styles.loginInfo}>
              <Text style={styles.loginInfoTitle}>
                💡 Dica: Use seu email institucional
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
