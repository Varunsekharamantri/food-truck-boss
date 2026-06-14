import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Employee = {
  id: string;
  name: string;
  role: string;
  daily_wage: number;
  active: boolean;
};

export type Attendance = {
  id: string;
  employee_id: string;
  date_key: string;
  present: boolean;
};

export type Payout = {
  id: string;
  employee_id: string;
  date_key: string;
  amount: number;
  note: string | null;
};

export function useStaff() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [e, a, p] = await Promise.all([
      supabase.from("employees").select("*").order("created_at", { ascending: true }),
      supabase.from("attendance").select("*"),
      supabase.from("salary_payouts").select("*"),
    ]);
    if (e.data) setEmployees(e.data as Employee[]);
    if (a.data) setAttendance(a.data as Attendance[]);
    if (p.data) setPayouts(p.data as Payout[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("staff-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "salary_payouts" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh]);

  const addEmployee = async (name: string, role: string, daily_wage: number) => {
    await supabase.from("employees").insert({ name, role, daily_wage });
  };

  const updateEmployee = async (id: string, patch: Partial<Omit<Employee, "id">>) => {
    await supabase.from("employees").update(patch).eq("id", id);
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from("employees").delete().eq("id", id);
  };

  const setAttendanceFor = async (employee_id: string, date_key: string, present: boolean) => {
    const existing = attendance.find((a) => a.employee_id === employee_id && a.date_key === date_key);
    if (existing) {
      await supabase.from("attendance").update({ present }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({ employee_id, date_key, present });
    }
  };

  const addPayout = async (employee_id: string, date_key: string, amount: number, note?: string) => {
    await supabase.from("salary_payouts").insert({ employee_id, date_key, amount, note: note || null });
  };

  const deletePayout = async (id: string) => {
    await supabase.from("salary_payouts").delete().eq("id", id);
  };

  return {
    employees,
    attendance,
    payouts,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    setAttendanceFor,
    addPayout,
    deletePayout,
  };
}
