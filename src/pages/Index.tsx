import { useState, useEffect } from "react";
import { ClipboardList, Settings, Package, Moon, Sun, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrdersPage from "@/pages/OrdersPage";
import MenuSettingsPage from "@/pages/MenuSettingsPage";
import InventoryPage from "@/pages/InventoryPage";
import ExpensesPage from "@/pages/ExpensesPage";
import ProfitsPage from "@/pages/ProfitsPage";

type Tab = "orders" | "menu" | "inventory" | "expenses" | "profits";

const TABS: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "menu", label: "Menu", icon: Settings },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "expenses", label: "Expenses", icon: Receipt },
  { key: "profits", label: "Profits", icon: TrendingUp },
];

export default function Index() {
  const [tab, setTab] = useState<Tab>("orders");
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("truckpos_theme") === "dark" ||
        (!localStorage.getItem("truckpos_theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("truckpos_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <h1 className="font-display text-xl font-bold tracking-tight">
          Truck<span className="text-primary">POS</span>
        </h1>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDark(!dark)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4">
        {tab === "orders" && <OrdersPage />}
        {tab === "menu" && <MenuSettingsPage />}
        {tab === "inventory" && <InventoryPage />}
        {tab === "expenses" && <ExpensesPage />}
        {tab === "profits" && <ProfitsPage />}
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 flex border-t bg-card/80 backdrop-blur-md">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              tab === key ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
