import { Header } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";

const TableScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top"]}>
      <Header title="Tables" subtitle="Available tables in your branch" />
    </SafeAreaView>
  );
};

export default TableScreen;
