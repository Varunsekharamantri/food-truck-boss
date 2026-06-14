import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, ChevronLeft, ChevronRight, Wallet, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStaff, type Employee } from "@/hooks/useStaff";
import { formatRupee, formatDateKey, formatDisplay, getNextDay, getPrevDay } from "@/lib/dateUtils";
import { toast } from "sonner";

export default function StaffPage() {
  const { employees, attendance, payouts, addEmployee, updateEmployee, deleteEmployee, setAttendanceFor, addPayout, deletePayout } =
    useStaff();

  const [date, setDate] = useState(new Date());
  const dateKey = formatDateKey(date);

  // Add employee dialog
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [wage, setWage] = useState("");

  // Payout dialog
  const [payoutFor, setPayoutFor] = useState<Employee | null>(null);
  const [payoutAmt, setPayoutAmt] = useState("");
  const [payoutNote, setPayoutNote] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editFor, setEditFor] = useState<Employee | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editWage, setEditWage] = useState("");

  const attMap = useMemo(() => {
    const m = new Map<string, { present: boolean; without_helper: boolean }>();
    attendance.forEach((a) =>
      m.set(`${a.employee_id}|${a.date_key}`, { present: a.present, without_helper: a.without_helper }),
    );
    return m;
  }, [attendance]);

  const summary = useMemo(() => {
    return employees.map((e) => {
      const empAtt = attendance.filter((a) => a.employee_id === e.id && a.present);
      const present = empAtt.length;
      const earned = empAtt.reduce((s, a) => s + Number(a.wage_snapshot || 0), 0);
      const paid = payouts
        .filter((p) => p.employee_id === e.id)
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      return { emp: e, present, earned, paid, balance: earned - paid };
    });
  }, [employees, attendance, payouts]);

  const handleAdd = async () => {
    if (!name.trim() || !role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    const w = Number(wage);
    if (!w || w < 0) {
      toast.error("Enter a valid daily wage");
      return;
    }
    await addEmployee(name.trim(), role.trim(), w);
    setName("");
    setRole("");
    setWage("");
    setAddOpen(false);
    toast.success("Employee added");
  };

  const handleUpdate = async () => {
    if (!editFor) return;
    if (!editName.trim() || !editRole.trim()) {
      toast.error("Name and role are required");
      return;
    }
    const w = Number(editWage);
    if (!w || w < 0) {
      toast.error("Enter a valid daily wage");
      return;
    }
    await updateEmployee(editFor.id, { name: editName.trim(), role: editRole.trim(), daily_wage: w });
    setEditOpen(false);
    setEditFor(null);
    toast.success("Employee updated");
  };

  const handlePay = async () => {
    if (!payoutFor) return;
    const amt = Number(payoutAmt);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    await addPayout(payoutFor.id, dateKey, amt, payoutNote.trim() || undefined);
    setPayoutAmt("");
    setPayoutNote("");
    setPayoutFor(null);
    toast.success("Payout recorded");
  };

  return (
    <div className="space-y-4 pb-6 pt-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Staff</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh" />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Cook, Helper" />
              </div>
              <div className="space-y-1">
                <Label>Daily Wage (₹)</Label>
                <Input
                  inputMode="numeric"
                  value={wage}
                  onChange={(e) => setWage(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="e.g. 500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        {/* ATTENDANCE */}
        <TabsContent value="attendance" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setDate(getPrevDay(date))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">{formatDisplay(date)}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setDate(getNextDay(date))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {employees.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No employees yet.</p>
              )}
              {employees.map((e) => {
                const rec = attMap.get(`${e.id}|${dateKey}`);
                const present = rec?.present;
                const withoutHelper = rec?.without_helper ?? false;
                const isMaster = e.role.trim().toLowerCase() === "master";
                return (
                  <div key={e.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.role} • {formatRupee(Number(e.daily_wage))}/day
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={present === true ? "default" : "outline"}
                          onClick={() => setAttendanceFor(e.id, dateKey, true, { without_helper: withoutHelper })}
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" /> P
                        </Button>
                        <Button
                          size="sm"
                          variant={present === false ? "destructive" : "outline"}
                          onClick={() => setAttendanceFor(e.id, dateKey, false, { without_helper: false })}
                          className="gap-1"
                        >
                          <X className="h-4 w-4" /> A
                        </Button>
                      </div>
                    </div>
                    {isMaster && present === true && (
                      <Button
                        size="sm"
                        variant={withoutHelper ? "default" : "outline"}
                        onClick={() => setAttendanceFor(e.id, dateKey, true, { without_helper: !withoutHelper })}
                        className="w-full text-xs"
                      >
                        {withoutHelper
                          ? `Without Helper • ${formatRupee(1400)}`
                          : "Mark Without Helper (₹1400)"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SALARY */}
        <TabsContent value="salary" className="space-y-3">
          {summary.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Add employees to see salary.</p>
          )}
          {summary.map(({ emp, present, earned, paid, balance }) => {
            const empPayouts = payouts
              .filter((p) => p.employee_id === emp.id)
              .sort((a, b) => b.date_key.localeCompare(a.date_key));
            return (
              <Card key={emp.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{emp.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {emp.role} • {formatRupee(Number(emp.daily_wage))}/day
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setPayoutFor(emp)}
                    >
                      <Wallet className="h-4 w-4" /> Pay
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-md bg-muted p-2">
                      <p className="text-muted-foreground">Days</p>
                      <p className="font-mono text-sm font-bold">{present}</p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <p className="text-muted-foreground">Earned</p>
                      <p className="font-mono text-sm font-bold">{formatRupee(earned)}</p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <p className="text-muted-foreground">Paid</p>
                      <p className="font-mono text-sm font-bold">{formatRupee(paid)}</p>
                    </div>
                    <div
                      className={`rounded-md p-2 ${balance > 0 ? "bg-primary/10 text-primary" : "bg-muted"}`}
                    >
                      <p className="text-muted-foreground">Balance</p>
                      <p className="font-mono text-sm font-bold">{formatRupee(balance)}</p>
                    </div>
                  </div>
                  {empPayouts.length > 0 && (
                    <div className="space-y-1 border-t pt-2">
                      <p className="text-xs font-semibold text-muted-foreground">Payouts</p>
                      {empPayouts.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span>
                            {format(new Date(p.date_key), "dd-MMM")} • {formatRupee(Number(p.amount))}
                            {p.note ? ` — ${p.note}` : ""}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => deletePayout(p.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* EMPLOYEES */}
        <TabsContent value="employees" className="space-y-2">
          {employees.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No employees yet.</p>
          )}
          {employees.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{e.name}</p>
                <p className="text-xs text-muted-foreground">
                  {e.role} • {formatRupee(Number(e.daily_wage))}/day
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditFor(e);
                    setEditName(e.name);
                    setEditRole(e.role);
                    setEditWage(String(e.daily_wage));
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete ${e.name}? This removes their attendance and payouts.`)) {
                      deleteEmployee(e.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Payout Dialog */}
      <Dialog open={!!payoutFor} onOpenChange={(o) => !o && setPayoutFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay {payoutFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input
                inputMode="numeric"
                value={payoutAmt}
                onChange={(e) => setPayoutAmt(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="e.g. 1000"
              />
            </div>
            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Input value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} placeholder="Advance, weekly..." />
            </div>
            <p className="text-xs text-muted-foreground">Date: {formatDisplay(date)}</p>
          </div>
          <DialogFooter>
            <Button onClick={handlePay}>Record Payout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Ramesh" />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Input value={editRole} onChange={(e) => setEditRole(e.target.value)} placeholder="e.g. Cook, Helper" />
            </div>
            <div className="space-y-1">
              <Label>Daily Wage (₹)</Label>
              <Input
                inputMode="numeric"
                value={editWage}
                onChange={(e) => setEditWage(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="e.g. 500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
