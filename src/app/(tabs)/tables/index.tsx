import { EmptyState, Header, Loading, SearchInput } from "@/components/ui";
import { IconRenderer } from "@/components/icon";
import { iconMap } from "@/constants/icons";
import { useAuthStore } from "@/stores/auth-store";
import { useBranchStore } from "@/stores/data-stores";
import { useLazyList } from "@/hooks/use-lazy-list";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RestaurantTable } from "@/types/api";

const TableScreen = () => {
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const tables = useBranchStore((state) => state.tables);
  const isLoading = useBranchStore((state) => state.isLoading);
  const error = useBranchStore((state) => state.error);
  const fetchBranches = useBranchStore((state) => state.fetchBranches);
  const fetchTables = useBranchStore((state) => state.fetchTables);
  const clearError = useBranchStore((state) => state.clearError);
  const [branchId, setBranchId] = useState<string | null>(user?.branchId ?? null);
  const [search, setSearch] = useState("");

  const loadTables = useCallback(
    async (force = false) => {
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
          await fetchTables(selectedBranchId, { force });
        }
      } catch (error) {
        console.error("Failed to load tables.", error);
      }
    },
    [branchId, branches, clearError, fetchBranches, fetchTables, user],
  );

  useFocusEffect(
    useCallback(() => {
      void loadTables();
    }, [loadTables]),
  );

  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tables;
    return tables.filter((table) => table.label.toLowerCase().includes(query));
  }, [search, tables]);
  const { visibleItems, hasMore, loadMore } = useLazyList(filteredTables);

  const openTable = (table: RestaurantTable) => {
    router.push({
      pathname: "/tableorders/[tableId]",
      params: { tableId: table.id, tableLabel: table.label },
    });
  };

  const renderTable = ({ item }: { item: RestaurantTable }) => {
    const status = getTableStatus(item);
    return (
      <Pressable
        accessibilityLabel={`Open ${item.label}, ${status.label}`}
        accessibilityRole="button"
        className="mb-3 w-[48%] rounded-card border border-monochromatic-9 bg-white p-4 active:opacity-70 dark:border-monochromatic-2 dark:bg-monochromatic-2"
        onPress={() => openTable(item)}
      >
        <View className="mb-6 flex-row items-start justify-between">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-monochromatic-9 dark:bg-monochromatic-3">
            <IconRenderer icon={iconMap.table} size={22} />
          </View>
          <View className={`rounded-full px-2 py-1 ${status.containerClass}`}>
            <Text className={`font-gothic text-xs font-semibold ${status.textClass}`}>{status.label}</Text>
          </View>
        </View>
        <Text className="font-gothic text-heading-6 text-font-dark dark:text-white" numberOfLines={1}>
          {item.label}
        </Text>
        <Text className="mt-1 font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
          {status.description}
        </Text>
      </Pressable>
    );
  };

  const content = () => {
    if (isLoading && !tables.length) return <Loading label="Loading tables..." />;
    if (error && !tables.length) {
      return (
        <EmptyState
          title="Could not load tables"
          message={error}
          actionLabel="Try again"
          icon="refresh"
          onAction={() => void loadTables()}
        />
      );
    }
    if (!tables.length) {
      return <EmptyState title="No tables yet" message="There are no active tables in this branch." icon="grid" />;
    }
    if (!filteredTables.length) {
      return <EmptyState title="No matching tables" message="Try a different table number or name." icon="search" />;
    }
    return (
      <FlatList
        contentContainerClassName="px-4 pb-8 pt-4"
        data={visibleItems}
        keyExtractor={(item) => item.id}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        numColumns={2}
        columnWrapperClassName="justify-between"
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        removeClippedSubviews
        renderItem={renderTable}
        ListFooterComponent={hasMore ? <Loading label="Loading more tables..." /> : undefined}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void loadTables(true)} />}
        showsVerticalScrollIndicator={false}
        windowSize={7}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top"]}>
      <Header title="Tables" subtitle="Select a table to start an order" />
      <View className="border-b border-monochromatic-9 px-4 pb-3 pt-2 dark:border-monochromatic-2">
        <SearchInput value={search} onChangeText={setSearch} />
        {branches.length > 1 ? (
          <Text className="mt-2 font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">
            {branches.find((branch) => branch.id === branchId)?.name ?? "Current branch"}
          </Text>
        ) : null}
      </View>
      {content()}
    </SafeAreaView>
  );
};

function getTableStatus(table: RestaurantTable) {
  const value = String(table.status ?? (table.isActive === false ? "inactive" : "available")).toLowerCase();
  if (value.includes("occup") || value.includes("billing")) {
    const isBilling = value.includes("billing");
    return {
      label: isBilling ? "Billing" : "Occupied",
      description: isBilling ? "Payment due" : "Order in progress",
      isAvailable: false,
      containerClass: "bg-monochromatic-2",
      textClass: "text-white",
    };
  }
  if (value.includes("reserv")) {
    return {
      label: "Reserved",
      description: "Reserved for a guest",
      isAvailable: false,
      containerClass: "bg-monochromatic-8",
      textClass: "text-font-dark",
    };
  }
  if (value.includes("inactive") || value.includes("service")) {
    return {
      label: "Unavailable",
      description: "Not available",
      isAvailable: false,
      containerClass: "bg-monochromatic-9",
      textClass: "text-monochromatic-5",
    };
  }
  return {
    label: "Available",
    description: "Ready for order",
    isAvailable: true,
    containerClass: "bg-monochromatic-9",
    textClass: "text-font-dark",
  };
}

export default TableScreen;
