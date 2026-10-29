import { Header } from "@/components/ui";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top"]}>
      <Header title="Profile" subtitle="Manage your account" />
    </SafeAreaView>
  );
};

export default ProfileScreen;
