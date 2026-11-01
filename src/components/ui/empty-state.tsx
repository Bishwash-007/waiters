import { Text, View } from "react-native";
import { Button } from "./button";
import { Icon } from "./remaining";
import type { IconName } from "@/constants/icons";

type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
};

export function EmptyState({ title, message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <View className="items-center gap-3 px-6 py-10">
      {icon ? <Icon name={icon} size={40} /> : null}
      <Text className="text-center font-gothic text-heading-6 text-font-dark dark:text-white">{title}</Text>
      {message ? (
        <Text className="text-center font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
          {message}
        </Text>
      ) : null}
      {actionLabel ? (
        <View className="pt-2">
          <Button disabled={!onAction} onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
