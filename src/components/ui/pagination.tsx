import { Pressable, Text, View } from "react-native";
import { IconRenderer } from "../icon";
import { iconMap } from "@/constants/icons";

type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  siblingCount?: number;
};

export function Pagination({ page, pageCount, onChange, siblingCount = 1 }: PaginationProps) {
  const first = Math.max(1, page - siblingCount);
  const last = Math.min(pageCount, page + siblingCount);
  const pages = Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
  const itemClass = "h-10 min-w-10 items-center justify-center rounded-component px-3";

  return (
    <View accessibilityRole="adjustable" className="flex-row items-center gap-2">
      <Pressable
        accessibilityLabel="Previous page"
        accessibilityRole="button"
        className={`${itemClass} ${page === 1 ? "opacity-40" : "bg-monochromatic-9 dark:bg-monochromatic-2"}`}
        disabled={page === 1}
        onPress={() => onChange(page - 1)}
      >
        <IconRenderer icon={iconMap.arrowLeft} size={20} />
      </Pressable>
      {first > 1 ? <Text className="px-1 text-monochromatic-5">…</Text> : null}
      {pages.map((item) => (
        <Pressable
          accessibilityLabel={`Page ${item}`}
          accessibilityRole="button"
          accessibilityState={{ selected: item === page }}
          className={`${itemClass} ${item === page ? "bg-brand-5" : "bg-monochromatic-9 dark:bg-monochromatic-2"}`}
          key={item}
          onPress={() => onChange(item)}
        >
          <Text
            className={`font-gothic text-sm font-semibold ${item === page ? "text-white" : "text-font-dark dark:text-white"}`}
          >
            {item}
          </Text>
        </Pressable>
      ))}
      {last < pageCount ? <Text className="px-1 text-monochromatic-5">…</Text> : null}
      <Pressable
        accessibilityLabel="Next page"
        accessibilityRole="button"
        className={`${itemClass} ${page === pageCount ? "opacity-40" : "bg-monochromatic-9 dark:bg-monochromatic-2"}`}
        disabled={page === pageCount}
        onPress={() => onChange(page + 1)}
      >
        <IconRenderer icon={iconMap.arrowRight} size={20} />
      </Pressable>
    </View>
  );
}
