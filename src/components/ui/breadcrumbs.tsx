import { Pressable, Text, View } from "react-native";

export type BreadcrumbItem = {
  label: string;
  key?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  onPress?: (item: BreadcrumbItem, index: number) => void;
};

export function Breadcrumbs({ items, onPress }: BreadcrumbsProps) {
  return (
    <View accessibilityRole="list" className="flex-row flex-wrap items-center gap-2">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const content = (
          <Text
            className={`font-gothic text-sm ${last ? "font-semibold text-font-dark dark:text-white" : "text-monochromatic-5 dark:text-monochromatic-7"}`}
          >
            {item.label}
          </Text>
        );
        return (
          <View className="flex-row items-center gap-2" key={item.key ?? `${item.label}-${index}`}>
            {onPress && !last ? (
              <Pressable accessibilityRole="link" onPress={() => onPress(item, index)}>
                {content}
              </Pressable>
            ) : (
              content
            )}
            {!last ? <Text className="text-monochromatic-5 dark:text-monochromatic-7">/</Text> : null}
          </View>
        );
      })}
    </View>
  );
}
