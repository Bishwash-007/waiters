import { Pressable, Text, View } from "react-native";

type RadioProps = {
  selected: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
};

export function Radio({ selected, onChange, label, disabled = false }: RadioProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      className={`flex-row items-center gap-3 ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onChange}
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-brand-5" : "border-monochromatic-5"}`}
      >
        {selected ? <View className="h-3 w-3 rounded-full bg-brand-5" /> : null}
      </View>
      {label ? <Text className="font-gothic text-base text-font-dark dark:text-white">{label}</Text> : null}
    </Pressable>
  );
}
