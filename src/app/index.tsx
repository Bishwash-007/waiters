import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@/stores/auth-store";

export default function App() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-monochromatic-1">
        <ActivityIndicator color="#111111" size="large" />
      </View>
    );
  }

  return <Redirect href={accessToken ? "/(tabs)/tables" : "/(auth)/sign-in"} />;
}
