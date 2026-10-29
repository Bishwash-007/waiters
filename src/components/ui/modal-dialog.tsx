import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { IconRenderer } from "../icon";
import { iconMap } from "@/constants/icons";

type ModalDialogProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function ModalDialog({ visible, onClose, title, children, actionLabel, onAction }: ModalDialogProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full gap-4 rounded-card bg-white p-5 shadow-outer-default dark:bg-monochromatic-1">
          {title ? (
            <View className="flex-row items-center justify-between">
              <Text className="font-gothic text-heading-6 text-font-dark dark:text-white">{title}</Text>
              <Pressable accessibilityLabel="Close dialog" onPress={onClose}>
                <IconRenderer icon={iconMap.close} size={20} />
              </Pressable>
            </View>
          ) : null}
          <View>{children}</View>
          {actionLabel ? (
            <Pressable className="flex-row justify-end" onPress={onAction}>
              <Text className="font-gothic text-sm font-semibold text-font-dark underline dark:text-white">
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
