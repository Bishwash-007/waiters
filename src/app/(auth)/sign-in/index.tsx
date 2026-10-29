import { Header } from "@/components/ui";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignInScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header title="Sign in" subtitle="Access your waiter account" />
    </SafeAreaView>
  );
};

export default SignInScreen;
