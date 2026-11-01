import { useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 20;

export function useLazyList<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  return {
    visibleItems,
    hasMore,
    loadMore: () => {
      if (hasMore) setVisibleCount((count) => Math.min(count + pageSize, items.length));
    },
  };
}
