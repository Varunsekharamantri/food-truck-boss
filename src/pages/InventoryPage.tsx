import { useState } from "react";
import { useStore, type InventoryItem } from "@/hooks/useStore";
import { formatRupee } from "@/lib/dateUtils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function InventoryPage() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "kg", costPerUnit: "" });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", quantity: "", unit: "kg", costPerUnit: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ name: item.name, quantity: item.quantity.toString(), unit: item.unit, costPerUnit: item.costPerUnit.toString() });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const qty = parseFloat(form.quantity);
    const cost = parseFloat(form.costPerUnit);
    if (!form.name.trim() || isNaN(qty) || isNaN(cost)) return;
    if (editing) {
      updateInventoryItem(editing.id, { name: form.name.trim(), quantity: qty, unit: form.unit, costPerUnit: cost });
    } else {
      addInventoryItem({ name: form.name.trim(), quantity: qty, unit: form.unit, costPerUnit: cost });
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Inventory</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>

      {inventory.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No inventory items yet. Tap "Add Item" to start.</p>
      )}

      <div className="flex flex-col gap-2">
        {inventory.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="font-mono text-sm">
                {item.quantity} {item.unit} · {formatRupee(item.costPerUnit)}/{item.unit}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Updated {format(new Date(item.updatedAt), "dd-MMM-yyyy")}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteInventoryItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[92vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Inventory" : "Add Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Item Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="5" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg" />
              </div>
            </div>
            <div>
              <Label>Cost per Unit (₹)</Label>
              <Input type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} placeholder="250" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="w-full">{editing ? "Save Changes" : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
