import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
};

export function Slider({
  value,
  onChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  label,
  disabled = false,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const range = maximumValue - minimumValue;
  const progress = range === 0 ? 0 : (value - minimumValue) / range;

  const updateValue = (locationX: number) => {
    if (disabled || width === 0) return;
    const rawValue = minimumValue + Math.max(0, Math.min(1, locationX / width)) * range;
    onChange(Math.round(rawValue / step) * step);
  };

  return (
    <View className={`gap-2 ${disabled ? "opacity-50" : ""}`}>
      {label ? <Text className="font-gothic text-sm text-font-dark dark:text-white">{label}</Text> : null}
      <Pressable
        accessibilityRole="adjustable"
        accessibilityValue={{ max: maximumValue, min: minimumValue, now: value }}
        className="h-6 justify-center"
        disabled={disabled}
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
        onPress={({ nativeEvent }) => updateValue(nativeEvent.locationX)}
      >
        <View className="h-2 rounded-full bg-brand-10 dark:bg-brand-2">
          <View
            className="h-2 rounded-full bg-brand-5"
            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
          />
        </View>
        <View
          className="absolute h-5 w-5 rounded-full border-2 border-brand-5 bg-white dark:bg-monochromatic-1"
          style={{ left: `${Math.max(0, Math.min(1, progress)) * 100}%`, marginLeft: -10 }}
        />
      </Pressable>
    </View>
  );
}
