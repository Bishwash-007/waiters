import { Pressable, Text, View } from "react-native";
import { IconRenderer } from "../icon";
import { iconMap, type IconName } from "@/constants/icons";

export type TabItem = {
  key: string;
  label: string;
  icon?: IconName;
  badge?: string | number;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  scrollable?: boolean;
};

export function Tabs({ items, value, onChange, scrollable = false }: TabsProps) {
  return (
    <View
      className={`flex-row border-b border-monochromatic-9 dark:border-monochromatic-2 ${scrollable ? "overflow-hidden" : ""}`}
    >
      {items.map((item) => {
        const selected = item.key === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`min-h-12 flex-1 items-center justify-center gap-1 px-4 ${selected ? "border-b-2 border-brand-5" : ""}`}
            key={item.key}
            onPress={() => onChange(item.key)}
          >
            <View className="flex-row items-center gap-2">
              {item.icon ? <IconRenderer icon={iconMap[item.icon]} size={18} /> : null}
              <Text
                className={`font-gothic text-sm ${selected ? "font-semibold text-brand-5" : "text-monochromatic-5 dark:text-monochromatic-7"}`}
              >
                {item.label}
              </Text>
              {item.badge !== undefined ? (
                <Text className="rounded-full bg-brand-10 px-2 text-xs text-brand-5">{item.badge}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
