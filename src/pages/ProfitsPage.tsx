import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStore, PARCEL_CHARGE } from "@/hooks/useStore";
import { useExpenses } from "@/hooks/useExpenses";
import { formatRupee, formatDateKey } from "@/lib/dateUtils";
import { format, startOfWeek, addDays, subWeeks, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

export default function ProfitsPage() {
  const { orders, menu } = useStore();
  const { expenses } = useExpenses();
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = last week, ...

  const priceOf = (id: string) => menu.find((m) => m.id === id)?.price || 0;

  // Sales totals per dateKey
  const salesByDate = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of orders) {
      let sum = 0;
      for (const i of o.items) sum += i.quantity * priceOf(i.menuItemId) + (i.parcel ? PARCEL_CHARGE * i.quantity : 0);
      m[o.dateKey] = (m[o.dateKey] || 0) + sum;
    }
    return m;
  }, [orders, menu]);

  // Expenses totals per dateKey
  const expensesByDate = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) m[e.dateKey] = (m[e.dateKey] || 0) + e.amount;
    return m;
  }, [expenses]);

  // Week window (Mon → Sun)
  const today = new Date();
  const weekStart = startOfWeek(subWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];

  const chartData = weekDays.map((d) => {
    const key = formatDateKey(d);
    const sales = salesByDate[key] || 0;
    const exp = expensesByDate[key] || 0;
    return {
      key,
      label: format(d, "EEE"),
      dateLabel: format(d, "dd MMM"),
      sales,
      expenses: exp,
      profit: sales - exp,
    };
  });

  const weekTotal = chartData.reduce((s, d) => s + d.profit, 0);
  const weekSales = chartData.reduce((s, d) => s + d.sales, 0);
  const weekExpenses = chartData.reduce((s, d) => s + d.expenses, 0);

  // Monthly figure (current calendar month, unaffected by week navigation)
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthlyProfit = useMemo(() => {
    let sales = 0, exp = 0;
    for (const [k, v] of Object.entries(salesByDate)) {
      const d = new Date(k);
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) sales += v;
    }
    for (const [k, v] of Object.entries(expensesByDate)) {
      const d = new Date(k);
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) exp += v;
    }
    return { sales, expenses: exp, profit: sales - exp };
  }, [salesByDate, expensesByDate, monthStart, monthEnd]);

  const weekLabel = weekOffset === 0
    ? "This Week"
    : weekOffset === 1
    ? "Last Week"
    : `${format(weekStart, "dd MMM")} – ${format(weekEnd, "dd MMM")}`;

  return (
    <div className="flex flex-col gap-3 py-3">
      {/* Monthly headline */}
      <Card className={`p-4 ${monthlyProfit.profit >= 0 ? "bg-accent/10" : "bg-destructive/10"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {format(today, "MMMM yyyy")} · Net Profit
            </p>
            <p className={`font-display text-3xl font-bold ${monthlyProfit.profit >= 0 ? "text-accent" : "text-destructive"}`}>
              {monthlyProfit.profit >= 0 ? "" : "-"}{formatRupee(Math.abs(monthlyProfit.profit))}
            </p>
          </div>
          {monthlyProfit.profit >= 0
            ? <TrendingUp className="h-10 w-10 text-accent" />
            : <TrendingDown className="h-10 w-10 text-destructive" />}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground font-mono">
          <span>Sales {formatRupee(monthlyProfit.sales)}</span>
          <span>Expenses {formatRupee(monthlyProfit.expenses)}</span>
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
          variant="ghost"
          size="icon"
          className="h-8 w-8"
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

      {/* Per-day breakdown */}
      <div className="space-y-1">
        {chartData.map((d) => (
          <div key={d.key} className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
            <div>
              <div className="font-medium">{d.label} <span className="text-muted-foreground font-mono text-xs">{d.dateLabel}</span></div>
              <div className="text-[10px] text-muted-foreground font-mono">
                Sales {formatRupee(d.sales)} · Exp {formatRupee(d.expenses)}
              </div>
            </div>
            <div className={`font-mono font-bold ${d.profit >= 0 ? "text-accent" : "text-destructive"}`}>
              {d.profit >= 0 ? "" : "-"}{formatRupee(Math.abs(d.profit))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
