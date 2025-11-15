import { Stack } from "expo-router";

export default function RootLayout() {
  // REMOVIDO: useEffect que causava loop infinito
  // A proteção de rotas será feita em cada tela individualmente
  
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        // Opções para Android
        animation: 'fade',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="login" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="menu" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="conferencia" />
      <Stack.Screen name="lista" />
      <Stack.Screen name="historico" />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}