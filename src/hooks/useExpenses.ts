import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Expense {
  id: string;
  dateKey: string; // YYYY-MM-DD
  item: string;
  amount: number;
  merchant?: string;
  createdAt: string;
}

const LEGACY_KEY = "truckpos_expenses_v1";
const MIGRATED_FLAG = "truckpos_expenses_migrated_v1";

interface Row {
  id: string;
  date_key: string;
  item: string;
  amount: number | string;
  merchant: string | null;
  created_at: string;
}

const fromRow = (r: Row): Expense => ({
  id: r.id,
  dateKey: r.date_key,
  item: r.item,
  amount: Number(r.amount),
  merchant: r.merchant || undefined,
  createdAt: r.created_at,
});

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load expenses", description: error.message, variant: "destructive" });
      return;
    }
    setExpenses((data as Row[]).map(fromRow));
  }, []);

  // Initial load + one-time migration from localStorage
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!localStorage.getItem(MIGRATED_FLAG)) {
          const raw = localStorage.getItem(LEGACY_KEY);
          if (raw) {
            try {
              const legacy: Expense[] = JSON.parse(raw);
              if (Array.isArray(legacy) && legacy.length) {
                const rows = legacy.map((e) => ({
                  date_key: e.dateKey,
                  item: e.item,
                  amount: e.amount,
                  merchant: e.merchant ?? null,
                  created_at: e.createdAt,
                }));
                const { error } = await supabase.from("expenses").insert(rows);
                if (!error) {
                  toast({ title: "Synced", description: `${rows.length} local expense(s) moved to Cloud.` });
                }
              }
            } catch {}
          }
          localStorage.setItem(MIGRATED_FLAG, "1");
        }
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  // Realtime updates across devices
  useEffect(() => {
    const channel = supabase
      .channel("expenses-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const addExpense = useCallback(
    async (data: { dateKey: string; item: string; amount: number; merchant?: string }) => {
      const { error } = await supabase.from("expenses").insert({
        date_key: data.dateKey,
        item: data.item,
        amount: data.amount,
        merchant: data.merchant ?? null,
      });
      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
        return;
      }
      await refresh();
    },
    [refresh],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        return;
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    },
    [],
  );

  const getForDate = useCallback(
    (dateKey: string) => expenses.filter((e) => e.dateKey === dateKey),
    [expenses],
  );

  return { expenses, addExpense, deleteExpense, getForDate, loading };
}
