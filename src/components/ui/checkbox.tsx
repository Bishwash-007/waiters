import { Pressable, Text, View } from "react-native";
import { IconRenderer } from "../icon";
import { iconMap } from "@/constants/icons";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      className={`flex-row items-center gap-3 ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={() => onChange(!checked)}
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded border ${checked ? "border-brand-5 bg-brand-5" : "border-monochromatic-5 bg-white dark:bg-monochromatic-2"}`}
      >
        {checked ? <IconRenderer color="#FFFFFF" icon={iconMap.check} size={16} strokeWidth={3} /> : null}
      </View>
      {label ? <Text className="font-gothic text-base text-font-dark dark:text-white">{label}</Text> : null}
    </Pressable>
  );
}
