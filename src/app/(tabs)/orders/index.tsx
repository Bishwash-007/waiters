import { Header } from "@/components/ui";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OrderListScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top"]}>
      <Header title="Orders" subtitle="Manage branch orders" />
      
    </SafeAreaView>
  );
};

export default OrderListScreen;
