import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type CardProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  onPress?: () => void;
};

export function Card({ children, title, description, onPress }: CardProps) {
  const content = (
    <View className="gap-3 rounded-card border border-monochromatic-9 bg-white p-4 dark:border-monochromatic-2 dark:bg-monochromatic-1">
      {title ? <Text className="font-gothic text-heading-6 text-font-dark dark:text-white">{title}</Text> : null}
      {description ? (
        <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">{description}</Text>
      ) : null}
      {children}
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: false }}
      className="active:opacity-70"
      onPress={onPress}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}
