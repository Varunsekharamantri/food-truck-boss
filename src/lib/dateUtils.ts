import { format, parse, addDays, subDays } from "date-fns";

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplay(date: Date): string {
  return format(date, "dd-MMM-yyyy");
}

export function parseDateKey(key: string): Date {
  return parse(key, "yyyy-MM-dd", new Date());
}

export function getNextDay(date: Date): Date {
  return addDays(date, 1);
}

export function getPrevDay(date: Date): Date {
  return subDays(date, 1);
}

export function formatRupee(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
