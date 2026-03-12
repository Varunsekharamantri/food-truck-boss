import { useState } from "react";
import { useStore, BUCKETS, type Bucket, type MenuItem } from "@/hooks/useStore";
import { formatDateKey, formatDisplay, formatRupee, getNextDay, getPrevDay } from "@/lib/dateUtils";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isToday } from "date-fns";

const BUCKET_COLORS: Record<Bucket, string> = {
  "Rice / Noodles": "border-bucket-rice bg-bucket-rice/10",
  "Starters": "border-bucket-starters bg-bucket-starters/10",
  "Shawarma": "border-bucket-shawarma bg-bucket-shawarma/10",
};

const BUCKET_BADGE: Record<Bucket, string> = {
  "Rice / Noodles": "bg-bucket-rice text-primary-foreground",
  "Starters": "bg-bucket-starters text-accent-foreground",
  "Shawarma": "bg-bucket-shawarma text-primary-foreground",
};

export default function OrdersPage() {
  const { menu, getOrdersForDate, setOrderQuantity } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = formatDateKey(selectedDate);
  const dayOrders = getOrdersForDate(dateKey);

  const getQty = (itemId: string) => dayOrders.find((o) => o.menuItemId === itemId)?.quantity || 0;

  let totalItems = 0;
  let totalRevenue = 0;

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Date Selector */}
      <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(getPrevDay(selectedDate))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="font-mono text-lg font-semibold">{formatDisplay(selectedDate)}</p>
          {isToday(selectedDate) && <p className="text-xs text-muted-foreground">Today</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(getNextDay(selectedDate))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Buckets */}
      {BUCKETS.map((bucket) => {
        const items = menu.filter((m) => m.bucket === bucket);
        let bucketQty = 0;
        let bucketRev = 0;
        items.forEach((item) => {
          const q = getQty(item.id);
          bucketQty += q;
          bucketRev += q * item.price;
        });
        totalItems += bucketQty;
        totalRevenue += bucketRev;

        return (
          <div key={bucket} className={`rounded-lg border-l-4 ${BUCKET_COLORS[bucket]} p-3`}>
            <div className="mb-3 flex items-center justify-between">
              <span className={`rounded-md px-2 py-1 text-xs font-bold ${BUCKET_BADGE[bucket]}`}>{bucket}</span>
              <div className="text-right font-mono text-xs text-muted-foreground">
                {bucketQty} items · {formatRupee(bucketRev)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {items.length === 0 && <p className="text-xs text-muted-foreground italic">No menu items. Add in Menu Settings.</p>}
              {items.map((item) => (
                <OrderRow key={item.id} item={item} qty={getQty(item.id)} dateKey={dateKey} setOrderQuantity={setOrderQuantity} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Day Totals */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="font-mono text-2xl font-bold">{totalItems}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="font-mono text-2xl font-bold text-revenue">{formatRupee(totalRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRow({
  item,
  qty,
  dateKey,
  setOrderQuantity,
}: {
  item: MenuItem;
  qty: number;
  dateKey: string;
  setOrderQuantity: (dateKey: string, menuItemId: string, qty: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-card/60 px-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{formatRupee(item.price)}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={qty === 0}
          onClick={() => setOrderQuantity(dateKey, item.id, qty - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-mono text-base font-bold">{qty}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => setOrderQuantity(dateKey, item.id, qty + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {qty > 0 && (
        <p className="ml-3 font-mono text-sm font-semibold text-revenue">{formatRupee(qty * item.price)}</p>
      )}
    </div>
  );
}
