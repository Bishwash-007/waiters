import { api } from "@/lib/api";
import type {
  AuthSession,
  AuthUser,
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

export interface LoginInput {
  email: string;
  password: string;
}

export interface OnboardingInput {
  orgName: string;
  slug: string;
  planId?: string;
  firstBranch: { name: string; address?: string };
  defaultTables?: number;
  owner: { email: string; password: string };
}

export interface OnboardingResult {
  tenantId: string;
  slug: string;
  branchId: string;
  tableIds: string[];
  ownerUserId: string;
}

export const authApi = {
  login: async (tenant: string, input: LoginInput) =>
    (await api.post<AuthSession>("/auth/login", input, { headers: { "X-Tenant-Id": tenant } })).data,
  refresh: async (tenant: string, token: string) =>
    (await api.post<AuthSession>("/auth/refresh", { refreshToken: token }, { headers: { "X-Tenant-Id": tenant } }))
      .data,
  logout: async (refreshToken: string) => {
    await api.post("/auth/logout", { refreshToken });
  },
  me: async () => (await api.get<AuthUser>("/auth/me")).data,
  onboard: async (input: OnboardingInput) => (await api.post<OnboardingResult>("/onboarding", input)).data,
};

export const branchApi = {
  list: async () => (await api.get<Branch[]>("/branches")).data,
  tables: async (branchId: string) => (await api.get<RestaurantTable[]>(`/branches/${branchId}/tables`)).data,
};

export const menuApi = {
  branch: async (branchId: string) => (await api.get<MenuCategory[] | MenuItem[]>(`/menu/branches/${branchId}`)).data,
  publicBranch: async (branchId: string, tenant: string) =>
    (await api.get<MenuCategory[] | MenuItem[]>(`/menu/public/${branchId}`, { headers: { "X-Tenant-Id": tenant } }))
      .data,
};

export const orderApi = {
  create: async (input: CreateOrderInput) => (await api.post<Order>("/orders", input)).data,
  active: async (branchId: string) => (await api.get<Order[]>(`/orders/branches/${branchId}/active`)).data,
  activeDetails: async (branchId: string) => {
    const orders = await orderApi.active(branchId);
    return Promise.all(orders.map((order) => orderApi.get(order.id)));
  },
  list: async (branchId: string) => (await api.get<Order[]>(`/orders/branches/${branchId}`)).data,
  get: async (orderId: string) => {
    const response = await api.get<unknown>(`/orders/${orderId}`);
    return normalizeOrder(response.data);
  },
  transition: async (orderId: string, status: Order["status"]) =>
    (await api.post<Order>(`/orders/${orderId}/transition`, { status })).data,
};

function normalizeOrder(response: unknown): OrderDetail {
  const envelope = isRecord(response) ? response : {};
  const data = isRecord(envelope.data) ? envelope.data : undefined;
  const nested = isRecord(envelope.order) ? envelope.order : undefined;
  const dataOrder = data && isRecord(data.order) ? data.order : undefined;
  const order = isOrder(response) ? response : (nested ?? dataOrder ?? (data && isOrder(data) ? data : undefined));
  if (!order) {
    throw new Error("The order API returned an invalid response.");
  }
  const normalizedOrder: Order = {
    ...order,
    id: String(order.id),
    branchId: String(order.branchId ?? order.branch_id ?? ""),
    status: order.status as Order["status"],
  };
  const itemSources = [
    normalizedOrder.items,
    normalizedOrder.orderItems,
    normalizedOrder.order_items,
    envelope.items,
    envelope.orderItems,
    envelope.order_items,
    data?.items,
    data?.orderItems,
    data?.order_items,
    dataOrder?.items,
    dataOrder?.orderItems,
    dataOrder?.order_items,
  ];
  const rawItems = itemSources.find((value) => Array.isArray(value) && value.length > 0);
  const items = Array.isArray(rawItems)
    ? rawItems.map(normalizeOrderItem).filter((item): item is OrderDetail["items"][number] => item !== null)
    : [];

  console.info("[ORDER DETAIL] normalized response", {
    responseKeys: Object.keys(envelope),
    orderKeys: Object.keys(normalizedOrder),
    itemCount: items.length,
    itemSource: itemSources.findIndex((value) => value === rawItems),
  });

  return { ...normalizedOrder, items };
}

function normalizeOrderItem(value: unknown): OrderDetail["items"][number] | null {
  if (!isRecord(value)) return null;
  const modifiers = Array.isArray(value.modifiers)
    ? value.modifiers.filter(isRecord).map((modifier) => ({
        id: String(modifier.id ?? modifier.modifier_id ?? ""),
        modifier_id: typeof modifier.modifier_id === "string" ? modifier.modifier_id : null,
        name: String(modifier.name ?? modifier.option_name ?? modifier.optionName ?? "Modifier"),
        extra_price: (modifier.extra_price ?? modifier.extraPrice ?? 0) as number | string,
      }))
    : [];
  return {
    id: String(value.id ?? ""),
    tenant_id: String(value.tenant_id ?? ""),
    order_id: String(value.order_id ?? ""),
    menu_item_id: String(value.menu_item_id ?? value.menuItemId ?? ""),
    name: String(value.name ?? value.menu_item_name ?? value.menuItemName ?? "Unnamed item"),
    quantity: Number(value.quantity ?? 0),
    unit_price: (value.unit_price ?? value.unitPrice ?? 0) as number | string,
    notes: typeof value.notes === "string" ? value.notes : null,
    status: String(value.status ?? ""),
    modifiers,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOrder(value: unknown): value is OrderDetail {
  return isRecord(value) && typeof value.id === "string" && typeof value.status === "string";
}

export const paymentApi = {
  checkout: async (orderId: string) => (await api.post<CheckoutResult>(`/orders/${orderId}/checkout`)).data,
  forOrder: async (orderId: string) => (await api.get<Payment[]>(`/payments/order/${orderId}`)).data,
};
