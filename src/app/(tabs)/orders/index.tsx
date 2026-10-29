import { Alert, EmptyState, Header, Loading, SearchInput } from "@/components/ui";
import { IconRenderer } from "@/components/icon";
import { iconMap } from "@/constants/icons";
import { useAuthStore } from "@/stores/auth-store";
import { useBranchStore, useOrderStore } from "@/stores/data-stores";
import type { Order, OrderStatus } from "@/types/api";
import { router, useFocusEffect } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OrderListScreen = () => {
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const tables = useBranchStore((state) => state.tables);
  const fetchTables = useBranchStore((state) => state.fetchTables);
  const fetchBranches = useBranchStore((state) => state.fetchBranches);
  const activeOrders = useOrderStore((state) => state.activeOrders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const error = useOrderStore((state) => state.error);
  const fetchActiveDetails = useOrderStore((state) => state.fetchActiveDetails);
  const clearError = useOrderStore((state) => state.clearError);
  const [branchId, setBranchId] = useState<string | null>(user?.branchId ?? null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const loadOrders = useCallback(async () => {
    clearError();
    try {
      let selectedBranchId = branchId;
      if (!selectedBranchId) {
        const currentBranches = branches.length
          ? branches
          : await fetchBranches().then(() => useBranchStore.getState().branches);
        selectedBranchId = user?.branchId ?? currentBranches[0]?.id ?? null;
        setBranchId(selectedBranchId);
      }
      if (selectedBranchId) {
        await Promise.all([fetchActiveDetails(selectedBranchId), fetchTables(selectedBranchId)]);
      }
    } catch (requestError) {
      console.error("Failed to load active orders.", requestError);
    }
  }, [branchId, branches, clearError, fetchActiveDetails, fetchBranches, fetchTables, user]);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...activeOrders]
      .filter((order) => {
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        if (!matchesStatus) return false;
        if (!query) return true;
        return (
          order.id.toLowerCase().includes(query) ||
          getTableName(order, tables)?.toLowerCase().includes(query) ||
          formatStatus(order.status).toLowerCase().includes(query)
        );
      })
      .sort((left, right) => getTimestamp(right) - getTimestamp(left));
  }, [activeOrders, search, statusFilter, tables]);

  const renderOrder = useCallback(({ item }: { item: Order }) => renderOrderItem(item, tables), [tables]);

  const content = () => {
    if (isLoading && !activeOrders.length) return <Loading label="Loading active orders..." />;
    if (error && !activeOrders.length) {
      return (
        <EmptyState
          title="Could not load orders"
          message={error}
          actionLabel="Try again"
          icon="refresh"
          onAction={() => void loadOrders()}
        />
      );
    }
    if (!activeOrders.length) {
      return (
        <EmptyState title="No active orders" message="New and in-progress orders will appear here." icon="clipboard" />
      );
    }
    if (!filteredOrders.length) {
      return (
        <EmptyState title="No matching orders" message="Try another order number, table, or status." icon="search" />
      );
    }
    return (
      <FlatList
        contentContainerClassName="px-4 pb-8 pt-4"
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        removeClippedSubviews
        renderItem={renderOrder}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void loadOrders()} />}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top"]}>
      <Header title="Orders" subtitle="Active orders for this branch" />
      <View className="border-b border-monochromatic-9 px-4 pb-3 pt-2 dark:border-monochromatic-2">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search orders" />
        <ScrollView
          className="mt-3"
          contentContainerClassName="gap-2"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <FilterPill active={statusFilter === "all"} label="All" onPress={() => setStatusFilter("all")} />
          {orderStatuses.map((status) => (
            <FilterPill
              active={statusFilter === status}
              key={status}
              label={formatStatus(status)}
              onPress={() => setStatusFilter(status)}
            />
          ))}
        </ScrollView>
        {branches.length > 1 ? (
          <Text className="mt-2 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
            {branches.find((branch) => branch.id === branchId)?.name ?? "Current branch"}
          </Text>
        ) : null}
        {error && activeOrders.length ? <Alert message={error} variant="error" onDismiss={clearError} /> : null}
      </View>
      {content()}
    </SafeAreaView>
  );
};

const orderStatuses: OrderStatus[] = ["placed", "confirmed", "preparing", "ready", "served", "awaiting_payment"];

function FilterPill({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`rounded-full border px-4 py-2 ${
        active
          ? "border-brand-5 bg-brand-5"
          : "border-monochromatic-8 bg-white dark:border-monochromatic-3 dark:bg-monochromatic-2"
      }`}
      onPress={onPress}
    >
      <Text className={`font-gothic text-sm font-semibold ${active ? "text-white" : "text-font-dark dark:text-white"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function getString(order: Order, ...keys: string[]) {
  for (const key of keys) {
    const value = order[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

function getTableName(order: Order, tables: { id: string; label: string }[]) {
  const label = getString(order, "tableLabel", "table_label");
  if (label) return label;
  const tableId = getString(order, "tableId", "table_id");
  return tableId ? (tables.find((table) => table.id === tableId)?.label ?? `Table ${tableId.slice(0, 8)}`) : null;
}

function getNumber(order: Order, ...keys: string[]) {
  for (const key of keys) {
    const value = order[key];
    if (typeof value === "number" || typeof value === "string") return Number(value) || 0;
  }
  return 0;
}

function getItemCount(order: Order) {
  const items = order.items ?? order.orderItems ?? order.order_items;
  if (Array.isArray(items)) return items.reduce((total, item) => total + Number(item.quantity ?? 0), 0);
  return getNumber(order, "itemCount", "item_count");
}

function getTimestamp(order: Order) {
  const value = getString(order, "createdAt", "created_at");
  const timestamp = value ? Date.parse(value) : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatTimestamp(order: Order) {
  const timestamp = getTimestamp(order);
  return timestamp
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(timestamp)
    : null;
}

function formatStatus(status: OrderStatus) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAmount(value: number) {
  return `Rs. ${value.toFixed(2)}`;
}

function statusStyle(status: OrderStatus) {
  if (status === "ready" || status === "served") return { container: "bg-monochromatic-2", text: "text-white" };
  if (status === "awaiting_payment") return { container: "bg-monochromatic-8", text: "text-font-dark" };
  return { container: "bg-monochromatic-9", text: "text-font-dark" };
}

export default OrderListScreen;

const OrderCard = memo(function OrderCard({ item, tables }: { item: Order; tables: { id: string; label: string }[] }) {
  const itemCount = getItemCount(item);
  return (
    <Pressable
      accessibilityLabel={`Open order ${item.id.slice(0, 8)}`}
      accessibilityRole="button"
      className="mb-3 rounded-card border border-monochromatic-9 bg-white p-4 active:opacity-70 dark:border-monochromatic-2 dark:bg-monochromatic-2"
      onPress={() => router.push({ pathname: "/(screens)/orderdetails/[id]", params: { id: item.id } })}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-component bg-monochromatic-9 dark:bg-monochromatic-3">
            <IconRenderer icon={iconMap.clipboard} size={21} />
          </View>
          <View>
            <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">
              Order #{item.id.slice(0, 8)}
            </Text>
            <Text className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
              {getTableName(item, tables) ?? "Takeaway order"}
            </Text>
            {formatTimestamp(item) ? (
              <Text className="mt-1 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
                {formatTimestamp(item)}
              </Text>
            ) : null}
          </View>
        </View>
        <View className={`rounded-full px-2 py-1 ${statusStyle(item.status).container}`}>
          <Text className={`font-gothic text-xs font-semibold ${statusStyle(item.status).text}`}>
            {formatStatus(item.status)}
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-center justify-between border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2">
        <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </Text>
        <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">
          {formatAmount(getNumber(item, "totalAmount", "total_amount", "total"))}
        </Text>
      </View>
    </Pressable>
  );
});

function renderOrderItem(item: Order, tables: { id: string; label: string }[]) {
  return <OrderCard item={item} tables={tables} />;
}
