import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import styles from "./styles";

export default function Login() {
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const router = useRouter();

  const users = [
    { username: "admin", password: "admin123", name: "Administrador" },
    { username: "agente", password: "agente123", name: "Agente" },
  ];

  const handleLogin = () => {
    const user = users.find(
      (u) =>
        u.username === loginForm.username && u.password === loginForm.password
    );

    if (user) {
      router.push({ pathname: "/menu", params: { name: user.name } });
    } else {
      Alert.alert("Erro de Login", "Usuário ou senha incorretos");
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.loginKeyboard}
      >
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>🔒 Sistema Prisional</Text>
          <Text style={styles.loginSubtitle}>Faça login para acessar</Text>

          <TextInput
            style={styles.loginInput}
            placeholder="Usuário"
            value={loginForm.username}
            onChangeText={(t) => setLoginForm({ ...loginForm, username: t })}
          />
          <TextInput
            style={styles.loginInput}
            placeholder="Senha"
            secureTextEntry
            value={loginForm.password}
            onChangeText={(t) => setLoginForm({ ...loginForm, password: t })}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>

          <View style={styles.loginInfo}>
            <Text style={styles.loginInfoTitle}>Usuários de teste:</Text>
            <Text style={styles.loginInfoText}>• admin / admin123</Text>
            <Text style={styles.loginInfoText}>• agente / agente123</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
