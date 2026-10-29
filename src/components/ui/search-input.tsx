import type { ComponentProps } from "react";
import { TextInput } from "./text-input";

type SearchInputProps = Omit<ComponentProps<typeof TextInput>, "accessibilityLabel" | "placeholder"> & {
  placeholder?: string;
};

export function SearchInput({ placeholder = "Search", ...props }: SearchInputProps) {
  return <TextInput accessibilityLabel="Search" placeholderTextColor="#808080" placeholder={placeholder} {...props} />;
}
