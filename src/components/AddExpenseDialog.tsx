import { useState, useRef } from "react";
import { Upload, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDateKey } from "@/lib/dateUtils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultDateKey: string;
  onSave: (data: { item: string; amount: number; merchant?: string; dateKey: string }) => void;
}

export function AddExpenseDialog({ open, onOpenChange, defaultDateKey, onSave }: Props) {
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [dateKey, setDateKey] = useState(defaultDateKey);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setItem("");
    setAmount("");
    setMerchant("");
    setDateKey(defaultDateKey);
  };

  const handleFile = async (file: File) => {
    setScanning(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("extract-expense", {
        body: { imageDataUrl: dataUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.item) setItem(data.item);
      if (typeof data.amount === "number") setAmount(String(data.amount));
      if (data.merchant) setMerchant(data.merchant);
      // Note: we intentionally do NOT overwrite the date from the receipt —
      // the user already chose which day this expense belongs to. They can
      // still change it manually if needed.
      toast({ title: "Scanned", description: "Review the details before saving." });
    } catch (e) {
      toast({
        title: "Could not scan",
        description: (e as Error).message || "Try a clearer image or fill manually.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!item.trim() || !amt || amt <= 0) {
      toast({ title: "Missing info", description: "Item and a valid amount are required.", variant: "destructive" });
      return;
    }
    onSave({ item: item.trim(), amount: amt, merchant: merchant.trim() || undefined, dateKey });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-center gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                <Upload className="h-4 w-4" /> Scan Screenshot
              </>
            )}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="exp-item">Item / Description</Label>
            <Input id="exp-item" value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. Onions, Gas refill" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount (₹)</Label>
              <Input
                id="exp-amount"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value || formatDateKey(new Date()))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-merchant">Paid to (optional)</Label>
            <Input id="exp-merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
