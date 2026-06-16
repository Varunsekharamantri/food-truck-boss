import { useRef, useState } from "react";
import { useStore, BUCKETS, type Bucket, type MenuItem } from "@/hooks/useStore";
import { formatRupee } from "@/lib/dateUtils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ImageIcon, Loader2, Sparkles, Upload } from "lucide-react";

export default function MenuSettingsPage() {
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem, generateMenuItemImage, uploadMenuItemImage } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: "", bucket: "Rice / Noodles" as Bucket, price: "" });
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const handleGenerate = async (id: string) => {
    setGeneratingId(id);
    await generateMenuItemImage(id);
    setGeneratingId(null);
  };

  const triggerUpload = (id: string) => {
    setUploadTargetId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = uploadTargetId;
    e.target.value = "";
    if (!file || !id) return;
    setUploadingId(id);
    await uploadMenuItemImage(id, file);
    setUploadingId(null);
    setUploadTargetId(null);
  };

  const handleGenerateAll = async () => {
    const missing = menu.filter((m) => !m.imageUrl);
    if (missing.length === 0) return;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: missing.length });
    for (let i = 0; i < missing.length; i++) {
      setGeneratingId(missing[i].id);
      await generateMenuItemImage(missing[i].id);
      setBulkProgress({ done: i + 1, total: missing.length });
    }
    setGeneratingId(null);
    setBulkRunning(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", bucket: "Rice / Noodles", price: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({ name: item.name, bucket: item.bucket, price: item.price.toString() });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const price = parseFloat(form.price);
    if (!form.name.trim() || isNaN(price) || price <= 0) return;
    if (editing) {
      updateMenuItem(editing.id, { name: form.name.trim(), bucket: form.bucket, price });
    } else {
      addMenuItem({ name: form.name.trim(), bucket: form.bucket, price });
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Menu Items</h2>
        <div className="flex gap-2">
          <Button onClick={handleGenerateAll} size="sm" variant="outline" disabled={bulkRunning || menu.every((m) => m.imageUrl)}>
            {bulkRunning ? (
              <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> {bulkProgress.done}/{bulkProgress.total}</>
            ) : (
              <><Sparkles className="mr-1 h-4 w-4" /> Generate all</>
            )}
          </Button>
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {BUCKETS.map((bucket) => {
        const items = menu.filter((m) => m.bucket === bucket);
        if (items.length === 0) return null;
        return (
          <div key={bucket}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{bucket}</p>
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-sm">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    {generatingId === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="font-mono text-sm font-semibold text-primary">{formatRupee(item.price)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Updated {format(new Date(item.updatedAt), "dd-MMM-yyyy")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary"
                      disabled={generatingId === item.id}
                      onClick={() => handleGenerate(item.id)}
                      title={item.imageUrl ? "Regenerate image" : "Generate image"}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMenuItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[92vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Item Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Rice" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.bucket} onValueChange={(v) => setForm({ ...form, bucket: v as Bucket })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUCKETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="119" />
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
