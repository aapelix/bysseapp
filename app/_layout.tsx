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
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="settings" />
      </Stack>
      <View className="absolute bottom-5 left-3 w-screen items-center translate-y-2">
        <View className="flex-row justify-center items-center gap-6 w-[90vw] bg-[#0f0f0f] rounded-full pb-5">
          <Link className="text-white" href="/">
            <Ionicons name="home-outline" size={32} color="white" />
          </Link>
          <Link className="text-white" href="/map">
            <Ionicons name="map-outline" size={32} color="white" />
          </Link>
          <Link className="text-white" href="/settings">
            <Ionicons name="settings-outline" size={32} color="white" />
          </Link>
        </View>
      </View>
    </SafeAreaProvider>
  );
}
