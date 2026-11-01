import { create } from "zustand";
import { getApiErrorMessage } from "@/lib/api";
import { branchApi, menuApi, orderApi, paymentApi } from "@/services/api";
import type {
  Branch,
  Bill,
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

export interface FetchOptions {
  force?: boolean;
}

const CACHE_TTL_MS = 30_000;
const isFresh = (timestamp: number | undefined) => timestamp !== undefined && Date.now() - timestamp < CACHE_TTL_MS;
const branchCache = new Map<string, number>();
const tableCache = new Map<string, number>();
const menuCache = new Map<string, number>();
const activeOrderCache = new Map<string, number>();
const activeOrderDetailCache = new Map<string, number>();
const inFlight = new Map<string, Promise<void>>();

async function reuseRequest(key: string, request: () => Promise<void>) {
  const existing = inFlight.get(key);
  if (existing) return existing;
  const pending = request().finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

interface BranchState extends AsyncState {
  branches: Branch[];
  tables: RestaurantTable[];
  fetchBranches: (options?: FetchOptions) => Promise<void>;
  fetchTables: (branchId: string, options?: FetchOptions) => Promise<void>;
  clearError: () => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  tables: [],
  isLoading: false,
  error: null,
  fetchBranches: async (options) => {
    if (!options?.force && isFresh(branchCache.get("all")) && useBranchStore.getState().branches.length) return;
    return reuseRequest("branches", async () => {
      set({ isLoading: true, error: null });
      try {
        set({ branches: await branchApi.list(), isLoading: false });
        branchCache.set("all", Date.now());
      } catch (error) {
        set({ isLoading: false, error: getApiErrorMessage(error) });
        throw error;
      }
    });
  },
  fetchTables: async (branchId, options) => {
    if (!options?.force && isFresh(tableCache.get(branchId)) && useBranchStore.getState().tables.length) return;
    return reuseRequest(`tables:${branchId}`, async () => {
      set({ isLoading: true, error: null });
      try {
        set({ tables: await branchApi.tables(branchId), isLoading: false });
        tableCache.set(branchId, Date.now());
      } catch (error) {
        set({ isLoading: false, error: getApiErrorMessage(error) });
        throw error;
      }
    });
  },
  clearError: () => set({ error: null }),
}));

interface MenuState extends AsyncState {
  categories: MenuCategory[];
  items: MenuItem[];
  branchId: string | null;
  fetch: (branchId: string, options?: FetchOptions) => Promise<void>;
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
  fetch: async (branchId, options) => {
    const current = useMenuStore.getState();
    if (!options?.force && current.branchId === branchId && current.items.length && isFresh(menuCache.get(branchId)))
      return;
    return reuseRequest(`menu:${branchId}`, async () => {
      set({ isLoading: true, error: null });
      try {
        set({ ...normalizeMenu(await menuApi.branch(branchId)), branchId, isLoading: false });
        menuCache.set(branchId, Date.now());
      } catch (error) {
        set({ isLoading: false, error: getApiErrorMessage(error) });
        throw error;
      }
    });
  },
  clearError: () => set({ error: null }),
}));

interface OrderState extends AsyncState {
  activeOrders: Order[];
  orders: Order[];
  selectedOrder: OrderDetail | null;
  draftOrder: DraftOrder | null;
  fetchActive: (branchId: string, options?: FetchOptions) => Promise<void>;
  fetchActiveDetails: (branchId: string, options?: FetchOptions) => Promise<void>;
  fetchAll: (branchId: string, options?: FetchOptions) => Promise<void>;
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
  fetchActive: async (branchId, options) => {
    if (!options?.force && isFresh(activeOrderCache.get(branchId)) && useOrderStore.getState().activeOrders.length)
      return;
    return reuseRequest(`active-orders:${branchId}`, async () => {
      set({ isLoading: true, error: null });
      try {
        set({ activeOrders: await orderApi.active(branchId), isLoading: false });
        activeOrderCache.set(branchId, Date.now());
      } catch (error) {
        set({ isLoading: false, error: getApiErrorMessage(error) });
        throw error;
      }
    });
  },
  fetchActiveDetails: async (branchId, options) => {
    if (
      !options?.force &&
      isFresh(activeOrderDetailCache.get(branchId)) &&
      useOrderStore.getState().activeOrders.length
    )
      return;
    return reuseRequest(`active-order-details:${branchId}`, async () => {
      set({ isLoading: true, error: null });
      try {
        const summaries = await orderApi.active(branchId);
        const cachedOrders = useOrderStore.getState().activeOrders;
        const cachedById = new Map(cachedOrders.map((order) => [order.id, order]));
        const missingDetails = summaries.filter((order) => !cachedById.get(order.id)?.items?.length);
        const details = await orderApi.details(missingDetails.map((order) => order.id));
        const detailsById = new Map(details.map((order) => [order.id, order]));
        set({
          activeOrders: summaries.map((summary) => ({
            ...summary,
            ...(cachedById.get(summary.id)?.items?.length ? { items: cachedById.get(summary.id)?.items } : {}),
            ...(detailsById.get(summary.id) ?? {}),
          })),
          isLoading: false,
        });
        activeOrderDetailCache.set(branchId, Date.now());
      } catch (error) {
        set({ isLoading: false, error: getApiErrorMessage(error) });
        throw error;
      }
    });
  },
  fetchAll: async (branchId, options) => {
    if (!options?.force && isFresh(branchCache.get(`orders:${branchId}`)) && useOrderStore.getState().orders.length)
      return;
    return reuseRequest(`orders:${branchId}`, async () => {
      set({ isLoading: true, error: null });
      try {
        set({ orders: await orderApi.list(branchId), isLoading: false });
        branchCache.set(`orders:${branchId}`, Date.now());
      } catch (error) {
        set({ isLoading: false, error: getApiErrorMessage(error) });
        throw error;
      }
    });
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
      activeOrderCache.delete(input.branchId);
      activeOrderDetailCache.delete(input.branchId);
      branchCache.delete(`orders:${input.branchId}`);
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
      activeOrderCache.clear();
      activeOrderDetailCache.clear();
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
  bill: Bill | null;
  payments: Payment[];
  startBillCheckout: (branchId: string, tableId: string) => Promise<void>;
  fetchPayments: (orderId: string) => Promise<void>;
  clearBill: () => void;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  checkout: null,
  bill: null,
  payments: [],
  isLoading: false,
  error: null,
  startBillCheckout: async (branchId, tableId) => {
    set({ isLoading: true, error: null });
    try {
      const bill = await paymentApi.prepareBill({ branchId, tableId });
      const checkout = await paymentApi.checkoutBill(bill.billId);
      set({ bill, checkout, isLoading: false });
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
  clearBill: () => set({ bill: null, checkout: null }),
  clearError: () => set({ error: null }),
}));
