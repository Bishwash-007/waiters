import { Header } from "@/components/ui";
import { router } from "expo-router";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OrderDetailsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header title="Order details" subtitle="Review order information" onBack={() => router.back()} />
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;
