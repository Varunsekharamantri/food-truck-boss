import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Receipt, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/contexts/AuthContext";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { formatDateKey, formatDisplay, getNextDay, getPrevDay, formatRupee } from "@/lib/dateUtils";

export default function ExpensesPage() {
  const { addExpense, deleteExpense, getForDate } = useExpenses();
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);

  const dateKey = formatDateKey(date);
  const dayExpenses = useMemo(
    () => getForDate(dateKey).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [getForDate, dateKey],
  );
  const total = useMemo(() => dayExpenses.reduce((s, e) => s + e.amount, 0), [dayExpenses]);

  return (
    <div className="py-3">
      {/* Date strip */}
      <div className="mb-3 flex items-center justify-between rounded-lg border bg-card p-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(getPrevDay(date))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-mono text-sm font-semibold">{formatDisplay(date)}</div>
          <div className="text-[10px] text-muted-foreground">{dayExpenses.length} expense(s)</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(getNextDay(date))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Total */}
      <Card className="mb-3 flex items-center justify-between bg-primary/10 p-3">
        <span className="text-sm font-medium text-muted-foreground">Day Total</span>
        <span className="font-display text-2xl font-bold text-primary">{formatRupee(total)}</span>
      </Card>

      {/* Add button */}
      <Button className="mb-3 h-12 w-full gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-5 w-5" /> Add Expense
      </Button>

      {/* List */}
      {dayExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground">
          <Receipt className="mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No expenses for this day</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayExpenses.map((e) => (
            <Card key={e.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{e.item}</div>
                {e.merchant && <div className="truncate text-xs text-muted-foreground">{e.merchant}</div>}
              </div>
              <div className="font-mono font-semibold">{formatRupee(e.amount)}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteExpense(e.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <AddExpenseDialog
        open={open}
        onOpenChange={setOpen}
        defaultDateKey={dateKey}
        onSave={(data) => addExpense(data)}
      />
    </div>
  );
}
