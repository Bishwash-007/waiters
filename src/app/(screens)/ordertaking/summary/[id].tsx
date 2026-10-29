import { IconButton } from "@/components/ui/remaining";
import { Alert, Button, Header } from "@/components/ui";
import { iconMap } from "@/constants/icons";
import { IconRenderer } from "@/components/icon";
import { useOrderStore } from "@/stores/data-stores";
import type { CreateOrderInput } from "@/types/api";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const OrderSummaryScreen = () => {
  const draft = useOrderStore((state) => state.draftOrder);
  const createOrder = useOrderStore((state) => state.create);
  const transitionOrder = useOrderStore((state) => state.transition);
  const isLoading = useOrderStore((state) => state.isLoading);
  const error = useOrderStore((state) => state.error);
  const clearError = useOrderStore((state) => state.clearError);
  const setDraftOrder = useOrderStore((state) => state.setDraftOrder);
  const clearDraftOrder = useOrderStore((state) => state.clearDraftOrder);
  const insets = useSafeAreaInsets();

  const subtotal = useMemo(
    () => draft?.lines.reduce((total, line) => total + Number(line.item.price) * line.quantity, 0) ?? 0,
    [draft],
  );
  const itemCount = draft?.lines.reduce((total, line) => total + line.quantity, 0) ?? 0;

  const updateQuantity = (lineIndex: number, change: number) => {
    if (!draft) return;
    const lines = draft.lines
      .map((line, index) => (index === lineIndex ? { ...line, quantity: Math.max(0, line.quantity + change) } : line))
      .filter((line) => line.quantity > 0);
    setDraftOrder({ ...draft, lines });
  };

  const placeOrder = async () => {
    if (!draft?.lines.length) return;
    const createInput: CreateOrderInput = {
      branchId: draft.branchId,
      tableId: draft.tableId,
      orderType: "dine_in",
      clientActionId: createUuid(),
      items: draft.lines.map((line) => ({
        menuItemId: line.item.id,
        quantity: line.quantity,
        ...(line.notes.trim() ? { notes: line.notes.trim() } : {}),
      })),
      taxAmount: 0,
      discountAmount: 0,
    };

    clearError();
    try {
      const order = await createOrder(createInput);
      await transitionOrder(order.id, "confirmed");
      clearDraftOrder();
      router.replace({ pathname: "/(screens)/orderdetails/[id]", params: { id: order.id } });
    } catch (requestError) {
      console.error("Failed to place order.", requestError);
    }
  };

  if (!draft) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
        <Header title="Order summary" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-gothic text-base text-font-dark dark:text-white">
            Your order draft is no longer available.
          </Text>
          <Button className="mt-4" onPress={() => router.replace("/(tabs)/tables")}>
            Back to tables
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header
        title="Order summary"
        subtitle={draft.tableLabel ? `Table ${draft.tableLabel}` : "Review before placing"}
        onBack={() => router.back()}
      />
      <FlatList
        className="flex-1"
        contentContainerClassName="gap-3 px-4 pb-40 pt-4"
        data={draft.lines}
        keyExtractor={(line) => line.item.id}
        ListHeaderComponent={
          <View className="mb-1">
            <Text className="font-gothic text-heading-5 text-font-dark dark:text-white">Review your order</Text>
            <Text className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
              {itemCount} {itemCount === 1 ? "item" : "items"} selected
            </Text>
            {error ? (
              <View className="mt-3">
                <Alert message={error} variant="error" onDismiss={clearError} />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View className="rounded-card border border-monochromatic-9 bg-white p-4 dark:border-monochromatic-2 dark:bg-monochromatic-2">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-component bg-monochromatic-9 dark:bg-monochromatic-3">
                <IconRenderer icon={iconMap.shoppingBag} size={20} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">
                  {item.item.name}
                </Text>
                <Text className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
                  {formatAmount(Number(item.item.price) * item.quantity)}
                </Text>
                {item.notes ? (
                  <Text className="mt-1 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
                    Note: {item.notes}
                  </Text>
                ) : null}
              </View>
              <View className="flex-row items-center gap-1">
                <IconButton
                  icon="minus"
                  label={`Remove one ${item.item.name}`}
                  onPress={() => updateQuantity(index, -1)}
                />
                <Text className="min-w-5 text-center font-gothic font-semibold text-font-dark dark:text-white">
                  {item.quantity}
                </Text>
                <IconButton icon="plus" label={`Add one ${item.item.name}`} onPress={() => updateQuantity(index, 1)} />
              </View>
            </View>
          </View>
        )}
      />
      <View
        className="border-t border-monochromatic-9 bg-white px-4 pt-3 dark:border-monochromatic-2 dark:bg-monochromatic-1"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-gothic text-base text-monochromatic-5 dark:text-monochromatic-7">Total</Text>
          <Text className="font-gothic text-heading-4 text-font-dark dark:text-white">{formatAmount(subtotal)}</Text>
        </View>
        <Button loading={isLoading} disabled={!draft.lines.length} onPress={() => void placeOrder()}>
          Confirm and place order
        </Button>
      </View>
    </SafeAreaView>
  );
};

function formatAmount(value: number) {
  return `Rs. ${value.toFixed(2)}`;
}

function createUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export default OrderSummaryScreen;
