import { useState, useEffect, useCallback } from "react";

export interface Expense {
  id: string;
  dateKey: string; // YYYY-MM-DD
  item: string;
  amount: number;
  merchant?: string;
  createdAt: string;
}

const STORAGE_KEY = "truckpos_expenses_v1";

function load(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => load());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = useCallback((data: Omit<Expense, "id" | "createdAt">) => {
    setExpenses((prev) => [
      ...prev,
      { ...data, id: genId(), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getForDate = useCallback(
    (dateKey: string) => expenses.filter((e) => e.dateKey === dateKey),
    [expenses],
  );

  return { expenses, addExpense, deleteExpense, getForDate };
}
