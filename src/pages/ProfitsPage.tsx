import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useExpenses } from "@/hooks/useExpenses";
import { useDailySales } from "@/hooks/useDailySales";
import { formatRupee, formatDateKey } from "@/lib/dateUtils";
import { format, startOfWeek, addDays, subWeeks, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

export default function ProfitsPage() {
  const { expenses } = useExpenses();
  const { sales, upsertSales, getForDate: getSalesForDate } = useDailySales();
  const [weekOffset, setWeekOffset] = useState(0);

  // Today quick-entry
  const todayKey = formatDateKey(new Date());
  const [todayInput, setTodayInput] = useState<string>("");
  useEffect(() => {
    const v = getSalesForDate(todayKey);
    setTodayInput(v ? String(v) : "");
  }, [todayKey, getSalesForDate]);

  const salesByDate = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sales) m[s.dateKey] = s.amount;
    return m;
  }, [sales]);

  const expensesByDate = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) m[e.dateKey] = (m[e.dateKey] || 0) + e.amount;
    return m;
  }, [expenses]);

  const today = new Date();
  const weekStart = startOfWeek(subWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];

  const chartData = weekDays.map((d) => {
    const key = formatDateKey(d);
    const s = salesByDate[key] || 0;
    const exp = expensesByDate[key] || 0;
    return {
      key, label: format(d, "EEE"), dateLabel: format(d, "dd MMM"),
      sales: s, expenses: exp, profit: s - exp,
    };
  });

  const weekSales = chartData.reduce((s, d) => s + d.sales, 0);
  const weekExpenses = chartData.reduce((s, d) => s + d.expenses, 0);
  const weekTotal = weekSales - weekExpenses;

  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthly = useMemo(() => {
    let s = 0, e = 0;
    for (const [k, v] of Object.entries(salesByDate)) {
      const d = new Date(k);
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) s += v;
    }
    for (const [k, v] of Object.entries(expensesByDate)) {
      const d = new Date(k);
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) e += v;
    }
    return { sales: s, expenses: e, profit: s - e };
  }, [salesByDate, expensesByDate, monthStart, monthEnd]);

  const weekLabel = weekOffset === 0
    ? "This Week"
    : weekOffset === 1
    ? "Last Week"
    : `${format(weekStart, "dd MMM")} – ${format(weekEnd, "dd MMM")}`;

  return (
    <div className="flex flex-col gap-3 py-3">
      {/* Monthly headline */}
      <Card className={`p-4 ${monthly.profit >= 0 ? "bg-accent/10" : "bg-destructive/10"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {format(today, "MMMM yyyy")} · Net Profit
            </p>
            <p className={`font-display text-3xl font-bold ${monthly.profit >= 0 ? "text-accent" : "text-destructive"}`}>
              {monthly.profit >= 0 ? "" : "-"}{formatRupee(Math.abs(monthly.profit))}
            </p>
          </div>
          {monthly.profit >= 0
            ? <TrendingUp className="h-10 w-10 text-accent" />
            : <TrendingDown className="h-10 w-10 text-destructive" />}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground font-mono">
          <span>Sales {formatRupee(monthly.sales)}</span>
          <span>Expenses {formatRupee(monthly.expenses)}</span>
        </div>
      </Card>

      {/* Today's sales quick entry */}
      <Card className="p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Today's Sales · {format(today, "dd MMM yyyy")}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">₹</span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={todayInput}
            onChange={(e) => setTodayInput(e.target.value)}
            className="font-mono"
          />
          <Button
            size="sm"
            onClick={() => upsertSales(todayKey, Number(todayInput) || 0)}
          >
            Save
          </Button>
        </div>
      </Card>

      {/* Week navigator */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset + 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-mono text-sm font-semibold">{weekLabel}</div>
          <div className="text-[10px] text-muted-foreground">
            {format(weekStart, "dd MMM")} – {format(weekEnd, "dd MMM yyyy")}
          </div>
        </div>
        <Button
          variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
          disabled={weekOffset === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Sales</p>
          <p className="font-mono text-sm font-bold text-revenue">{formatRupee(weekSales)}</p>
        </Card>
        <Card className="p-2 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Expenses</p>
          <p className="font-mono text-sm font-bold">{formatRupee(weekExpenses)}</p>
        </Card>
        <Card className={`p-2 text-center ${weekTotal >= 0 ? "bg-accent/10" : "bg-destructive/10"}`}>
          <p className="text-[10px] uppercase text-muted-foreground">Profit</p>
          <p className={`font-mono text-sm font-bold ${weekTotal >= 0 ? "text-accent" : "text-destructive"}`}>
            {weekTotal >= 0 ? "" : "-"}{formatRupee(Math.abs(weekTotal))}
          </p>
        </Card>
      </div>

      {/* Bar chart */}
      <Card className="p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Profit</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => formatRupee(value)}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.dateLabel ?? ""}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.profit >= 0 ? "hsl(var(--accent))" : "hsl(var(--destructive))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Per-day breakdown with editable sales */}
      <div className="space-y-1">
        {chartData.map((d) => (
          <DayRow
            key={d.key}
            dateKey={d.key}
            label={d.label}
            dateLabel={d.dateLabel}
            sales={d.sales}
            expenses={d.expenses}
            onSave={(v) => upsertSales(d.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function DayRow({
  dateKey, label, dateLabel, sales, expenses, onSave,
}: {
  dateKey: string; label: string; dateLabel: string; sales: number; expenses: number;
  onSave: (amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(sales || ""));
  useEffect(() => { setVal(String(sales || "")); }, [sales]);
  const profit = sales - expenses;

  return (
    <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
      <div className="flex-1 min-w-0">
        <div className="font-medium">
          {label} <span className="text-muted-foreground font-mono text-xs">{dateLabel}</span>
        </div>
        {editing ? (
          <div className="mt-1 flex items-center gap-1">
            <span className="font-mono text-xs">₹</span>
            <Input
              type="number" inputMode="decimal" value={val}
              onChange={(e) => setVal(e.target.value)}
              className="h-7 w-24 px-2 font-mono text-xs"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-7 w-7"
              onClick={() => { onSave(Number(val) || 0); setEditing(false); }}>
              <Check className="h-3.5 w-3.5 text-accent" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7"
              onClick={() => { setVal(String(sales || "")); setEditing(false); }}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground font-mono hover:text-foreground"
          >
            Sales {formatRupee(sales)} · Exp {formatRupee(expenses)} <Pencil className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
      <div className={`font-mono font-bold ml-2 shrink-0 ${profit >= 0 ? "text-accent" : "text-destructive"}`}>
        {profit >= 0 ? "" : "-"}{formatRupee(Math.abs(profit))}
      </div>
    </div>
  );
}
