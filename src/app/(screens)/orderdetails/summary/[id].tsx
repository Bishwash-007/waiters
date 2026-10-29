import { Alert, Button, Header, Loading } from "@/components/ui";
import { useBranchStore, useOrderStore, usePaymentStore } from "@/stores/data-stores";
import type { Order } from "@/types/api";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const OrderSummaryScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrderStore((state) => state.selectedOrder);
  const tables = useBranchStore((state) => state.tables);
  const fetchTables = useBranchStore((state) => state.fetchTables);
  const fetchOne = useOrderStore((state) => state.fetchOne);
  const orderLoading = useOrderStore((state) => state.isLoading);
  const orderError = useOrderStore((state) => state.error);
  const payment = usePaymentStore((state) => state.checkout);
  const startCheckout = usePaymentStore((state) => state.startCheckout);
  const paymentLoading = usePaymentStore((state) => state.isLoading);
  const paymentError = usePaymentStore((state) => state.error);
  const clearPaymentError = usePaymentStore((state) => state.clearError);
  const insets = useSafeAreaInsets();

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      await fetchOne(id);
      const currentOrder = useOrderStore.getState().selectedOrder;
      const branchId = currentOrder?.branchId ?? currentOrder?.branch_id;
      if (branchId && !tables.length) await fetchTables(branchId);
    } catch (requestError) {
      console.error("Failed to load order summary.", requestError);
    }
  }, [fetchOne, fetchTables, id, tables.length]);

  useFocusEffect(
    useCallback(() => {
      void loadOrder();
    }, [loadOrder]),
  );

  const total = useMemo(() => Number(order?.totalAmount ?? order?.total_amount ?? 0), [order]);
  const subtotal = Number(order?.subtotal ?? 0);
  const tax = Number(order?.taxAmount ?? order?.tax_amount ?? 0);
  const discount = Number(order?.discountAmount ?? order?.discount_amount ?? 0);
  const error = orderError || paymentError;

  const checkout = async () => {
    if (!order) return;
    clearPaymentError();
    try {
      await startCheckout(order.id);
    } catch (requestError) {
      console.error("Failed to start checkout.", requestError);
    }
  };

  if (orderLoading && !order) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
        <Header title="Order summary" onBack={() => router.back()} />
        <Loading label="Loading summary..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header title="Order summary" subtitle="Review total and checkout" onBack={() => router.back()} />
      {order ? (
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pb-36 pt-5"
            showsVerticalScrollIndicator={false}
          >
            {error ? <Alert message={error} variant="error" onDismiss={clearPaymentError} /> : null}
            <View className="rounded-card border border-monochromatic-9 p-4 dark:border-monochromatic-2">
              <View className="mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">Table</Text>
                  <Text className="mt-1 font-gothic text-base font-semibold text-font-dark dark:text-white">
                    {getTableLabel(order, tables)}
                  </Text>
                </View>
                <Text className="font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
                  Order #{order.id.slice(0, 8)}
                </Text>
              </View>
              <View className="border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2">
                {order.items.length ? (
                  order.items.map((item) => (
                    <View className="pb-3" key={item.id}>
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">
                            {item.name}
                          </Text>
                          <Text className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
                            {item.quantity} × {formatAmount(Number(item.unit_price))}
                          </Text>
                          {item.notes ? (
                            <Text className="mt-1 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
                              Note: {item.notes}
                            </Text>
                          ) : null}
                          {item.modifiers.map((modifier) => (
                            <Text
                              className="mt-1 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7"
                              key={modifier.id}
                            >
                              {modifier.name} (+{formatAmount(Number(modifier.extra_price))})
                            </Text>
                          ))}
                        </View>
                        <Text className="font-gothic font-semibold text-font-dark dark:text-white">
                          {formatAmount(getItemSubtotal(item))}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
                    No items were returned for this order.
                  </Text>
                )}
              </View>
              <View className="mt-1 gap-3 border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2">
                <SummaryRow label="Subtotal" value={subtotal} />
                <SummaryRow label="Tax" value={tax} />
                <SummaryRow label="Discount" value={-discount} />
                <View className="border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2">
                  <SummaryRow label="Total" value={total} emphasis />
                </View>
              </View>
            </View>
            {payment ? (
              <View className="mt-4 rounded-card bg-monochromatic-9 p-4 dark:bg-monochromatic-2">
                <Text className="font-gothic text-heading-6 text-font-dark dark:text-white">Checkout started</Text>
                <Text className="mt-2 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
                  Scan or open the payment link to complete payment.
                </Text>
                <Text className="mt-3 font-gothic text-sm text-font-dark dark:text-white" selectable>
                  {payment.qr.data}
                </Text>
              </View>
            ) : null}
          </ScrollView>
          <View
            className="absolute bottom-0 left-0 right-0 gap-3 border-t border-monochromatic-9 bg-white px-4 pt-3 dark:border-monochromatic-2 dark:bg-monochromatic-1"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <Button loading={paymentLoading} onPress={() => void checkout()}>
              {payment ? "Refresh checkout" : "Start checkout"}
            </Button>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

function SummaryRow({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={`font-gothic ${emphasis ? "text-base font-semibold text-font-dark dark:text-white" : "text-sm text-monochromatic-5 dark:text-monochromatic-7"}`}
      >
        {label}
      </Text>
      <Text
        className={`font-gothic ${emphasis ? "text-heading-5 font-semibold text-font-dark dark:text-white" : "text-sm text-font-dark dark:text-white"}`}
      >
        Rs. {value.toFixed(2)}
      </Text>
    </View>
  );
}

function getItemSubtotal(item: {
  quantity: number;
  unit_price: number | string;
  modifiers: { extra_price: number | string }[];
}) {
  const modifiersTotal = item.modifiers.reduce((total, modifier) => total + Number(modifier.extra_price), 0);
  return (Number(item.unit_price) + modifiersTotal) * item.quantity;
}

function formatAmount(value: number) {
  return `Rs. ${value.toFixed(2)}`;
}

function getValue(order: Record<string, unknown>, ...keys: string[]) {
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
  return tables.find((table) => table.id === tableId)?.label ?? `Table ${tableId.slice(0, 8)}`;
}

export default OrderSummaryScreen;
