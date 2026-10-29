import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useState } from "react";

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="relative self-start">
      <Pressable accessibilityLabel={content} onLongPress={() => setVisible((current) => !current)}>
        {children}
      </Pressable>
      {visible ? (
        <View className="absolute bottom-full left-0 z-10 mb-2 rounded-component bg-monochromatic-2 px-3 py-2 dark:bg-monochromatic-8">
          <Text className="font-gothic text-xs text-white dark:text-font-dark">{content}</Text>
        </View>
      ) : null}
    </View>
  );
}
