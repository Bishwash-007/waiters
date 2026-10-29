import { Pressable, Text, View } from "react-native";
import { IconRenderer } from "../icon";
import { iconMap } from "@/constants/icons";

type AlertProps = {
  title?: string;
  message: string;
  variant?: "neutral" | "success" | "warning" | "error";
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
};

const styles = {
  neutral: "border-validation-neutral bg-blue-50 dark:bg-blue-950",
  success: "border-validation-success bg-green-50 dark:bg-green-950",
  warning: "border-validation-warning bg-orange-50 dark:bg-orange-950",
  error: "border-validation-error bg-red-50 dark:bg-red-950",
} as const;

export function Alert({ title, message, variant = "neutral", actionLabel, onAction, onDismiss }: AlertProps) {
  return (
    <View className={`flex-row gap-3 rounded-component border p-4 ${styles[variant]}`}>
      <View className="min-w-0 flex-1 gap-1">
        {title ? <Text className="font-gothic font-semibold text-font-dark dark:text-white">{title}</Text> : null}
        <Text className="font-gothic text-sm text-font-dark dark:text-white">{message}</Text>
        {actionLabel ? (
          <Pressable className="pt-2" onPress={onAction}>
            <Text className="font-gothic text-sm font-semibold text-font-dark underline dark:text-white">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable accessibilityLabel="Dismiss alert" onPress={onDismiss}>
          <IconRenderer icon={iconMap.close} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}
