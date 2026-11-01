import { IconButton } from "@/components/ui/remaining";
import { Alert, Header, Loading, SearchInput } from "@/components/ui";
import { IconRenderer } from "@/components/icon";
import { iconMap } from "@/constants/icons";
import { useAuthStore } from "@/stores/auth-store";
import { useBranchStore, useMenuStore, useOrderStore } from "@/stores/data-stores";
import { useLazyList } from "@/hooks/use-lazy-list";
import type { MenuItem } from "@/types/api";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type CartLine = {
  item: MenuItem;
  quantity: number;
  notes: string;
};

const OrderTakingScreen = () => {
  const { tableId, tableLabel } = useLocalSearchParams<{
    tableId: string;
    tableLabel?: string;
  }>();
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const fetchBranches = useBranchStore((state) => state.fetchBranches);
  const menuItems = useMenuStore((state) => state.items);
  const menuCategories = useMenuStore((state) => state.categories);
  const menuLoading = useMenuStore((state) => state.isLoading);
  const menuError = useMenuStore((state) => state.error);
  const fetchMenu = useMenuStore((state) => state.fetch);
  const clearMenuError = useMenuStore((state) => state.clearError);
  const setDraftOrder = useOrderStore((state) => state.setDraftOrder);
  const [branchId, setBranchId] = useState<string | null>(user?.branchId ?? null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const insets = useSafeAreaInsets();

  const loadMenu = useCallback(async () => {
    clearMenuError();
    try {
      let selectedBranchId = branchId;
      if (!selectedBranchId) {
        const currentBranches = branches.length
          ? branches
          : await fetchBranches().then(() => useBranchStore.getState().branches);
        selectedBranchId = user?.branchId ?? currentBranches[0]?.id ?? null;
        setBranchId(selectedBranchId);
      }
      if (selectedBranchId) await fetchMenu(selectedBranchId);
    } catch (error) {
      console.error("Failed to load menu.", error);
    }
  }, [branchId, branches, clearMenuError, fetchBranches, fetchMenu, user]);

  useFocusEffect(
    useCallback(() => {
      void loadMenu();
    }, [loadMenu]),
  );

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory = !categoryId || item.categoryId === categoryId;
      const matchesSearch =
        !query || item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch && item.isAvailable !== false;
    });
  }, [categoryId, menuItems, search]);
  const { visibleItems: lazyVisibleItems, hasMore, loadMore } = useLazyList(visibleItems);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + Number(line.item.price) * line.quantity, 0);

  const updateQuantity = (item: MenuItem, change: number) => {
    setCart((current) => {
      const existing = current.find((line) => line.item.id === item.id);
      if (!existing && change > 0) return [...current, { item, quantity: 1, notes: "" }];
      return current
        .map((line) => (line.item.id === item.id ? { ...line, quantity: Math.max(0, line.quantity + change) } : line))
        .filter((line) => line.quantity > 0);
    });
  };

  const updateNotes = (itemId: string, notes: string) => {
    setCart((current) => current.map((line) => (line.item.id === itemId ? { ...line, notes } : line)));
  };

  const getQuantity = (itemId: string) => cart.find((line) => line.item.id === itemId)?.quantity ?? 0;

  const openSummary = () => {
    if (!branchId || !tableId || !cart.length) return;
    setDraftOrder({ branchId, tableId, tableLabel, lines: cart });
    router.push({
      pathname: "/(screens)/ordertaking/summary/[id]",
      params: { id: tableId },
    });
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const quantity = getQuantity(item.id);
    return (
      <View className="mb-3 rounded-card border border-monochromatic-9 bg-white p-4 dark:border-monochromatic-2 dark:bg-monochromatic-2">
        <View className="flex-row gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-component bg-monochromatic-9 dark:bg-monochromatic-3">
            <IconRenderer icon={iconMap.shoppingBag} size={22} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-gothic text-base font-semibold text-font-dark dark:text-white">{item.name}</Text>
            {item.description ? (
              <Text
                className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7"
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
            <Text className="mt-2 font-gothic text-sm font-semibold text-font-dark dark:text-white">
              {formatAmount(item.price)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <IconButton
              icon="minus"
              label={`Remove one ${item.name}`}
              disabled={!quantity}
              onPress={() => updateQuantity(item, -1)}
            />
            <Text className="min-w-5 text-center font-gothic font-semibold text-font-dark dark:text-white">
              {quantity}
            </Text>
            <IconButton icon="plus" label={`Add one ${item.name}`} onPress={() => updateQuantity(item, 1)} />
          </View>
        </View>
        {showNotes && quantity ? (
          <TextInput
            accessibilityLabel={`Notes for ${item.name}`}
            className="mt-3 min-h-10 rounded-component border border-monochromatic-8 px-3 py-2 font-gothic text-sm text-font-dark dark:border-monochromatic-4 dark:text-white"
            onChangeText={(notes) => updateNotes(item.id, notes)}
            placeholder="Item note, e.g. no sugar"
            placeholderTextColor="#808080"
            value={cart.find((line) => line.item.id === item.id)?.notes ?? ""}
          />
        ) : null}
      </View>
    );
  };

  const error = menuError;
  if (menuLoading && !menuItems.length) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
        <Header
          title="New order"
          subtitle={tableLabel ? `Table ${tableLabel}` : "Choose menu items"}
          onBack={() => router.back()}
        />
        <Loading label="Loading menu..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header
        title="New order"
        subtitle={tableLabel ? `Table ${tableLabel}` : "Choose menu items"}
        onBack={() => router.back()}
      />
      <View className="flex-1">
        <FlatList
          contentContainerClassName="px-4 pb-40 pt-4"
          data={lazyVisibleItems}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          ListHeaderComponent={
            <View className="mb-4 gap-3">
              {error ? (
                <Alert
                  message={error}
                  variant="error"
                  actionLabel="Retry"
                  onAction={() => void loadMenu()}
                  onDismiss={() => {
                    clearMenuError();
                  }}
                />
              ) : null}
              <SearchInput value={search} onChangeText={setSearch} placeholder="Search menu" />
              {menuCategories.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                  <CategoryPill active={!categoryId} label="All" onPress={() => setCategoryId(null)} />
                  {menuCategories.map((category) => (
                    <CategoryPill
                      active={categoryId === category.id}
                      key={category.id}
                      label={category.name}
                      onPress={() => setCategoryId(category.id)}
                    />
                  ))}
                </ScrollView>
              ) : null}
              <View className="flex-row items-center justify-between">
                <Text className="font-gothic text-heading-6 text-font-dark dark:text-white">Menu</Text>
                <Pressable onPress={() => setShowNotes((current) => !current)}>
                  <Text className="font-gothic text-sm font-semibold text-font-dark dark:text-white">
                    {showNotes ? "Hide notes" : "Add notes"}
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center px-6 py-10">
              <IconRenderer icon={iconMap.search} size={32} />
              <Text className="mt-3 font-gothic text-base font-semibold text-font-dark dark:text-white">
                No menu items found
              </Text>
              <Text className="mt-1 text-center font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
                Try another search or category.
              </Text>
            </View>
          }
          renderItem={renderMenuItem}
          ListFooterComponent={hasMore ? <Loading label="Loading more menu items..." /> : undefined}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          windowSize={7}
        />
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-monochromatic-9 bg-white px-4 pt-3 dark:border-monochromatic-2 dark:bg-monochromatic-1"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </Text>
              <Text className="font-gothic text-heading-5 text-font-dark dark:text-white">
                {formatAmount(subtotal)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !cart.length }}
              className={`flex-row items-center gap-2 rounded-component bg-brand-5 px-5 py-3 ${!cart.length ? "opacity-50" : ""}`}
              disabled={!cart.length}
              onPress={openSummary}
            >
              <IconRenderer color="#FFFFFF" icon={iconMap.arrowRight} size={18} />
              <Text className="font-gothic font-semibold text-white">Review order</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

function CategoryPill({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      className={`rounded-full border px-4 py-2 ${active ? "border-brand-5 bg-brand-5" : "border-monochromatic-8 bg-white dark:border-monochromatic-3 dark:bg-monochromatic-2"}`}
      onPress={onPress}
    >
      <Text className={`font-gothic text-sm font-semibold ${active ? "text-white" : "text-font-dark dark:text-white"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function formatAmount(value: number | string) {
  return `Rs. ${Number(value).toFixed(2)}`;
}

export default OrderTakingScreen;
