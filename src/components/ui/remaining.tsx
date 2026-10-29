import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import { useState } from "react";
import { IconRenderer } from "../icon";
import { iconMap, type IconName } from "@/constants/icons";

export function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const IconComponent = iconMap[name as keyof typeof iconMap] ?? iconMap.user;
  return <IconRenderer accessibilityLabel={name} icon={IconComponent} size={size} />;
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={`h-10 w-10 items-center justify-center rounded-full ${disabled ? "opacity-40" : "active:bg-monochromatic-9"}`}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon name={icon} />
    </Pressable>
  );
}

export function PasswordInput(
  props: Omit<React.ComponentProps<typeof TextInput>, "secureTextEntry"> & { label?: string; error?: string },
) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="gap-2">
      <TextInput
        {...props}
        accessibilityLabel={props.label}
        className={`min-h-12 rounded-component border border-monochromatic-7 bg-white px-4 font-gothic text-base text-font-dark dark:border-monochromatic-4 dark:bg-monochromatic-1 dark:text-white ${props.className ?? ""}`}
        placeholderTextColor="#808080"
        secureTextEntry={!visible}
      />
      <Pressable className="absolute right-3 top-3" onPress={() => setVisible((current) => !current)}>
        <Text className="font-gothic text-sm text-brand-5">{visible ? "Hide" : "Show"}</Text>
      </Pressable>
      {props.error ? <Text className="font-gothic text-sm text-validation-error">{props.error}</Text> : null}
    </View>
  );
}

export type SelectOption = { label: string; value: string };
export function Select({
  value,
  options,
  onChange,
  label,
  placeholder = "Select",
  disabled = false,
}: {
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View className="gap-2">
      {label ? <Text className="font-gothic text-sm font-semibold text-font-dark dark:text-white">{label}</Text> : null}
      <View className="relative">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled, expanded: open }}
          className={`min-h-12 flex-row items-center justify-between rounded-component border border-monochromatic-7 px-4 dark:border-monochromatic-4 ${disabled ? "bg-monochromatic-9 opacity-50 dark:bg-monochromatic-2" : "bg-white dark:bg-monochromatic-1"}`}
          disabled={disabled}
          onPress={() => setOpen((current) => !current)}
        >
          <Text
            className={`font-gothic text-base ${selected ? "text-font-dark dark:text-white" : "text-monochromatic-5 dark:text-monochromatic-7"}`}
          >
            {selected?.label ?? placeholder}
          </Text>
          <Icon name={open ? "chevronDown" : "arrowRight"} />
        </Pressable>
        {open ? (
          <View className="absolute left-0 right-0 top-14 z-10 rounded-component border border-monochromatic-8 bg-white p-1 shadow-outer-default dark:border-monochromatic-3 dark:bg-monochromatic-1">
            {options.map((option) => (
              <Pressable
                className="rounded px-3 py-3 active:bg-brand-10 dark:active:bg-brand-2"
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Text className="font-gothic text-sm text-font-dark dark:text-white">{option.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function StatusPill({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: "neutral" | "success" | "warning" | "error";
}) {
  const classes = {
    neutral: "bg-blue-100 text-validation-neutral",
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    error: "bg-red-100 text-validation-error",
  }[variant];
  const [background, color] = classes.split(" ");
  return (
    <View className={`self-start rounded-full px-3 py-1 ${background}`}>
      <Text className={`font-gothic text-xs font-semibold ${color}`}>{label}</Text>
    </View>
  );
}

export function Rating({
  value,
  max = 5,
  onChange,
}: {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
}) {
  return (
    <View
      accessibilityLabel={`${value} out of ${max} stars`}
      accessibilityRole={onChange ? "adjustable" : undefined}
      className="flex-row gap-1"
    >
      {Array.from({ length: max }, (_, index) => (
        <Pressable disabled={!onChange} key={index} onPress={() => onChange?.(index + 1)}>
          <IconRenderer color={index < value ? "#666666" : "#BBBBBB"} icon={iconMap.star} size={20} />
        </Pressable>
      ))}
    </View>
  );
}

export function CounterRow({
  label,
  value,
  onChange,
  minimum = 0,
  maximum = 99,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
  maximum?: number;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-monochromatic-9 py-3 dark:border-monochromatic-2">
      <Text className="font-gothic text-base text-font-dark dark:text-white">{label}</Text>
      <View className="flex-row items-center gap-3">
        <IconButton
          icon="arrowLeft"
          label={`Decrease ${label}`}
          disabled={value <= minimum}
          onPress={() => onChange(value - 1)}
        />
        <Text className="min-w-6 text-center font-gothic font-semibold text-font-dark dark:text-white">{value}</Text>
        <IconButton
          icon="arrowRight"
          label={`Increase ${label}`}
          disabled={value >= maximum}
          onPress={() => onChange(value + 1)}
        />
      </View>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between border-b border-monochromatic-9 pb-3 dark:border-monochromatic-2">
      <Text className="font-gothic text-heading-6 text-font-dark dark:text-white">{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text className="font-gothic text-sm font-semibold text-brand-5">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ListRow({
  title,
  description,
  leadingIcon,
  trailingIcon,
  onTrailingPress,
  onPress,
}: {
  title: string;
  description?: string;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  onTrailingPress?: () => void;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-center gap-3 py-3">
      {leadingIcon ? <IconRenderer icon={iconMap[leadingIcon]} size={22} /> : null}
      <View className="min-w-0 flex-1">
        <Text className="font-gothic text-base text-font-dark dark:text-white" numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {trailingIcon ? <IconButton icon={trailingIcon} label={`${title} action`} onPress={onTrailingPress} /> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export function ImagePlaceholder({
  source,
  aspectRatio = 1,
  children,
}: {
  source?: ImageSourcePropType;
  aspectRatio?: number;
  children?: ReactNode;
}) {
  return (
    <View className="overflow-hidden rounded-card bg-monochromatic-9 dark:bg-monochromatic-2" style={{ aspectRatio }}>
      {source ? (
        <Image className="h-full w-full" resizeMode="cover" source={source} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Icon name="user" size={40} />
        </View>
      )}
      {children ? <View className="absolute inset-x-0 bottom-0">{children}</View> : null}
    </View>
  );
}

export function ImageCard({
  source,
  title,
  description,
  onPress,
}: {
  source?: ImageSourcePropType;
  title: string;
  description?: string;
  onPress?: () => void;
}) {
  const content = (
    <View className="overflow-hidden rounded-card border border-monochromatic-9 bg-white shadow-outer-default dark:border-monochromatic-2 dark:bg-monochromatic-1">
      <ImagePlaceholder source={source} aspectRatio={1.7} />
      <View className="gap-1 p-4">
        <Text className="font-gothic text-heading-6 text-font-dark dark:text-white">{title}</Text>
        {description ? (
          <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">{description}</Text>
        ) : null}
      </View>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export function ChatBubble({ message, time, mine = false }: { message: string; time?: string; mine?: boolean }) {
  return (
    <View
      className={`max-w-[85%] gap-1 rounded-card p-3 ${mine ? "self-end bg-brand-5" : "self-start bg-monochromatic-9 dark:bg-monochromatic-2"}`}
    >
      <Text className={`font-gothic text-sm ${mine ? "text-white" : "text-font-dark dark:text-white"}`}>{message}</Text>
      {time ? (
        <Text
          className={`font-gothic text-xs ${mine ? "text-brand-10" : "text-monochromatic-5 dark:text-monochromatic-7"}`}
        >
          {time}
        </Text>
      ) : null}
    </View>
  );
}

export function ChatMessageInput({
  value,
  onChangeText,
  onSend,
  placeholder = "Message",
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-component border border-monochromatic-7 px-3 dark:border-monochromatic-4">
      <TextInput
        className="min-h-12 flex-1 font-gothic text-base text-font-dark dark:text-white"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#808080"
        value={value}
      />
      <IconButton icon="arrowRight" label="Send message" onPress={onSend} />
    </View>
  );
}

export function ContextMenu({
  items,
  onSelect,
}: {
  items: { label: string; value: string }[];
  onSelect: (value: string) => void;
}) {
  return (
    <View className="min-w-44 rounded-component border border-monochromatic-9 bg-white p-1 shadow-outer-default dark:border-monochromatic-2 dark:bg-monochromatic-1">
      {items.map((item) => (
        <Pressable
          className="rounded px-3 py-3 active:bg-brand-10 dark:active:bg-brand-2"
          key={item.value}
          onPress={() => onSelect(item.value)}
        >
          <Text className="font-gothic text-sm text-font-dark dark:text-white">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SpinnerLoader({ label }: { label?: string }) {
  return (
    <View className="items-center gap-2">
      <ActivityIndicator color="#9B40BF" />
      <Text className="font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">{label}</Text>
    </View>
  );
}

export function TabBar({
  items,
  active,
  onChange,
}: {
  items: { label: string; icon?: IconName; key: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <View className="flex-row border-t border-monochromatic-9 bg-white pb-2 pt-2 dark:border-monochromatic-2 dark:bg-monochromatic-1">
      {items.map((item) => (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: active === item.key }}
          className="flex-1 items-center gap-1"
          key={item.key}
          onPress={() => onChange(item.key)}
        >
          {item.icon ? <Icon name={item.icon} size={20} /> : <Icon name="user" size={20} />}
          <Text
            className={`font-gothic text-xs ${active === item.key ? "font-semibold text-brand-5" : "text-monochromatic-5 dark:text-monochromatic-7"}`}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ScrollGallery({ children, horizontal = true }: { children: ReactNode; horizontal?: boolean }) {
  return (
    <ScrollView
      contentContainerClassName="gap-3"
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
