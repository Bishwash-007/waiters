import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type BottomSheetProps = { visible: boolean; onClose: () => void; title?: string; children: ReactNode };

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="gap-4 rounded-t-card bg-white px-5 pb-8 pt-4 dark:bg-monochromatic-1"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="h-1 w-12 self-center rounded-full bg-monochromatic-8" />
          {title ? <Text className="font-gothic text-heading-6 text-font-dark dark:text-white">{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
