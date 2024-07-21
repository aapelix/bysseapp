import NavBar from "@/components/navbar";
import { Stack, Link } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}
