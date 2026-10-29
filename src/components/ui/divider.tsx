import { View } from "react-native";

export function Divider({ vertical = false }: { vertical?: boolean }) {
  return (
    <View
      className={
        vertical
          ? "h-full w-px bg-monochromatic-9 dark:bg-monochromatic-2"
          : "h-px w-full bg-monochromatic-9 dark:bg-monochromatic-2"
      }
    />
  );
}
