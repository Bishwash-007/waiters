import { Text, View } from "react-native";

type BadgeProps = {
  label: string;
  variant?: "brand" | "neutral" | "success" | "warning" | "error";
};

export function Badge({ label, variant = "brand" }: BadgeProps) {
  const classes = {
    brand: "bg-brand-10 text-brand-5",
    neutral: "bg-blue-100 text-validation-neutral",
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    error: "bg-red-100 text-validation-error",
  }[variant];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${classes.split(" ")[0]}`}>
      <Text className={`font-gothic text-xs font-semibold ${classes.split(" ")[1]}`}>{label}</Text>
    </View>
  );
}
