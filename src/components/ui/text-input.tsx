import type { ComponentProps } from "react";
import { Text, TextInput as NativeTextInput, View } from "react-native";

type TextInputProps = ComponentProps<typeof NativeTextInput> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function TextInput({ label, error, hint, editable = true, className = "", ...props }: TextInputProps) {
  return (
    <View className="gap-2">
      {label ? <Text className="font-gothic text-sm font-semibold text-font-dark dark:text-white">{label}</Text> : null}
      <NativeTextInput
        accessibilityLabel={label}
        className={`min-h-12 rounded-component border px-4 font-gothic text-base text-font-dark ${
          error ? "border-validation-error" : "border-monochromatic-7 dark:border-monochromatic-4"
        } ${!editable ? "bg-monochromatic-9 text-monochromatic-5 dark:bg-monochromatic-2" : "bg-white dark:bg-monochromatic-1 dark:text-white"} ${className}`}
        editable={editable}
        placeholderTextColor="#808080"
        {...props}
      />
      {error ? (
        <Text className="font-gothic text-sm text-validation-error">{error}</Text>
      ) : hint ? (
        <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">{hint}</Text>
      ) : null}
    </View>
  );
}
