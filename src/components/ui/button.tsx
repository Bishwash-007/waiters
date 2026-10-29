import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { IconRenderer } from "../icon";
import { iconMap, type IconName } from "@/constants/icons";

type ButtonProps = Omit<ComponentProps<typeof Pressable>, "children"> & {
  children: string;
  variant?: "fill" | "outline" | "none";
  size?: "large" | "medium" | "small";
  loading?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
};

const sizeClasses = {
  large: "min-h-16 px-6",
  medium: "min-h-12 px-5",
  small: "min-h-9 px-4",
} as const;

export function Button({
  children,
  variant = "fill",
  size = "medium",
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantClasses = {
    fill: "bg-brand-5 active:bg-brand-4",
    outline: "border border-brand-5 active:bg-brand-10 dark:active:bg-brand-2",
    none: "active:opacity-60",
  }[variant];
  const textClasses = variant === "fill" ? "text-white" : "text-brand-5";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      className={`flex-row items-center justify-center gap-2 rounded-component ${sizeClasses[size]} ${variantClasses} ${isDisabled ? "opacity-50" : ""} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "fill" ? "#FFFFFF" : "#9B40BF"} />
      ) : (
        <>
          {iconLeft ? <IconRenderer icon={iconMap[iconLeft]} size={18} /> : null}
          <Text className={`font-gothic font-semibold ${textClasses}`}>{children}</Text>
          {iconRight ? <IconRenderer icon={iconMap[iconRight]} size={18} /> : null}
        </>
      )}
    </Pressable>
  );
}
