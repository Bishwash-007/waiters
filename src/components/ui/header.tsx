import { Pressable, Text, View } from "react-native";
import { IconRenderer } from "../icon";
import { iconMap, type IconName } from "@/constants/icons";

type HeaderProps = {
  title: string;
  subtitle?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightPress?: () => void;
  onBack?: () => void;
};

export function Header({ title, subtitle, leftIcon, rightIcon, onRightPress, onBack }: HeaderProps) {
  return (
    <View className="min-h-16 flex-row items-center justify-between border-b border-monochromatic-9 bg-white px-4 py-3 dark:border-monochromatic-2 dark:bg-monochromatic-1">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center"
            onPress={onBack}
          >
            <IconRenderer icon={iconMap.arrowLeft} size={24} />
          </Pressable>
        ) : null}
        {leftIcon ? <IconRenderer icon={iconMap[leftIcon]} size={22} /> : null}
        <View className="min-w-0 flex-1">
          <Text className="font-gothic text-heading-6 text-font-dark dark:text-white" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightIcon ? (
        <Pressable accessibilityLabel={rightIcon} className="ml-3" onPress={onRightPress}>
          <IconRenderer icon={iconMap[rightIcon]} size={22} />
        </Pressable>
      ) : null}
    </View>
  );
}
