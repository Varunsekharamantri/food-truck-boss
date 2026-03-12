import { useState, useEffect, useCallback } from "react";

// Types
export interface MenuItem {
  id: string;
  name: string;
  bucket: "Rice / Noodles" | "Starters" | "Shawarma";
  price: number;
  createdAt: string;
  updatedAt: string;
}

export type ItemStatus = "Waiting" | "Preparing" | "Ready" | "Delivered";

export interface OrderItemEntry {
  menuItemId: string;
  quantity: number;
  status: ItemStatus;
}

export type OrderStatus = "Waiting" | "Preparing" | "Ready" | "Delivered";

export interface CustomerOrder {
  id: string;
  orderNumber: number;
  dateKey: string;
  timestamp: string;
  status: OrderStatus;
  items: OrderItemEntry[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  updatedAt: string;
}

const STORAGE_KEYS = {
  menu: "truckpos_menu",
  orders: "truckpos_orders_v2",
  inventory: "truckpos_inventory",
  orderCounter: "truckpos_order_counter",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function nowISO() {
  return new Date().toISOString();
}

// Default menu items
const DEFAULT_MENU: MenuItem[] = [
  { id: genId(), name: "Chicken Rice", bucket: "Rice / Noodles", price: 119, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Veg Rice", bucket: "Rice / Noodles", price: 99, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Egg Noodles", bucket: "Rice / Noodles", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer Tikka", bucket: "Starters", price: 149, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Chicken 65", bucket: "Starters", price: 169, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Chicken Shawarma", bucket: "Shawarma", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer Shawarma", bucket: "Shawarma", price: 119, createdAt: nowISO(), updatedAt: nowISO() },
];

const ORDER_STATUSES: OrderStatus[] = ["Waiting", "Preparing", "Ready", "Delivered"];

const ITEM_STATUSES: ItemStatus[] = ["Waiting", "Preparing", "Ready", "Delivered"];

export function getNextItemStatus(current: ItemStatus): ItemStatus {
  const idx = ITEM_STATUSES.indexOf(current);
  return idx < ITEM_STATUSES.length - 1 ? ITEM_STATUSES[idx + 1] : current;
}

export function computeOrderStatus(items: OrderItemEntry[]): OrderStatus {
  if (items.length === 0) return "Waiting";
  if (items.every((i) => i.status === "Delivered")) return "Delivered";
  if (items.every((i) => i.status === "Ready")) return "Ready";
  if (items.some((i) => i.status === "Preparing")) return "Preparing";
  return "Waiting";
}

// Hook
export function useStore() {
  const [menu, setMenu] = useState<MenuItem[]>(() => load(STORAGE_KEYS.menu, DEFAULT_MENU));
  const [orders, setOrders] = useState<CustomerOrder[]>(() => load(STORAGE_KEYS.orders, []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => load(STORAGE_KEYS.inventory, []));
  const [orderCounter, setOrderCounter] = useState<number>(() => load(STORAGE_KEYS.orderCounter, 0));

  useEffect(() => save(STORAGE_KEYS.menu, menu), [menu]);
  useEffect(() => save(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => save(STORAGE_KEYS.inventory, inventory), [inventory]);
  useEffect(() => save(STORAGE_KEYS.orderCounter, orderCounter), [orderCounter]);

  // Menu
  const addMenuItem = useCallback((item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">) => {
    setMenu((prev) => [...prev, { ...item, id: genId(), createdAt: nowISO(), updatedAt: nowISO() }]);
  }, []);

  const updateMenuItem = useCallback((id: string, updates: Partial<Pick<MenuItem, "name" | "bucket" | "price">>) => {
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: nowISO() } : m)));
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setMenu((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Customer Orders
  const getOrdersForDate = useCallback((dateKey: string) => orders.filter((o) => o.dateKey === dateKey), [orders]);

  const createOrder = useCallback((dateKey: string): CustomerOrder => {
    const newNum = orderCounter + 1;
    setOrderCounter(newNum);
    const order: CustomerOrder = {
      id: genId(),
      orderNumber: newNum,
      dateKey,
      timestamp: nowISO(),
      status: "Waiting",
      items: [],
    };
    setOrders((prev) => [...prev, order]);
    return order;
  }, [orderCounter]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }, []);

  const addItemToOrder = useCallback((orderId: string, menuItemId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const existing = o.items.find((i) => i.menuItemId === menuItemId);
        const newItems = existing
          ? o.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i))
          : [...o.items, { menuItemId, quantity: 1, status: "Waiting" as ItemStatus }];
        return { ...o, items: newItems, status: computeOrderStatus(newItems) };
      })
    );
  }, []);

  const removeItemFromOrder = useCallback((orderId: string, menuItemId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const existing = o.items.find((i) => i.menuItemId === menuItemId);
        if (!existing) return o;
        const newItems = existing.quantity <= 1
          ? o.items.filter((i) => i.menuItemId !== menuItemId)
          : o.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i));
        return { ...o, items: newItems, status: computeOrderStatus(newItems) };
      })
    );
  }, []);

  const updateItemStatus = useCallback((orderId: string, menuItemId: string, status: ItemStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map((i) => (i.menuItemId === menuItemId ? { ...i, status } : i));
        return { ...o, items: newItems, status: computeOrderStatus(newItems) };
      })
    );
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((prev) => {
      const filtered = prev.filter((o) => o.id !== orderId);
      // Renumber orders per dateKey
      const byDate: Record<string, CustomerOrder[]> = {};
      filtered.forEach((o) => {
        if (!byDate[o.dateKey]) byDate[o.dateKey] = [];
        byDate[o.dateKey].push(o);
      });
      const renumbered: CustomerOrder[] = [];
      Object.values(byDate).forEach((dateOrders) => {
        dateOrders
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
          .forEach((o, idx) => renumbered.push({ ...o, orderNumber: idx + 1 }));
      });
      return renumbered;
    });
  }, []);


  // Inventory
  const addInventoryItem = useCallback((item: Omit<InventoryItem, "id" | "updatedAt">) => {
    setInventory((prev) => [...prev, { ...item, id: genId(), updatedAt: nowISO() }]);
  }, []);

  const updateInventoryItem = useCallback((id: string, updates: Partial<Pick<InventoryItem, "name" | "quantity" | "unit" | "costPerUnit">>) => {
    setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: nowISO() } : i)));
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return {
    menu, addMenuItem, updateMenuItem, deleteMenuItem,
    orders, getOrdersForDate, createOrder, updateOrderStatus, addItemToOrder, removeItemFromOrder, deleteOrder,
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
  };
}

export const BUCKETS = ["Rice / Noodles", "Starters", "Shawarma"] as const;
export type Bucket = (typeof BUCKETS)[number];
