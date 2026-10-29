import { Header } from "@/components/ui";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const ForgotPassword = () => {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header title="Forgot password" subtitle="Reset your account password" onBack={() => router.canGoBack()} />
    </SafeAreaView>
  );
};

export default ForgotPassword;
