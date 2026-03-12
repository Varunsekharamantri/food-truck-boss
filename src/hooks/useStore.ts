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

export interface OrderItem {
  menuItemId: string;
  quantity: number;
}

export interface DayOrders {
  [dateKey: string]: OrderItem[];
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
  orders: "truckpos_orders",
  inventory: "truckpos_inventory",
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

// Hook
export function useStore() {
  const [menu, setMenu] = useState<MenuItem[]>(() => load(STORAGE_KEYS.menu, DEFAULT_MENU));
  const [orders, setOrders] = useState<DayOrders>(() => load(STORAGE_KEYS.orders, {}));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => load(STORAGE_KEYS.inventory, []));

  useEffect(() => save(STORAGE_KEYS.menu, menu), [menu]);
  useEffect(() => save(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => save(STORAGE_KEYS.inventory, inventory), [inventory]);

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

  // Orders
  const getOrdersForDate = useCallback((dateKey: string) => orders[dateKey] || [], [orders]);

  const setOrderQuantity = useCallback((dateKey: string, menuItemId: string, quantity: number) => {
    setOrders((prev) => {
      const existing = prev[dateKey] || [];
      if (quantity <= 0) {
        return { ...prev, [dateKey]: existing.filter((o) => o.menuItemId !== menuItemId) };
      }
      const idx = existing.findIndex((o) => o.menuItemId === menuItemId);
      if (idx >= 0) {
        const updated = [...existing];
        updated[idx] = { ...updated[idx], quantity };
        return { ...prev, [dateKey]: updated };
      }
      return { ...prev, [dateKey]: [...existing, { menuItemId, quantity }] };
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
    getOrdersForDate, setOrderQuantity,
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
  };
}

export const BUCKETS = ["Rice / Noodles", "Starters", "Shawarma"] as const;
export type Bucket = (typeof BUCKETS)[number];
