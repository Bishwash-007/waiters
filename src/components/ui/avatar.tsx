import type { ImageSourcePropType } from "react-native";
import { Image, Text, View } from "react-native";

type AvatarProps = {
  source?: ImageSourcePropType;
  name?: string;
  size?: "small" | "medium" | "large";
};

export function Avatar({ source, name, size = "medium" }: AvatarProps) {
  const sizeClass = {
    small: "h-8 w-8",
    medium: "h-12 w-12",
    large: "h-16 w-16",
  }[size];
  if (source)
    return <Image accessibilityLabel={name ?? "Avatar"} className={`${sizeClass} rounded-full`} source={source} />;
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";
  return (
    <View className={`items-center justify-center rounded-full bg-brand-10 dark:bg-brand-2 ${sizeClass}`}>
      <Text className="font-gothic font-semibold text-brand-5 dark:text-brand-8">{initials}</Text>
    </View>
  );
}
