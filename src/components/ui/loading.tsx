import { ActivityIndicator, Text, View } from "react-native";

export function Loading({ label = "Loading...", fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <View
      className={`items-center justify-center gap-3 ${fullScreen ? "flex-1 bg-white dark:bg-monochromatic-1" : "p-6"}`}
    >
      <ActivityIndicator color="#9B40BF" size="large" />
      <Text
        className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7"
        accessibilityLiveRegion="polite"
      >
        {label}
      </Text>
    </View>
  );
}
