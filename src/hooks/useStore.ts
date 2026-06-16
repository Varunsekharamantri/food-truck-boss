import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Types (unchanged public surface)
export interface MenuItem {
  id: string;
  name: string;
  bucket: "Rice / Noodles" | "Starters" | "Shawarma" | "BBQ" | "Add-ons";
  price: number;
  imageUrl?: string | null;
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

export const BUCKETS = ["Rice / Noodles", "Starters", "Shawarma", "BBQ", "Add-ons"] as const;
export type Bucket = (typeof BUCKETS)[number];

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

function nowISO() {
  return new Date().toISOString();
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Default menu (seeded once if table is empty)
const DEFAULT_MENU: Omit<MenuItem, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Chicken 65", bucket: "Starters", price: 129 },
  { name: "Chicken Lollypop", bucket: "Starters", price: 149 },
  { name: "Honey Chicken", bucket: "Starters", price: 149 },
  { name: "Lemon Chicken", bucket: "Starters", price: 139 },
  { name: "Dragon Chicken", bucket: "Starters", price: 159 },
  { name: "Pepper Chicken", bucket: "Starters", price: 149 },
  { name: "Garlic Chicken", bucket: "Starters", price: 149 },
  { name: "Chicken Manchurian", bucket: "Starters", price: 139 },
  { name: "Chilli Chicken", bucket: "Starters", price: 129 },
  { name: "Egg Manchurian", bucket: "Starters", price: 99 },
  { name: "Egg Chilli", bucket: "Starters", price: 99 },
  { name: "Gobi 65", bucket: "Starters", price: 109 },
  { name: "Gobi Manchurian", bucket: "Starters", price: 129 },
  { name: "Gobi Chilli", bucket: "Starters", price: 139 },
  { name: "Paneer 65", bucket: "Starters", price: 139 },
  { name: "Paneer Salt Pepper", bucket: "Starters", price: 149 },
  { name: "Paneer Manchurian", bucket: "Starters", price: 159 },
  { name: "Paneer Chilli", bucket: "Starters", price: 159 },
  { name: "Mushroom 65", bucket: "Starters", price: 109 },
  { name: "Mushroom Salt Pepper", bucket: "Starters", price: 139 },
  { name: "Mushroom Manchurian", bucket: "Starters", price: 129 },
  { name: "Mushroom Chilli", bucket: "Starters", price: 129 },
  { name: "Chicken Rice", bucket: "Rice / Noodles", price: 129 },
  { name: "Egg Rice", bucket: "Rice / Noodles", price: 109 },
  { name: "Veg Rice", bucket: "Rice / Noodles", price: 99 },
  { name: "Paneer Rice", bucket: "Rice / Noodles", price: 119 },
  { name: "Mushroom Rice", bucket: "Rice / Noodles", price: 109 },
  { name: "Gobi Rice", bucket: "Rice / Noodles", price: 109 },
  { name: "Chicken Noodles", bucket: "Rice / Noodles", price: 129 },
  { name: "Egg Noodles", bucket: "Rice / Noodles", price: 109 },
  { name: "Veg Noodles", bucket: "Rice / Noodles", price: 99 },
  { name: "Paneer Noodles", bucket: "Rice / Noodles", price: 119 },
  { name: "Mushroom Noodles", bucket: "Rice / Noodles", price: 109 },
  { name: "Gobi Noodles", bucket: "Rice / Noodles", price: 109 },
  { name: "Shawarma Bun", bucket: "Shawarma", price: 59 },
  { name: "Regular Shawarma Roll", bucket: "Shawarma", price: 79 },
  { name: "Regular Shawarma Plate", bucket: "Shawarma", price: 129 },
  { name: "Mexican Shawarma Roll", bucket: "Shawarma", price: 89 },
  { name: "Mexican Shawarma Plate", bucket: "Shawarma", price: 139 },
  { name: "Peri Peri Shawarma Roll", bucket: "Shawarma", price: 89 },
  { name: "Peri Peri Shawarma Plate", bucket: "Shawarma", price: 139 },
  { name: "Schezwan Shawarma Roll", bucket: "Shawarma", price: 89 },
  { name: "Schezwan Shawarma Plate", bucket: "Shawarma", price: 139 },
  { name: "Full Meat Shawarma Roll", bucket: "Shawarma", price: 119 },
  { name: "Full Meat Shawarma Plate", bucket: "Shawarma", price: 169 },
  { name: "Chicken BBQ", bucket: "BBQ", price: 159 },
  { name: "Chicken Alfaham BBQ", bucket: "BBQ", price: 159 },
  { name: "Chicken Pepper BBQ", bucket: "BBQ", price: 169 },
  { name: "Paneer BBQ", bucket: "BBQ", price: 149 },
  { name: "Schezwan Add-on", bucket: "Add-ons", price: 10 },
  { name: "Parcel", bucket: "Add-ons", price: 10 },
];

interface MenuRow { id: string; name: string; bucket: string; price: number | string; image_url?: string | null; created_at: string; updated_at: string }
interface InvRow { id: string; name: string; quantity: number | string; unit: string; cost_per_unit: number | string; updated_at: string }
interface OrderRow { id: string; order_number: number; date_key: string; ts: string; status: string; items: OrderItemEntry[] }

const menuFromRow = (r: MenuRow): MenuItem => ({
  id: r.id, name: r.name, bucket: r.bucket as Bucket, price: Number(r.price),
  imageUrl: r.image_url ?? null,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
const invFromRow = (r: InvRow): InventoryItem => ({
  id: r.id, name: r.name, quantity: Number(r.quantity), unit: r.unit,
  costPerUnit: Number(r.cost_per_unit), updatedAt: r.updated_at,
});
const orderFromRow = (r: OrderRow): CustomerOrder => ({
  id: r.id, orderNumber: r.order_number, dateKey: r.date_key, timestamp: r.ts,
  status: r.status as OrderStatus, items: Array.isArray(r.items) ? r.items : [],
});

export function useStore() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const seededRef = useRef(false);

  // Loaders
  const loadMenu = useCallback(async () => {
    const { data, error } = await supabase.from("menu_items").select("*").order("created_at", { ascending: true });
    if (error) return;
    const rows = (data as MenuRow[]).map(menuFromRow);
    setMenu(rows);
    // One-time seed if empty
    if (!seededRef.current && rows.length === 0) {
      seededRef.current = true;
      await supabase.from("menu_items").upsert(DEFAULT_MENU.map((m) => ({ name: m.name, bucket: m.bucket, price: m.price })), { onConflict: "name,bucket", ignoreDuplicates: true });
      const { data: seeded } = await supabase.from("menu_items").select("*").order("created_at", { ascending: true });
      if (seeded) setMenu((seeded as MenuRow[]).map(menuFromRow));
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase.from("orders").select("*").order("ts", { ascending: true });
    if (error) return;
    setOrders((data as unknown as OrderRow[]).map(orderFromRow));
  }, []);

  const loadInventory = useCallback(async () => {
    const { data, error } = await supabase.from("inventory").select("*").order("created_at", { ascending: true });
    if (error) return;
    setInventory((data as InvRow[]).map(invFromRow));
  }, []);

  useEffect(() => {
    loadMenu();
    loadOrders();
    loadInventory();

    const ch = supabase
      .channel("store-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => loadMenu())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, () => loadInventory())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadMenu, loadOrders, loadInventory]);

  // MENU mutations
  const addMenuItem = useCallback(async (item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">) => {
    const { error } = await supabase.from("menu_items").insert({ name: item.name, bucket: item.bucket, price: item.price });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
  }, []);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<Pick<MenuItem, "name" | "bucket" | "price">>) => {
    const { error } = await supabase.from("menu_items").update(updates).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
  }, []);

  const generateMenuItemImage = useCallback(async (id: string) => {
    const item = menu.find((m) => m.id === id);
    if (!item) return;
    const { data, error } = await supabase.functions.invoke("generate-menu-image", {
      body: { itemId: id, name: item.name, bucket: item.bucket },
    });
    if (error || (data && (data as { error?: string }).error)) {
      toast({
        title: "Image generation failed",
        description: error?.message || (data as { error?: string }).error,
        variant: "destructive",
      });
      return;
    }
    await loadMenu();
  }, [menu, loadMenu]);

  const uploadMenuItemImage = useCallback(async (id: string, file: File) => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("menu-images").upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("menu-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !signed) {
      toast({ title: "Upload failed", description: signErr?.message || "Could not sign URL", variant: "destructive" });
      return;
    }
    const { error: updErr } = await supabase.from("menu_items").update({ image_url: signed.signedUrl }).eq("id", id);
    if (updErr) {
      toast({ title: "Save failed", description: updErr.message, variant: "destructive" });
      return;
    }
    await loadMenu();
  }, [loadMenu]);

  // ORDERS
  const getOrdersForDate = useCallback((dateKey: string) => orders.filter((o) => o.dateKey === dateKey), [orders]);

  const createOrder = useCallback(async (dateKey: string) => {
    const dayOrders = orders.filter((o) => o.dateKey === dateKey);
    const nextNum = dayOrders.reduce((m, o) => Math.max(m, o.orderNumber), 0) + 1;
    const ts = nowISO();
    const { data, error } = await supabase
      .from("orders")
      .insert({ order_number: nextNum, date_key: dateKey, ts, status: "Waiting", items: [] })
      .select()
      .single();
    if (error) {
      toast({ title: "Couldn't create order", description: error.message, variant: "destructive" });
      return null;
    }
    return orderFromRow(data as unknown as OrderRow);
  }, [orders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
  }, []);

  const persistOrderItems = async (orderId: string, items: OrderItemEntry[]) => {
    const status = computeOrderStatus(items);
    await supabase.from("orders").update({ items: items as unknown as never, status }).eq("id", orderId);
  };

  const addItemToOrder = useCallback(async (orderId: string, menuItemId: string) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    const plain = o.items.find((i) => i.menuItemId === menuItemId && !i.spicy && !i.parcel);
    const newItems = plain
      ? o.items.map((i) => (i.id === plain.id ? { ...i, quantity: i.quantity + 1 } : i))
      : [...o.items, { id: genId(), menuItemId, quantity: 1, status: "Waiting" as ItemStatus }];
    setOrders((prev) => prev.map((x) => x.id === orderId ? { ...x, items: newItems, status: computeOrderStatus(newItems) } : x));
    await persistOrderItems(orderId, newItems);
  }, [orders]);

  const removeItemFromOrder = useCallback(async (orderId: string, menuItemId: string) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    const target = o.items.find((i) => i.menuItemId === menuItemId && !i.spicy && !i.parcel)
      || o.items.find((i) => i.menuItemId === menuItemId);
    if (!target) return;
    const newItems = target.quantity <= 1
      ? o.items.filter((i) => i.id !== target.id)
      : o.items.map((i) => (i.id === target.id ? { ...i, quantity: i.quantity - 1 } : i));
    setOrders((prev) => prev.map((x) => x.id === orderId ? { ...x, items: newItems, status: computeOrderStatus(newItems) } : x));
    await persistOrderItems(orderId, newItems);
  }, [orders]);

  const updateItemStatus = useCallback(async (orderId: string, lineId: string, status: ItemStatus) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    const newItems = o.items.map((i) => (i.id === lineId ? { ...i, status } : i));
    setOrders((prev) => prev.map((x) => x.id === orderId ? { ...x, items: newItems, status: computeOrderStatus(newItems) } : x));
    await persistOrderItems(orderId, newItems);
  }, [orders]);

  const toggleItemFlag = useCallback(async (orderId: string, lineId: string, flag: "spicy" | "parcel") => {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    const line = o.items.find((i) => i.id === lineId);
    if (!line) return;
    const nextSpicy = flag === "spicy" ? !line.spicy : !!line.spicy;
    const nextParcel = flag === "parcel" ? !line.parcel : !!line.parcel;
    let newItems: OrderItemEntry[];
    if (line.quantity <= 1) {
      const mergeTarget = o.items.find((i) => i.id !== line.id && i.menuItemId === line.menuItemId && !!i.spicy === nextSpicy && !!i.parcel === nextParcel && i.status === line.status);
      newItems = mergeTarget
        ? o.items.filter((i) => i.id !== line.id).map((i) => (i.id === mergeTarget.id ? { ...i, quantity: i.quantity + 1 } : i))
        : o.items.map((i) => (i.id === line.id ? { ...i, spicy: nextSpicy, parcel: nextParcel } : i));
    } else {
      const decremented = o.items.map((i) => (i.id === line.id ? { ...i, quantity: i.quantity - 1 } : i));
      const mergeTarget = decremented.find((i) => i.menuItemId === line.menuItemId && !!i.spicy === nextSpicy && !!i.parcel === nextParcel && i.status === line.status && i.id !== line.id);
      newItems = mergeTarget
        ? decremented.map((i) => (i.id === mergeTarget.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...decremented, { id: genId(), menuItemId: line.menuItemId, quantity: 1, status: line.status, spicy: nextSpicy, parcel: nextParcel }];
    }
    setOrders((prev) => prev.map((x) => x.id === orderId ? { ...x, items: newItems, status: computeOrderStatus(newItems) } : x));
    await persistOrderItems(orderId, newItems);
  }, [orders]);

  const deleteOrder = useCallback(async (orderId: string) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    await supabase.from("orders").delete().eq("id", orderId);
    // Renumber remaining orders for that date by timestamp
    const remaining = orders.filter((x) => x.dateKey === o.dateKey && x.id !== orderId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    await Promise.all(
      remaining.map((ord, idx) =>
        ord.orderNumber !== idx + 1
          ? supabase.from("orders").update({ order_number: idx + 1 }).eq("id", ord.id)
          : Promise.resolve()
      )
    );
  }, [orders]);

  // INVENTORY
  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, "id" | "updatedAt">) => {
    const { error } = await supabase.from("inventory").insert({
      name: item.name, quantity: item.quantity, unit: item.unit, cost_per_unit: item.costPerUnit,
    });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
  }, []);

  const updateInventoryItem = useCallback(async (id: string, updates: Partial<Pick<InventoryItem, "name" | "quantity" | "unit" | "costPerUnit">>) => {
    const payload: { name?: string; quantity?: number; unit?: string; cost_per_unit?: number } = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.quantity !== undefined) payload.quantity = updates.quantity;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.costPerUnit !== undefined) payload.cost_per_unit = updates.costPerUnit;
    const { error } = await supabase.from("inventory").update(payload).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
  }, []);

  const deleteInventoryItem = useCallback(async (id: string) => {
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
  }, []);

  return {
    menu, addMenuItem, updateMenuItem, deleteMenuItem, generateMenuItemImage,
    orders, getOrdersForDate, createOrder, updateOrderStatus, addItemToOrder, removeItemFromOrder, updateItemStatus, toggleItemFlag, deleteOrder,
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
  };
}
