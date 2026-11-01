import { Alert, Button, EmptyState, Header, Loading } from "@/components/ui";
import { IconRenderer } from "@/components/icon";
import { iconMap } from "@/constants/icons";
import { useAuthStore } from "@/stores/auth-store";
import { useOrderStore } from "@/stores/data-stores";
import { useLazyList } from "@/hooks/use-lazy-list";
import type { Order, OrderStatus } from "@/types/api";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TableOrdersScreen = () => {
  const { tableId, tableLabel } = useLocalSearchParams<{ tableId: string; tableLabel?: string }>();
  const branchId = useAuthStore((state) => state.user?.branchId);
  const activeOrders = useOrderStore((state) => state.activeOrders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const error = useOrderStore((state) => state.error);
  const fetchActiveDetails = useOrderStore((state) => state.fetchActiveDetails);
  const clearError = useOrderStore((state) => state.clearError);

  const loadOrders = useCallback(
    async (force = false) => {
      if (!branchId || !tableId) return;
      clearError();
      try {
        await fetchActiveDetails(branchId, { force });
      } catch (requestError) {
        console.error("Failed to load table orders.", requestError);
      }
    },
    [branchId, clearError, fetchActiveDetails, tableId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  const tableOrders = useMemo(
    () => activeOrders.filter((order) => order.tableId === tableId || order.table_id === tableId),
    [activeOrders, tableId],
  );
  const { visibleItems, hasMore, loadMore } = useLazyList(tableOrders);

  const renderOrder = ({ item }: { item: Order }) => (
    <Pressable
      accessibilityLabel={`Open order ${item.id.slice(0, 8)}`}
      accessibilityRole="button"
      className="rounded-card border border-monochromatic-9 bg-white p-4 active:opacity-70 dark:border-monochromatic-2 dark:bg-monochromatic-2"
      onPress={() =>
        router.push({
          pathname: "/(screens)/orderdetails/[id]",
          params: { id: item.id, tableId, ...(tableLabel ? { tableLabel } : {}) },
        })
      }
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-component bg-monochromatic-9 dark:bg-monochromatic-3">
            <IconRenderer icon={iconMap.clipboard} size={20} />
          </View>
          <View>
            <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">
              Order #{item.id.slice(0, 8)}
            </Text>
            <Text className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
              {getItemCount(item)} {getItemCount(item) === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>
        <View className={`rounded-full px-2 py-1 ${statusStyle(item.status).container}`}>
          <Text className={`font-gothic text-xs font-semibold ${statusStyle(item.status).text}`}>
            {formatStatus(item.status)}
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-center justify-between border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2">
        <Text className="font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
          {formatTimestamp(item)}
        </Text>
        <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">
          {formatAmount(getNumber(item, "totalAmount", "total_amount"))}
        </Text>
      </View>
    </Pressable>
  );

  if (isLoading && !activeOrders.length) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
        <Header title={tableLabel ?? "Table orders"} onBack={() => router.back()} />
        <Loading label="Loading table orders..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header
        title={tableLabel ?? "Table orders"}
        subtitle={`${tableOrders.length} active ${tableOrders.length === 1 ? "order" : "orders"}`}
        onBack={() => router.back()}
      />
      {error && !tableOrders.length ? (
        <View className="p-4">
          <Alert
            message={error}
            variant="error"
            actionLabel="Retry"
            onAction={() => void loadOrders()}
            onDismiss={clearError}
          />
        </View>
      ) : (
        <FlatList
          contentContainerClassName="gap-3 px-4 pb-32 pt-4"
          data={visibleItems}
          keyExtractor={(item) => item.id}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          ListEmptyComponent={
            <EmptyState
              title="No active orders"
              message="Start a new order for this table."
              icon="clipboard"
              actionLabel="Start new order"
              onAction={() =>
                router.push({
                  pathname: "/ordertaking/[tableId]",
                  params: { tableId, tableLabel: tableLabel ?? "" },
                })
              }
            />
          }
          renderItem={renderOrder}
          ListFooterComponent={hasMore ? <Loading label="Loading more orders..." /> : undefined}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void loadOrders(true)} />}
          showsVerticalScrollIndicator={false}
          windowSize={7}
        />
      )}
      {tableOrders.length ? (
        <View className="absolute bottom-0 left-0 right-0 border-t border-monochromatic-9 bg-white px-4 pb-4 pt-3 dark:border-monochromatic-2 dark:bg-monochromatic-1">
          <Button
            variant="outline"
            onPress={() =>
              router.push({
                pathname: "/ordertaking/[tableId]",
                params: { tableId, tableLabel: tableLabel ?? "" },
              })
            }
          >
            Add items / New order
          </Button>
          <View className="h-3" />
          <Button
            onPress={() =>
              router.push({
                pathname: "/tablecheckout/[tableId]",
                params: { tableId, tableLabel: tableLabel ?? "" },
              })
            }
          >
            Review combined bill
          </Button>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

function getItemCount(order: Order) {
  const items = order.items ?? order.orderItems ?? order.order_items;
  if (Array.isArray(items)) {
    return items.reduce((total, item) => total + Number(item.quantity ?? 0), 0);
  }
  const itemCount = order.itemCount ?? order.item_count;
  return typeof itemCount === "number" || typeof itemCount === "string" ? Number(itemCount) || 0 : 0;
}

function formatStatus(status: OrderStatus) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAmount(value: number | string) {
  return `Rs. ${Number(value).toFixed(2)}`;
}

function getNumber(order: Order, ...keys: string[]) {
  for (const key of keys) {
    const value = order[key];
    if (typeof value === "number" || typeof value === "string") return Number(value) || 0;
  }
  return 0;
}

function formatTimestamp(order: Order) {
  const value = order.createdAt ?? order.created_at;
  if (typeof value !== "string" || !value) return "Time unavailable";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? "Time unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}

function statusStyle(status: OrderStatus) {
  if (status === "ready" || status === "served") return { container: "bg-monochromatic-2", text: "text-white" };
  if (status === "awaiting_payment") return { container: "bg-monochromatic-8", text: "text-font-dark" };
  return { container: "bg-monochromatic-9", text: "text-font-dark" };
}

export default TableOrdersScreen;
