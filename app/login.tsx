// ============================================
// TELA DE LOGIN ATUALIZADA — COMPATÍVEL COM FIREBASE DO SITE
// login.tsx - Sistema Prisional
// ============================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import styles from "./styles";

export default function LoginFirebase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "diretor" | "agente">("agente");

  const [isRegistering, setIsRegistering] = useState(false);

  const { login, register, loading } = useAuth();
  const router = useRouter();

  // Bloquear botão voltar
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Sair", "Deseja sair do aplicativo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // =============================
  // LOGIN
  // =============================
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

  // =============================
  // REGISTRO
  // =============================
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
      await register(email, password, displayName, role);
      Alert.alert("Sucesso", "Conta criada com sucesso!");
      router.replace("/menu");
    } catch (error: any) {
      Alert.alert("Erro ao Registrar", error.message);
    }
  };

  // =============================
  // LOADING INITIAL STATE
  // =============================
  if (loading) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  // =============================
  // UI
  // =============================
  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.loginKeyboard}
      >
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>🔒 Sistema Prisional</Text>

          <Text style={styles.loginSubtitle}>
            {isRegistering ? "Criar nova conta" : "Faça login para acessar"}
          </Text>

          {/* Nome (apenas quando registrando) */}
          {isRegistering && (
            <>
              <TextInput
                style={styles.loginInput}
                placeholder="Nome completo"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />

              {/* Seleção de cargo */}
              <View style={{ marginBottom: 15 }}>
                <Text style={{ color: "#fff", marginBottom: 5 }}>
                  Tipo de Usuário:
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  {["admin", "diretor", "agente"].map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r as any)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        backgroundColor: role === r ? "#1e90ff" : "#444",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#fff" }}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* EMAIL */}
          <TextInput
            style={styles.loginInput}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* SENHA */}
          <TextInput
            style={styles.loginInput}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          {/* BOTÃO */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {isRegistering ? "Criar Conta" : "Entrar"}
            </Text>
          </TouchableOpacity>

          {/* ALTERNAR ENTRE LOGIN / REGISTRO */}
          <TouchableOpacity
            onPress={() => setIsRegistering(!isRegistering)}
            style={{ marginTop: 20 }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {isRegistering
                ? "Já tem uma conta? Faça login"
                : "Ainda não tem conta? Registrar"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


// // ============================================
// // TELA DE LOGIN - SEM LOOP
// // login.tsx - Sistema Prisional
// // ============================================

// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   ActivityIndicator,
//   BackHandler,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { StatusBar } from "expo-status-bar";
// import { useRouter } from "expo-router";
// import { useAuth } from "../hooks/useAuth";
// import styles from "./styles";

// export default function LoginFirebase() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isRegistering, setIsRegistering] = useState(false);
//   const [displayName, setDisplayName] = useState("");
  
//   const { login, register, loading } = useAuth();
//   const router = useRouter();

//   // Bloquear botão voltar
//   useEffect(() => {
//     const backAction = () => {
//       Alert.alert("Sair", "Deseja sair do aplicativo?", [
//         { text: "Cancelar", style: "cancel" },
//         { text: "Sair", onPress: () => BackHandler.exitApp() }
//       ]);
//       return true;
//     };

//     const backHandler = BackHandler.addEventListener(
//       "hardwareBackPress",
//       backAction
//     );

//     return () => backHandler.remove();
//   }, []);

//   const handleLogin = async () => {
//     if (!email.trim() || !password.trim()) {
//       Alert.alert("Atenção", "Preencha email e senha");
//       return;
//     }

//     try {
//       await login(email, password);
//       router.replace("/menu");
//     } catch (error: any) {
//       Alert.alert("Erro de Login", error.message);
//     }
//   };

//   const handleRegister = async () => {
//     if (!email.trim() || !password.trim() || !displayName.trim()) {
//       Alert.alert("Atenção", "Preencha todos os campos");
//       return;
//     }

//     if (password.length < 6) {
//       Alert.alert("Atenção", "A senha deve ter no mínimo 6 caracteres");
//       return;
//     }

//     try {
//       await register(email, password, displayName);
//       Alert.alert("Sucesso", "Conta criada com sucesso!");
//       router.replace("/menu");
//     } catch (error: any) {
//       Alert.alert("Erro ao Registrar", error.message);
//     }
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loginContainer}>
//         <ActivityIndicator size="large" color="#fff" />
//         <Text style={{ color: '#fff', marginTop: 10 }}>Carregando...</Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.loginContainer}>
//       <StatusBar style="light" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.loginKeyboard}
//       >
//         <View style={styles.loginBox}>
//           <Text style={styles.loginTitle}>
//             🔒 Sistema Prisional
//           </Text>
//           <Text style={styles.loginSubtitle}>
//             {isRegistering ? "Criar nova conta" : "Faça login para acessar"}
//           </Text>

//           {isRegistering && (
//             <TextInput
//               style={styles.loginInput}
//               placeholder="Nome completo"
//               value={displayName}
//               onChangeText={setDisplayName}
//               autoCapitalize="words"
//             />
//           )}

//           <TextInput
//             style={styles.loginInput}
//             placeholder="Email"
//             value={email}
//             onChangeText={setEmail}
//             keyboardType="email-address"
//             autoCapitalize="none"
//             autoCorrect={false}
//           />

//           <TextInput
//             style={styles.loginInput}
//             placeholder="Senha"
//             secureTextEntry
//             value={password}
//             onChangeText={setPassword}
//             autoCapitalize="none"
//           />

//           <TouchableOpacity
//             style={styles.loginButton}
//             onPress={isRegistering ? handleRegister : handleLogin}
//             disabled={loading}
//           >
//             <Text style={styles.loginButtonText}>
//               {isRegistering ? "Criar Conta" : "Entrar"}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }
