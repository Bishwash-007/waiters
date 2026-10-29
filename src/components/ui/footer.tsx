import { Text, View } from "react-native";

type FooterProps = {
  copyright?: string;
  links?: string[];
  onLinkPress?: (label: string) => void;
};

export function Footer({ copyright, links = [], onLinkPress }: FooterProps) {
  return (
    <View className="gap-4 border-t border-monochromatic-9 bg-white px-4 py-6 dark:border-monochromatic-2 dark:bg-monochromatic-1">
      {links.length ? (
        <View className="flex-row flex-wrap gap-4">
          {links.map((link) => (
            <Text
              className="font-gothic text-sm text-font-dark underline dark:text-white"
              key={link}
              onPress={() => onLinkPress?.(link)}
            >
              {link}
            </Text>
          ))}
        </View>
      ) : null}
      {copyright ? (
        <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">{copyright}</Text>
      ) : null}
    </View>
  );
}
