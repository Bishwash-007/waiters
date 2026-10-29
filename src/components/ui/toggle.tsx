import { Switch, useColorScheme } from "react-native";

type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ value, onChange, disabled = false }: ToggleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Switch
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onValueChange={onChange}
      trackColor={{ false: isDark ? "#4D4D4D" : "#CCCCCC", true: isDark ? "#7C3399" : "#D7B2E5" }}
      thumbColor={value ? "#9B40BF" : isDark ? "#CCCCCC" : "#FFFFFF"}
      value={value}
    />
  );
}
