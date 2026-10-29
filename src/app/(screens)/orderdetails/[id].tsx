import { Alert, Button, Header, Loading } from "@/components/ui";
import { useBranchStore, useOrderStore } from "@/stores/data-stores";
import type { Order, OrderDetail, OrderStatus } from "@/types/api";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OrderDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrderStore((state) => state.selectedOrder);
  const tables = useBranchStore((state) => state.tables);
  const fetchTables = useBranchStore((state) => state.fetchTables);
  const isLoading = useOrderStore((state) => state.isLoading);
  const error = useOrderStore((state) => state.error);
  const fetchOne = useOrderStore((state) => state.fetchOne);
  const transition = useOrderStore((state) => state.transition);
  const clearError = useOrderStore((state) => state.clearError);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      await fetchOne(id);
      const currentOrder = useOrderStore.getState().selectedOrder;
      const branchId = currentOrder?.branchId ?? currentOrder?.branch_id;
      if (branchId && !tables.length) await fetchTables(branchId);
    } catch (requestError) {
      console.error("Failed to load order details.", requestError);
    }
  }, [fetchOne, fetchTables, id, tables.length]);

  useFocusEffect(
    useCallback(() => {
      void loadOrder();
    }, [loadOrder]),
  );

  const nextStatus = order ? getNextStatus(order.status) : null;
  const canCheckout = order?.status === "served" || order?.status === "awaiting_payment";
  const items = useMemo(() => (order ? normalizeOrderItems(order) : []), [order]);
  const renderItem = useCallback(({ item }: { item: OrderLine }) => <OrderDetailLine item={item} />, []);

  const changeStatus = async () => {
    if (!order || !nextStatus) return;
    try {
      await transition(order.id, nextStatus);
    } catch (requestError) {
      console.error("Failed to transition order.", requestError);
    }
  };

  if (isLoading && !order) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
        <Header title="Order details" onBack={() => router.back()} />
        <Loading label="Loading order..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header
        title={order ? `Order #${order.id.slice(0, 8)}` : "Order details"}
        subtitle={order ? getTableLabel(order, tables) : "Review order information"}
        onBack={() => router.back()}
      />
      {error && !order ? (
        <View className="p-4">
          <Alert
            message={error}
            variant="error"
            actionLabel="Retry"
            onAction={() => void loadOrder()}
            onDismiss={clearError}
          />
        </View>
      ) : order ? (
        <View className="flex-1">
          <FlatList
            contentContainerClassName="gap-4 px-4 pb-8 pt-4"
            data={items}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            ListHeaderComponent={
              <View className="gap-4">
                {error ? <Alert message={error} variant="error" onDismiss={clearError} /> : null}
                <View className="rounded-card bg-monochromatic-9 p-4 dark:bg-monochromatic-2">
                  <View className="flex-row items-start justify-between">
                    <View>
                      <Text className="font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
                        {getValue(order, "tableLabel", "table_label") ?? "Dine-in order"}
                      </Text>
                      <Text className="mt-1 font-gothic text-heading-5 text-font-dark dark:text-white">
                        {formatStatus(order.status)}
                      </Text>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${statusStyle(order.status).container}`}>
                      <Text className={`font-gothic text-xs font-semibold ${statusStyle(order.status).text}`}>
                        {formatStatus(order.status)}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-4 flex-row items-center">
                    {orderStages.map((stage, index) => {
                      const complete = orderStages.indexOf(order.status) >= index;
                      return (
                        <View className="flex-1 flex-row items-center" key={stage}>
                          <View className={`h-2 w-2 rounded-full ${complete ? "bg-brand-5" : "bg-monochromatic-7"}`} />
                          {index < orderStages.length - 1 ? (
                            <View className={`h-px flex-1 ${complete ? "bg-brand-5" : "bg-monochromatic-7"}`} />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                  <View className="mt-2 flex-row justify-between">
                    {orderStages.map((stage) => (
                      <Text
                        className="font-gothic text-[9px] text-monochromatic-5 dark:text-monochromatic-7"
                        key={stage}
                      >
                        {shortStatus(stage)}
                      </Text>
                    ))}
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="font-gothic text-heading-6 text-font-dark dark:text-white">Items</Text>
                  <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
                    {items.length} {items.length === 1 ? "line" : "lines"}
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <Text className="py-8 text-center font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
                No items were returned for this order.
              </Text>
            }
            renderItem={renderItem}
          />
          <View className="gap-3 border-t border-monochromatic-9 bg-white px-4 pb-4 pt-3 dark:border-monochromatic-2 dark:bg-monochromatic-1">
            {nextStatus ? (
              <Button
                loading={isLoading}
                onPress={() => void changeStatus()}
              >{`Mark ${formatStatus(nextStatus)}`}</Button>
            ) : null}
            {order.status !== "completed" && order.status !== "cancelled" ? (
              <Button
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: "/(screens)/ordertaking/[tableId]",
                    params: {
                      tableId: order.tableId ?? order.table_id ?? "",
                      tableLabel: getValue(order, "tableLabel", "table_label") ?? "",
                    },
                  })
                }
              >
                Add items / New order
              </Button>
            ) : null}
            {canCheckout ? (
              <Button
                variant={nextStatus ? "outline" : "fill"}
                onPress={() =>
                  router.push({ pathname: "/(screens)/orderdetails/summary/[id]", params: { id: order.id } })
                }
              >
                Review total and checkout
              </Button>
            ) : null}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const OrderDetailLine = memo(function OrderDetailLine({ item }: { item: OrderLine }) {
  return (
    <View className="border-b border-monochromatic-9 pb-3 dark:border-monochromatic-2">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">{item.name}</Text>
          <Text className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
            {item.quantity} × {formatAmount(item.unitPrice)}
          </Text>
          {item.notes ? (
            <Text className="mt-1 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
              Note: {item.notes}
            </Text>
          ) : null}
          {item.modifiers.map((modifier) => (
            <Text className="mt-1 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7" key={modifier.id}>
              {modifier.name} (+{formatAmount(modifier.extra_price)})
            </Text>
          ))}
        </View>
        <Text className="font-gothic font-semibold text-font-dark dark:text-white">{formatAmount(item.subtotal)}</Text>
      </View>
    </View>
  );
});

type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  modifiers: OrderDetail["items"][number]["modifiers"];
  subtotal: number;
};

function normalizeOrderItems(order: OrderDetail): OrderLine[] {
  return (order.items ?? []).map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);
    const modifiersTotal = item.modifiers.reduce((total, modifier) => total + Number(modifier.extra_price), 0);
    return {
      id: item.id,
      name: item.name,
      quantity,
      unitPrice,
      notes: item.notes ?? undefined,
      modifiers: item.modifiers ?? [],
      subtotal: (unitPrice + modifiersTotal) * quantity,
    };
  });
}

function getValue(order: Order, ...keys: string[]) {
  for (const key of keys) {
    const value = order[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

function getTableLabel(order: Order, tables: { id: string; label: string }[]) {
  const label = getValue(order, "tableLabel", "table_label");
  if (label) return label;
  const tableId = getValue(order, "tableId", "table_id");
  if (!tableId) return "Dine-in order";
  const table = tables.find((entry) => entry.id === tableId);
  return `Table ${table?.label ?? tableId.slice(0, 8)}`;
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
  const next: Partial<Record<OrderStatus, OrderStatus>> = {
    placed: "confirmed",
    confirmed: "preparing",
    preparing: "ready",
    ready: "served",
    served: "awaiting_payment",
  };
  return next[status] ?? null;
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

const orderStages: OrderStatus[] = ["placed", "confirmed", "preparing", "ready", "served", "awaiting_payment"];

function shortStatus(status: OrderStatus) {
  return status === "awaiting_payment" ? "Payment" : status.charAt(0).toUpperCase() + status.slice(1);
}

function statusStyle(status: OrderStatus) {
  if (status === "ready" || status === "served") return { container: "bg-monochromatic-2", text: "text-white" };
  if (status === "awaiting_payment") return { container: "bg-monochromatic-8", text: "text-font-dark" };
  return { container: "bg-white", text: "text-font-dark" };
}

function formatAmount(value: number | string) {
  return `Rs. ${Number(value).toFixed(2)}`;
}

export default OrderDetailsScreen;
