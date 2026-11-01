import { Alert, Button, EmptyState, Header, Loading } from "@/components/ui";
import { BottomSheet, Host } from "@expo/ui";
import { useAuthStore } from "@/stores/auth-store";
import { useOrderStore } from "@/stores/data-stores";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const TableCheckoutScreen = () => {
  const { tableId, tableLabel } = useLocalSearchParams<{ tableId: string; tableLabel?: string }>();
  const branchId = useAuthStore((state) => state.user?.branchId);
  const activeOrders = useOrderStore((state) => state.activeOrders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const error = useOrderStore((state) => state.error);
  const fetchActiveDetails = useOrderStore((state) => state.fetchActiveDetails);
  const clearError = useOrderStore((state) => state.clearError);
  const [paymentReady, setPaymentReady] = useState(false);
  const [isQrSheetOpen, setIsQrSheetOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const loadOrders = useCallback(async () => {
    if (!branchId || !tableId) return;
    clearError();
    try {
      await fetchActiveDetails(branchId, { force: true });
    } catch (requestError) {
      console.error("Failed to load combined bill orders.", requestError);
    }
  }, [branchId, clearError, fetchActiveDetails, tableId]);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  const tableOrders = useMemo(
    () => activeOrders.filter((order) => order.tableId === tableId || order.table_id === tableId),
    [activeOrders, tableId],
  );
  const billItems = useMemo(
    () =>
      tableOrders.flatMap((order) =>
        (order.items ?? []).map((item) => {
          const unitPrice = Number(item.unit_price);
          const modifierTotal = item.modifiers.reduce((sum, modifier) => sum + Number(modifier.extra_price), 0);
          const quantity = Number(item.quantity);
          return {
            orderId: order.id,
            name: item.name,
            quantity,
            unitPrice: unitPrice + modifierTotal,
            total: (unitPrice + modifierTotal) * quantity,
          };
        }),
      ),
    [tableOrders],
  );
  const subtotal = useMemo(() => billItems.reduce((sum, item) => sum + item.total, 0), [billItems]);
  const tax = useMemo(
    () => tableOrders.reduce((sum, order) => sum + Number(order.taxAmount ?? order.tax_amount ?? 0), 0),
    [tableOrders],
  );
  const total = subtotal + tax;
  const orderIds = tableOrders.map((order) => order.id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
        <Header title="Combined bill" onBack={() => router.back()} />
        <Loading label="Loading table bill..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header
        title="Combined bill"
        subtitle={`${tableLabel ? `Table ${tableLabel} · ` : ""}${orderIds.length} orders · Rs. ${total.toFixed(2)}`}
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-36 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Alert message={error} variant="error" actionLabel="Retry" onAction={() => void loadOrders()} />
        ) : null}
        {!tableOrders.length ? (
          <EmptyState
            title="No active orders"
            message="This table has no active orders to combine."
            actionLabel="Back to table orders"
            onAction={() => router.back()}
          />
        ) : null}
        <View className="rounded-card border border-monochromatic-9 p-4 dark:border-monochromatic-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">Included orders</Text>
            <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
              {orderIds.length} orders
            </Text>
          </View>
          {orderIds.map((orderId) => (
            <View
              className="mt-3 flex-row justify-between border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2"
              key={orderId}
            >
              <Text
                accessibilityLabel={`Order ${orderId}`}
                className="max-w-[65%] font-gothic text-sm text-font-dark dark:text-white"
                numberOfLines={1}
              >
                Order #{formatOrderId(orderId)}
              </Text>
              <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">Included</Text>
            </View>
          ))}
        </View>

        <View className="rounded-card border border-monochromatic-9 p-4 dark:border-monochromatic-2">
          <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">Items</Text>
          {billItems.map((item, index) => (
            <View
              className="mt-3 flex-row items-start justify-between gap-3 border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2"
              key={`${item.orderId}-${item.name}-${index}`}
            >
              <View className="flex-1">
                <Text className="font-gothic text-sm font-semibold text-font-dark dark:text-white">{item.name}</Text>
                <Text className="mt-1 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
                  {item.quantity} × Rs. {item.unitPrice.toFixed(2)} · Order #{formatOrderId(item.orderId)}
                </Text>
              </View>
              <Text className="font-gothic text-sm font-semibold text-font-dark dark:text-white">
                Rs. {item.total.toFixed(2)}
              </Text>
            </View>
          ))}
          <View className="mt-4 gap-3 border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2">
            <SummaryRow label="Subtotal" value={subtotal} />
            <SummaryRow label="Tax" value={tax} />
            <View className="border-t border-monochromatic-9 pt-3 dark:border-monochromatic-2">
              <SummaryRow label="Total" value={total} emphasis />
            </View>
          </View>
        </View>

        {paymentReady ? (
          <View className="rounded-card bg-monochromatic-9 p-4 dark:bg-monochromatic-2">
            <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">Payment is ready</Text>
            <Text className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
              Review the payment QR before collecting payment.
            </Text>
            <Button className="mt-3" variant="outline" onPress={() => setIsQrSheetOpen(true)}>
              View QR code
            </Button>
          </View>
        ) : null}
      </ScrollView>
      <View
        className="absolute bottom-0 left-0 right-0 gap-3 border-t border-monochromatic-9 bg-white px-4 pt-3 dark:border-monochromatic-2 dark:bg-monochromatic-1"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        {paymentReady ? (
          <Button onPress={() => router.replace("/(tabs)/tables")}>Confirm payment received</Button>
        ) : (
          <Button onPress={() => setPaymentReady(true)}>Prepare payment</Button>
        )}
      </View>
      <Host>
        <BottomSheet isPresented={isQrSheetOpen} onDismiss={() => setIsQrSheetOpen(false)} snapPoints={["half"]}>
          <View className="w-full gap-4 px-5 pb-8 pt-2">
            <Text className="w-full font-gothic text-heading-6 text-font-dark dark:text-white">Payment QR</Text>
            <Text className="w-full font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
              Scan this code to pay the combined bill of Rs. {total.toFixed(2)}.
            </Text>
            <View className="h-56 w-full items-center justify-center rounded-card bg-white">
              <Text className="font-gothic text-lg font-bold text-font-dark">QR PREVIEW</Text>
              <Text className="mt-1 text-center font-gothic text-xs text-monochromatic-5">
                demo-payment://table/{tableLabel ?? "table"}
              </Text>
            </View>
            <Text
              className="w-full text-center font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7"
              selectable
            >
              Payment link preview. The live provider QR will appear here when connected.
            </Text>
            <Pressable
              accessibilityRole="button"
              className="w-full items-center rounded-component bg-brand-5 px-4 py-3"
              onPress={() => setIsQrSheetOpen(false)}
            >
              <Text className="font-gothic font-semibold text-white">Close</Text>
            </Pressable>
          </View>
        </BottomSheet>
      </Host>
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
        className={`font-gothic ${emphasis ? "text-base font-semibold text-font-dark dark:text-white" : "text-sm text-font-dark dark:text-white"}`}
      >
        Rs. {value.toFixed(2)}
      </Text>
    </View>
  );
}

function formatOrderId(orderId: string) {
  return orderId.length > 8 ? `${orderId.slice(0, 8)}…` : orderId;
}

export default TableCheckoutScreen;
