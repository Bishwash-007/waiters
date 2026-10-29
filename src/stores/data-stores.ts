import { create } from "zustand";
import { getApiErrorMessage } from "@/lib/api";
import { branchApi, menuApi, orderApi, paymentApi } from "@/services/api";
import type {
  Branch,
  CheckoutResult,
  CreateOrderInput,
  MenuCategory,
  MenuItem,
  Order,
  OrderDetail,
  Payment,
  RestaurantTable,
} from "@/types/api";

interface AsyncState {
  isLoading: boolean;
  error: string | null;
}

interface BranchState extends AsyncState {
  branches: Branch[];
  tables: RestaurantTable[];
  fetchBranches: () => Promise<void>;
  fetchTables: (branchId: string) => Promise<void>;
  clearError: () => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  tables: [],
  isLoading: false,
  error: null,
  fetchBranches: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ branches: await branchApi.list(), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  fetchTables: async (branchId) => {
    set({ isLoading: true, error: null });
    try {
      set({ tables: await branchApi.tables(branchId), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  clearError: () => set({ error: null }),
}));

interface MenuState extends AsyncState {
  categories: MenuCategory[];
  items: MenuItem[];
  branchId: string | null;
  fetch: (branchId: string) => Promise<void>;
  clearError: () => void;
}

const normalizeMenu = (data: MenuCategory[] | MenuItem[]) => {
  const categories = data.filter((entry): entry is MenuCategory => "items" in entry);
  const items = data.filter((entry): entry is MenuItem => !("items" in entry));
  return {
    categories,
    items: items.length
      ? items
      : categories.flatMap((category) =>
          (category.items ?? []).map((item) => ({
            ...item,
            categoryId: item.categoryId ?? category.id,
          })),
        ),
  };
};

export const useMenuStore = create<MenuState>((set) => ({
  categories: [],
  items: [],
  branchId: null,
  isLoading: false,
  error: null,
  fetch: async (branchId) => {
    const current = useMenuStore.getState();
    if (current.branchId === branchId && current.items.length) return;
    set({ isLoading: true, error: null });
    try {
      set({ ...normalizeMenu(await menuApi.branch(branchId)), branchId, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  clearError: () => set({ error: null }),
}));

interface OrderState extends AsyncState {
  activeOrders: Order[];
  orders: Order[];
  selectedOrder: OrderDetail | null;
  draftOrder: DraftOrder | null;
  fetchActive: (branchId: string) => Promise<void>;
  fetchActiveDetails: (branchId: string) => Promise<void>;
  fetchAll: (branchId: string) => Promise<void>;
  fetchOne: (orderId: string) => Promise<void>;
  create: (input: CreateOrderInput) => Promise<Order>;
  setDraftOrder: (draft: DraftOrder) => void;
  clearDraftOrder: () => void;
  transition: (orderId: string, status: Order["status"]) => Promise<void>;
  clearError: () => void;
}

export interface DraftOrderLine {
  item: MenuItem;
  quantity: number;
  notes: string;
}

export interface DraftOrder {
  branchId: string;
  tableId: string;
  tableLabel?: string;
  lines: DraftOrderLine[];
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrders: [],
  orders: [],
  selectedOrder: null,
  draftOrder: null,
  isLoading: false,
  error: null,
  fetchActive: async (branchId) => {
    set({ isLoading: true, error: null });
    try {
      set({ activeOrders: await orderApi.active(branchId), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  fetchActiveDetails: async (branchId) => {
    set({ isLoading: true, error: null });
    try {
      const summaries = await orderApi.active(branchId);
      const cachedOrders = useOrderStore.getState().activeOrders;
      const cachedById = new Map(cachedOrders.map((order) => [order.id, order]));
      const missingDetails = summaries.filter((order) => !cachedById.get(order.id)?.items?.length);
      const details = await Promise.all(missingDetails.map((order) => orderApi.get(order.id)));
      const detailsById = new Map(details.map((order) => [order.id, order]));
      set({
        activeOrders: summaries.map((summary) => ({
          ...summary,
          ...(cachedById.get(summary.id)?.items?.length ? { items: cachedById.get(summary.id)?.items } : {}),
          ...(detailsById.get(summary.id) ?? {}),
        })),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  fetchAll: async (branchId) => {
    set({ isLoading: true, error: null });
    try {
      set({ orders: await orderApi.list(branchId), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  fetchOne: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      set({ selectedOrder: await orderApi.get(orderId), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  create: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderApi.create(input);
      set((state) => ({
        orders: [order, ...state.orders],
        activeOrders: [order, ...state.activeOrders],
        isLoading: false,
      }));
      return order;
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  setDraftOrder: (draftOrder) => set({ draftOrder }),
  clearDraftOrder: () => set({ draftOrder: null }),
  transition: async (orderId, status) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderApi.transition(orderId, status);
      set((state) => ({
        selectedOrder: state.selectedOrder?.id === orderId ? { ...state.selectedOrder, ...order } : state.selectedOrder,
        orders: state.orders.map((item) => (item.id === orderId ? order : item)),
        activeOrders:
          order.status === "completed" || order.status === "cancelled"
            ? state.activeOrders.filter((item) => item.id !== orderId)
            : state.activeOrders.map((item) => (item.id === orderId ? order : item)),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  clearError: () => set({ error: null }),
}));

interface PaymentState extends AsyncState {
  checkout: CheckoutResult | null;
  payments: Payment[];
  startCheckout: (orderId: string) => Promise<void>;
  fetchPayments: (orderId: string) => Promise<void>;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  checkout: null,
  payments: [],
  isLoading: false,
  error: null,
  startCheckout: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      set({ checkout: await paymentApi.checkout(orderId), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  fetchPayments: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      set({ payments: await paymentApi.forOrder(orderId), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },
  clearError: () => set({ error: null }),
}));
