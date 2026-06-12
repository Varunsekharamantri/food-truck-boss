import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface DailySales {
  id: string;
  dateKey: string;
  amount: number;
}

interface Row { id: string; date_key: string; amount: number | string }

const fromRow = (r: Row): DailySales => ({ id: r.id, dateKey: r.date_key, amount: Number(r.amount) });

export function useDailySales() {
  const [sales, setSales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("daily_sales").select("*").order("date_key", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load sales", description: error.message, variant: "destructive" });
      return;
    }
    setSales((data as Row[]).map(fromRow));
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await refresh(); setLoading(false); })();
    const ch = supabase
      .channel("daily-sales-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_sales" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const upsertSales = useCallback(async (dateKey: string, amount: number) => {
    const { error } = await supabase
      .from("daily_sales")
      .upsert({ date_key: dateKey, amount }, { onConflict: "date_key" });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  }, [refresh]);

  const getForDate = useCallback(
    (dateKey: string) => sales.find((s) => s.dateKey === dateKey)?.amount ?? 0,
    [sales],
  );

  return { sales, upsertSales, getForDate, loading };
}
