import { useState } from "react";
import { useStore, BUCKETS, type Bucket, type MenuItem, type CustomerOrder, type ItemStatus, type OrderItemEntry, getNextItemStatus, computeOrderStatus, PARCEL_CHARGE } from "@/hooks/useStore";
import { formatDateKey, formatDisplay, formatRupee } from "@/lib/dateUtils";
import { Plus, Minus, CalendarIcon, ChevronDown, Trash2, Flame, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BUCKET_BADGE: Record<Bucket, string> = {
  "Rice / Noodles": "bg-bucket-rice text-primary-foreground",
  "Starters": "bg-bucket-starters text-accent-foreground",
  "Shawarma": "bg-bucket-shawarma text-primary-foreground",
  "BBQ": "bg-bucket-bbq text-primary-foreground",
  "Add-ons": "bg-bucket-addons text-primary-foreground",
};

const ITEM_STATUS_COLORS: Record<ItemStatus, string> = {
  Waiting: "bg-muted text-muted-foreground",
  Preparing: "bg-orange-500/20 text-orange-400",
  Ready: "bg-accent/20 text-accent",
  Delivered: "bg-blue-500/20 text-blue-400",
};

const STATUS_COLORS: Record<string, string> = {
  Waiting: "bg-muted text-muted-foreground",
  Preparing: "bg-orange-500/20 text-orange-400",
  Ready: "bg-accent/20 text-accent",
  Delivered: "bg-blue-500/20 text-blue-400",
};

export default function OrdersPage() {
  const { menu, getOrdersForDate, createOrder, addItemToOrder, removeItemFromOrder, updateItemStatus, toggleItemFlag, deleteOrder } = useStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addingToOrder, setAddingToOrder] = useState<string | null>(null);
  const dateKey = formatDateKey(selectedDate);
  const dayOrders = getOrdersForDate(dateKey);

  const activeOrders = dayOrders.filter((o) => o.status !== "Delivered");
  const inProgress = dayOrders.filter((o) => o.status === "Preparing" || o.status === "Waiting").length;
  const readyCount = dayOrders.filter((o) => o.status === "Ready").length;
  const deliveredCount = dayOrders.filter((o) => o.status === "Delivered").length;

  const handleNewOrder = () => createOrder(dateKey);

  const getItemPrice = (menuItemId: string) => menu.find((m) => m.id === menuItemId)?.price || 0;
  const getItemName = (menuItemId: string) => menu.find((m) => m.id === menuItemId)?.name || "Unknown";

  const itemLineTotal = (i: OrderItemEntry) =>
    i.quantity * getItemPrice(i.menuItemId) + (i.parcel ? PARCEL_CHARGE * i.quantity : 0);

  const orderTotal = (order: CustomerOrder) =>
    order.items.reduce((sum, i) => sum + itemLineTotal(i), 0);

  // To-Do (Waiting items aggregated; spicy is its own bucket since cooking differs)
  const todoMap: Record<string, { menuItemId: string; spicy: boolean; qty: number; earliest: string; orderNumbers: number[] }> = {};
  dayOrders.forEach((order) => {
    order.items.forEach((i) => {
      if (i.status !== "Waiting") return;
      const key = `${i.menuItemId}|${i.spicy ? "1" : "0"}`;
      const existing = todoMap[key];
      if (existing) {
        existing.qty += i.quantity;
        if (order.timestamp < existing.earliest) existing.earliest = order.timestamp;
        if (!existing.orderNumbers.includes(order.orderNumber)) existing.orderNumbers.push(order.orderNumber);
      } else {
        todoMap[key] = { menuItemId: i.menuItemId, spicy: !!i.spicy, qty: i.quantity, earliest: order.timestamp, orderNumbers: [order.orderNumber] };
      }
    });
  });
  const todoList = Object.entries(todoMap)
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => a.earliest.localeCompare(b.earliest));

  // Analytics
  const itemTotals: Record<string, number> = {};
  let totalRevenue = 0;
  dayOrders.forEach((order) => {
    order.items.forEach((i) => {
      itemTotals[i.menuItemId] = (itemTotals[i.menuItemId] || 0) + i.quantity;
      totalRevenue += itemLineTotal(i);
    });
  });

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Date Picker */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-start gap-2 font-mono">
              <CalendarIcon className="h-4 w-4" />
              {formatDisplay(selectedDate)}
              {isToday(selectedDate) && <Badge variant="secondary" className="ml-1 text-[10px]">Today</Badge>}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* New Order + Counters */}
      <Button className="flex-1 gap-2 text-base font-bold h-12" onClick={handleNewOrder}>
        <Plus className="h-5 w-5" /> NEW ORDER
      </Button>

      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-orange-500/10 p-2 text-center">
          <p className="text-2xl font-bold font-mono text-orange-400">{inProgress}</p>
          <p className="text-[10px] text-muted-foreground">In Progress</p>
        </div>
        <div className="flex-1 rounded-lg bg-accent/10 p-2 text-center">
          <p className="text-2xl font-bold font-mono text-accent">{readyCount}</p>
          <p className="text-[10px] text-muted-foreground">Ready</p>
        </div>
        <div className="flex-1 rounded-lg bg-blue-500/10 p-2 text-center">
          <p className="text-2xl font-bold font-mono text-blue-400">{deliveredCount}</p>
          <p className="text-[10px] text-muted-foreground">Delivered</p>
        </div>
      </div>

      {/* To-Do (Waiting items aggregated) */}
      {todoList.length > 0 && (
        <div className="rounded-lg bg-card p-3 shadow-sm border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase text-orange-400 tracking-wider">Cook To-Do</h2>
            <span className="text-[10px] text-muted-foreground">Oldest first</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {todoList.map((t, idx) => (
              <div
                key={t.menuItemId}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1.5",
                  idx === 0 ? "bg-orange-500/20 ring-1 ring-orange-500/50" : "bg-muted/40"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", idx === 0 && "text-orange-300 font-bold")}>
                    {getItemName(t.menuItemId)}
                    {idx === 0 && <span className="ml-2 text-[9px] uppercase tracking-wider">Do first</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    #{t.orderNumbers.join(", #")} · {format(new Date(t.earliest), "HH:mm")}
                  </p>
                </div>
                <span className="font-mono text-lg font-bold ml-2 shrink-0">×{t.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Active Orders</h2>
          {activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              getItemName={getItemName}
              getItemPrice={getItemPrice}
              orderTotal={orderTotal(order)}
              onAddItems={() => setAddingToOrder(order.id)}
              onDelete={() => deleteOrder(order.id)}
              onItemStatusChange={(menuItemId, status) => updateItemStatus(order.id, menuItemId, status)}
              onToggleFlag={(menuItemId, flag) => toggleItemFlag(order.id, menuItemId, flag)}
            />
          ))}
        </div>
      )}

      {/* Delivered Orders */}
      {dayOrders.filter((o) => o.status === "Delivered").length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Delivered</h2>
          {dayOrders.filter((o) => o.status === "Delivered").map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              getItemName={getItemName}
              getItemPrice={getItemPrice}
              orderTotal={orderTotal(order)}
              onAddItems={() => {}}
              onDelete={() => deleteOrder(order.id)}
              onItemStatusChange={() => {}}
              delivered
            />
          ))}
        </div>
      )}

      {dayOrders.length === 0 && (
        <div className="rounded-lg bg-card p-8 text-center">
          <p className="text-muted-foreground">No orders yet. Tap <span className="font-bold text-primary">NEW ORDER</span> to start.</p>
        </div>
      )}

      {/* Item Performance */}
      {dayOrders.length > 0 && (
        <div className="rounded-lg bg-card p-3 shadow-sm">
          <h2 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">Item Performance</h2>
          {BUCKETS.map((bucket) => {
            const items = menu.filter((m) => m.bucket === bucket);
            const bucketItems = items.filter((m) => itemTotals[m.id]);
            if (bucketItems.length === 0) return null;
            return (
              <div key={bucket} className="mb-3">
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold mb-1 ${BUCKET_BADGE[bucket]}`}>{bucket}</span>
                {bucketItems.map((item) => (
                  <div key={item.id} className="flex justify-between px-1 py-0.5">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-mono text-sm font-bold">{itemTotals[item.id]}</span>
                  </div>
                ))}
              </div>
            );
          })}
          <div className="border-t pt-2 mt-2 flex justify-between">
            <span className="text-sm font-bold">Total Revenue</span>
            <span className="font-mono text-sm font-bold text-revenue">{formatRupee(totalRevenue)}</span>
          </div>
        </div>
      )}

      {/* Add Items Dialog */}
      <AddItemsDialog
        open={!!addingToOrder}
        onClose={() => setAddingToOrder(null)}
        menu={menu}
        orderId={addingToOrder}
        order={dayOrders.find((o) => o.id === addingToOrder)}
        onAdd={addItemToOrder}
        onRemove={removeItemFromOrder}
      />
    </div>
  );
}

function OrderCard({
  order,
  getItemName,
  getItemPrice,
  orderTotal,
  onAddItems,
  onDelete,
  onItemStatusChange,
  onToggleFlag,
  delivered,
}: {
  order: CustomerOrder;
  getItemName: (id: string) => string;
  getItemPrice: (id: string) => number;
  orderTotal: number;
  onAddItems: () => void;
  onDelete: () => void;
  onItemStatusChange: (menuItemId: string, status: ItemStatus) => void;
  onToggleFlag?: (menuItemId: string, flag: "spicy" | "parcel") => void;
  delivered?: boolean;
}) {
  const isReady = order.status === "Ready";
  return (
    <div className={cn(
      "rounded-lg bg-card p-3 shadow-sm border",
      isReady && "border-accent ring-1 ring-accent/30",
      delivered && "opacity-60"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold">#{order.orderNumber}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_COLORS[order.status])}>
            {order.status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-mono">
            {format(new Date(order.timestamp), "HH:mm")}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {order.items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic mb-2">No items added yet</p>
      ) : (
        <div className="mb-2 space-y-1.5">
          {order.items.map((item) => {
            const base = item.quantity * getItemPrice(item.menuItemId);
            const parcelAdd = item.parcel ? PARCEL_CHARGE * item.quantity : 0;
            return (
              <div key={item.menuItemId} className="flex items-start justify-between text-sm gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="truncate">
                      {getItemName(item.menuItemId)} <span className="text-muted-foreground">×{item.quantity}</span>
                    </span>
                    {item.spicy && <Flame className="h-3 w-3 text-red-500" />}
                    {item.parcel && <Package className="h-3 w-3 text-blue-400" />}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {formatRupee(base + parcelAdd)}
                    {item.parcel && <span className="ml-1 text-blue-400">(+{formatRupee(parcelAdd)} parcel)</span>}
                  </div>
                  {!delivered && onToggleFlag && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => onToggleFlag(item.menuItemId, "spicy")}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors",
                          item.spicy
                            ? "bg-red-500/20 text-red-400 border-red-500/50"
                            : "bg-muted/30 text-muted-foreground border-transparent"
                        )}
                      >
                        <Flame className="h-2.5 w-2.5" /> Spicy
                      </button>
                      <button
                        onClick={() => onToggleFlag(item.menuItemId, "parcel")}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors",
                          item.parcel
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                            : "bg-muted/30 text-muted-foreground border-transparent"
                        )}
                      >
                        <Package className="h-2.5 w-2.5" /> Parcel +₹{PARCEL_CHARGE}
                      </button>
                    </div>
                  )}
                </div>
                {!delivered ? (
                  <button
                    onClick={() => onItemStatusChange(item.menuItemId, getNextItemStatus(item.status))}
                    className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 transition-colors", ITEM_STATUS_COLORS[item.status])}
                  >
                    {item.status}
                  </button>
                ) : (
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0", ITEM_STATUS_COLORS[item.status])}>
                    {item.status}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-2">
        <span className="font-mono font-bold text-revenue">{formatRupee(orderTotal)}</span>
        {!delivered && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onAddItems}>
            <Plus className="h-3 w-3 mr-1" /> Items
          </Button>
        )}
      </div>
    </div>
  );
}

function AddItemsDialog({
  open,
  onClose,
  menu,
  orderId,
  order,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  menu: MenuItem[];
  orderId: string | null;
  order?: CustomerOrder;
  onAdd: (orderId: string, menuItemId: string) => void;
  onRemove: (orderId: string, menuItemId: string) => void;
}) {
  if (!orderId) return null;
  const getQty = (menuItemId: string) => order?.items.find((i) => i.menuItemId === menuItemId)?.quantity || 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Add Items — #{order?.orderNumber}</DialogTitle>
        </DialogHeader>
        {BUCKETS.map((bucket) => {
          const items = menu.filter((m) => m.bucket === bucket);
          if (items.length === 0) return null;
          return (
            <div key={bucket} className="mb-3">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{bucket}</p>
              {items.map((item) => {
                const qty = getQty(item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{formatRupee(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-9 w-9" disabled={qty === 0} onClick={() => onRemove(orderId, item.id)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-7 text-center font-mono font-bold">{qty}</span>
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onAdd(orderId, item.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <Button className="w-full h-12 text-base font-bold" onClick={onClose}>Done</Button>
      </DialogContent>
    </Dialog>
  );
}
