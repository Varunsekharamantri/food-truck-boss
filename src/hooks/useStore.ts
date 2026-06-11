import { useState, useEffect, useCallback } from "react";

// Types
export interface MenuItem {
  id: string;
  name: string;
  bucket: "Rice / Noodles" | "Starters" | "Shawarma" | "BBQ" | "Add-ons";
  price: number;
  createdAt: string;
  updatedAt: string;
}

export type ItemStatus = "Waiting" | "Preparing" | "Ready" | "Delivered";

export interface OrderItemEntry {
  id: string;
  menuItemId: string;
  quantity: number;
  status: ItemStatus;
  spicy?: boolean;
  parcel?: boolean;
}

export const PARCEL_CHARGE = 10;

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
  menu: "truckpos_menu_v5",
  orders: "truckpos_orders_v3",
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
  // Non-Veg Starters
  { id: genId(), name: "Chicken 65", bucket: "Starters", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Chicken Lollypop", bucket: "Starters", price: 149, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Honey Chicken", bucket: "Starters", price: 149, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Lemon Chicken", bucket: "Starters", price: 139, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Dragon Chicken", bucket: "Starters", price: 159, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Pepper Chicken", bucket: "Starters", price: 149, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Garlic Chicken", bucket: "Starters", price: 149, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Chicken Manchurian", bucket: "Starters", price: 139, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Chilli Chicken", bucket: "Starters", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Egg Manchurian", bucket: "Starters", price: 99, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Egg Chilli", bucket: "Starters", price: 99, createdAt: nowISO(), updatedAt: nowISO() },
  // Veg Starters
  { id: genId(), name: "Gobi 65", bucket: "Starters", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Gobi Manchurian", bucket: "Starters", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Gobi Chilli", bucket: "Starters", price: 139, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer 65", bucket: "Starters", price: 139, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer Salt Pepper", bucket: "Starters", price: 149, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer Manchurian", bucket: "Starters", price: 159, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer Chilli", bucket: "Starters", price: 159, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Mushroom 65", bucket: "Starters", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Mushroom Salt Pepper", bucket: "Starters", price: 139, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Mushroom Manchurian", bucket: "Starters", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Mushroom Chilli", bucket: "Starters", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  // Rice
  { id: genId(), name: "Chicken Rice", bucket: "Rice / Noodles", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Egg Rice", bucket: "Rice / Noodles", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Veg Rice", bucket: "Rice / Noodles", price: 99, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer Rice", bucket: "Rice / Noodles", price: 119, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Mushroom Rice", bucket: "Rice / Noodles", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Gobi Rice", bucket: "Rice / Noodles", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  // Noodles
  { id: genId(), name: "Chicken Noodles", bucket: "Rice / Noodles", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Egg Noodles", bucket: "Rice / Noodles", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Veg Noodles", bucket: "Rice / Noodles", price: 99, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer Noodles", bucket: "Rice / Noodles", price: 119, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Mushroom Noodles", bucket: "Rice / Noodles", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Gobi Noodles", bucket: "Rice / Noodles", price: 109, createdAt: nowISO(), updatedAt: nowISO() },
  // Shawarma (Roll / Plate split into separate items)
  { id: genId(), name: "Shawarma Bun", bucket: "Shawarma", price: 59, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Regular Shawarma Roll", bucket: "Shawarma", price: 79, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Regular Shawarma Plate", bucket: "Shawarma", price: 129, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Mexican Shawarma Roll", bucket: "Shawarma", price: 89, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Mexican Shawarma Plate", bucket: "Shawarma", price: 139, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Peri Peri Shawarma Roll", bucket: "Shawarma", price: 89, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Peri Peri Shawarma Plate", bucket: "Shawarma", price: 139, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Schezwan Shawarma Roll", bucket: "Shawarma", price: 89, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Schezwan Shawarma Plate", bucket: "Shawarma", price: 139, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Full Meat Shawarma Roll", bucket: "Shawarma", price: 119, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Full Meat Shawarma Plate", bucket: "Shawarma", price: 169, createdAt: nowISO(), updatedAt: nowISO() },
  // BBQ
  { id: genId(), name: "Chicken BBQ", bucket: "BBQ", price: 159, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Chicken Alfaham BBQ", bucket: "BBQ", price: 159, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Chicken Pepper BBQ", bucket: "BBQ", price: 169, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Paneer BBQ", bucket: "BBQ", price: 149, createdAt: nowISO(), updatedAt: nowISO() },
  // Add-ons (kept at ₹10 each as per request)
  { id: genId(), name: "Schezwan Add-on", bucket: "Add-ons", price: 10, createdAt: nowISO(), updatedAt: nowISO() },
  { id: genId(), name: "Parcel", bucket: "Add-ons", price: 10, createdAt: nowISO(), updatedAt: nowISO() },
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

  // Variants of the same menu item with different spicy/parcel flags live on separate lines.
  const addItemToOrder = useCallback((orderId: string, menuItemId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        // Merge into an existing "plain" (no spicy, no parcel) line for this menu item.
        const plain = o.items.find(
          (i) => i.menuItemId === menuItemId && !i.spicy && !i.parcel
        );
        const newItems = plain
          ? o.items.map((i) => (i.id === plain.id ? { ...i, quantity: i.quantity + 1 } : i))
          : [
              ...o.items,
              { id: genId(), menuItemId, quantity: 1, status: "Waiting" as ItemStatus },
            ];
        return { ...o, items: newItems, status: computeOrderStatus(newItems) };
      })
    );
  }, []);

  const removeItemFromOrder = useCallback((orderId: string, menuItemId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        // Prefer removing from the plain line first; otherwise from any line with this menu item.
        const target =
          o.items.find((i) => i.menuItemId === menuItemId && !i.spicy && !i.parcel) ||
          o.items.find((i) => i.menuItemId === menuItemId);
        if (!target) return o;
        const newItems = target.quantity <= 1
          ? o.items.filter((i) => i.id !== target.id)
          : o.items.map((i) => (i.id === target.id ? { ...i, quantity: i.quantity - 1 } : i));
        return { ...o, items: newItems, status: computeOrderStatus(newItems) };
      })
    );
  }, []);

  const updateItemStatus = useCallback((orderId: string, lineId: string, status: ItemStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map((i) => (i.id === lineId ? { ...i, status } : i));
        return { ...o, items: newItems, status: computeOrderStatus(newItems) };
      })
    );
  }, []);

  // Toggling a flag on a line with quantity > 1 splits one unit off into its own variant line
  // (merging with a matching variant if one already exists). This keeps mixed-variant orders
  // accurate, e.g. 2× Chicken Rice where only one is parcel.
  const toggleItemFlag = useCallback((orderId: string, lineId: string, flag: "spicy" | "parcel") => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const line = o.items.find((i) => i.id === lineId);
        if (!line) return o;
        const nextSpicy = flag === "spicy" ? !line.spicy : !!line.spicy;
        const nextParcel = flag === "parcel" ? !line.parcel : !!line.parcel;

        // Whole line toggles when only 1 unit — try to merge with matching variant.
        if (line.quantity <= 1) {
          const mergeTarget = o.items.find(
            (i) =>
              i.id !== line.id &&
              i.menuItemId === line.menuItemId &&
              !!i.spicy === nextSpicy &&
              !!i.parcel === nextParcel &&
              i.status === line.status
          );
          const newItems = mergeTarget
            ? o.items
                .filter((i) => i.id !== line.id)
                .map((i) => (i.id === mergeTarget.id ? { ...i, quantity: i.quantity + 1 } : i))
            : o.items.map((i) =>
                i.id === line.id ? { ...i, spicy: nextSpicy, parcel: nextParcel } : i
              );
          return { ...o, items: newItems, status: computeOrderStatus(newItems) };
        }

        // Split: take 1 unit off this line and apply the toggled flags to it.
        const decremented = o.items.map((i) =>
          i.id === line.id ? { ...i, quantity: i.quantity - 1 } : i
        );
        const mergeTarget = decremented.find(
          (i) =>
            i.menuItemId === line.menuItemId &&
            !!i.spicy === nextSpicy &&
            !!i.parcel === nextParcel &&
            i.status === line.status &&
            i.id !== line.id
        );
        const newItems = mergeTarget
          ? decremented.map((i) =>
              i.id === mergeTarget.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [
              ...decremented,
              {
                id: genId(),
                menuItemId: line.menuItemId,
                quantity: 1,
                status: line.status,
                spicy: nextSpicy,
                parcel: nextParcel,
              },
            ];
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
    orders, getOrdersForDate, createOrder, updateOrderStatus, addItemToOrder, removeItemFromOrder, updateItemStatus, toggleItemFlag, deleteOrder,
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
  };
}

export const BUCKETS = ["Rice / Noodles", "Starters", "Shawarma", "BBQ", "Add-ons"] as const;
export type Bucket = (typeof BUCKETS)[number];
