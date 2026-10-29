import { Header } from "@/components/ui";
import { router } from "expo-router";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OrderSummaryScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header title="Order summary" subtitle="Confirm order totals" onBack={() => router.back()} />
    </SafeAreaView>
  );
};

export default OrderSummaryScreen;
