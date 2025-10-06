// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  enablePayments: boolean;
}

// Table types
export interface Table {
  id: string;
  label: string;
  active: boolean;
}

// Menu types
export interface MenuCategory {
  id: string;
  name: string;
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imagePath?: string;
  categoryId: string;
  available: boolean;
}

// Cart types
export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

// Order types
export type OrderStatus = 'received' | 'in_progress' | 'ready' | 'served' | 'canceled';

export interface OrderItem {
  itemId: string;
  name: string;
  qty: number;
  price: number;
  note?: string;
}

export interface OrderTotals {
  subtotal: number;
  service: number;
  grand: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  status: OrderStatus;
  items: OrderItem[];
  totals: OrderTotals;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  paid: boolean;
}
