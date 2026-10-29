import type { LucideIcon, LucideProps } from "lucide-react-native";
import { TouchableOpacity, useColorScheme, type TouchableOpacityProps } from "react-native";

type IconProps = Omit<TouchableOpacityProps, "children"> & {
  icon: LucideIcon;
  label: string;
  iconProps?: LucideProps;
};

export function IconRenderer({
  icon: Icon,
  size = 24,
  color,
  strokeWidth = 2,
  ...props
}: { icon: LucideIcon } & LucideProps) {
  const colorScheme = useColorScheme();

  return (
    <Icon
      color={color ?? (colorScheme === "dark" ? "#FFFFFF" : "#111111")}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}

const IconNode = ({ icon: Icon, label, iconProps, ...props }: IconProps) => {
  return (
    <TouchableOpacity accessibilityLabel={label} accessibilityRole="button" {...props}>
      <IconRenderer icon={Icon} size={16} {...iconProps} />
    </TouchableOpacity>
  );
};

export default IconNode;
