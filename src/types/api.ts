export type UserRole =
  "super_admin" | "org_owner" | "branch_manager" | "receptionist" | "waiter" | "kitchen_staff" | "customer";

export type OrderStatus =
  "placed" | "confirmed" | "preparing" | "ready" | "served" | "awaiting_payment" | "paid" | "completed" | "cancelled";

export interface AuthUser {
  userId: string;
  tenantId: string;
  branchId: string | null;
  role: UserRole;
  email: string;
  fullName: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  timezone?: string | null;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface RestaurantTable {
  id: string;
  label: string;
  seats?: number | null;
  status?: string | null;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface MenuModifier {
  id?: string;
  name: string;
  optionName: string;
  extraPrice?: number | string;
  [key: string]: unknown;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder?: number;
  items?: MenuItem[];
  [key: string]: unknown;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number | string;
  description?: string | null;
  imageUrl?: string | null;
  isAvailable?: boolean;
  categoryId?: string | null;
  modifiers?: MenuModifier[];
  [key: string]: unknown;
}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
  modifiers?: Pick<MenuModifier, "name" | "optionName">[];
}

export interface CreateOrderInput {
  branchId: string;
  tableId?: string | null;
  customerId?: string | null;
  orderType: "dine_in" | "takeaway" | "delivery";
  clientActionId: string;
  items: OrderItemInput[];
  taxAmount?: number;
  discountAmount?: number;
}

export interface OrderModifier {
  id: string;
  modifier_id: string | null;
  name: string;
  extra_price: number | string;
}

export interface OrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number | string;
  notes: string | null;
  status: string;
  modifiers: OrderModifier[];
}

export interface Order {
  id: string;
  branchId: string;
  branch_id?: string;
  tableId?: string | null;
  table_id?: string | null;
  status: OrderStatus;
  orderType?: string;
  items?: OrderItem[];
  orderItems?: Record<string, unknown>[];
  order_items?: Record<string, unknown>[];
  totalAmount?: number | string;
  subtotal?: number | string;
  taxAmount?: number | string;
  discountAmount?: number | string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export interface Payment {
  id: string;
  status: string;
  amount: number | string;
  [key: string]: unknown;
}

export interface CheckoutResult {
  payment: Payment;
  qr: {
    provider: string;
    orderId: string;
    amount: number;
    format: string;
    data: string;
    expiresAt: string | null;
  };
}

export interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
