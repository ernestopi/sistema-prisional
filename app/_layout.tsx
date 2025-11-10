import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
      }}
    >
      {/* Define todas as rotas do app */}
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="menu" />
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