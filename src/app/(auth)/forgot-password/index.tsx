import { Header } from "@/components/ui";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const ForgotPassword = () => {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header title="Forgot password" subtitle="Reset your account password" onBack={handleBack} />
    </SafeAreaView>
  );
};

export default ForgotPassword;
