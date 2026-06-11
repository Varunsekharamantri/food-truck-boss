# Expenses page with AI screenshot scanning

A new **Expenses** tab where you log daily spends. You can either type entries manually or upload a screenshot (UPI app, bill, receipt) and AI auto-fills the fields — you confirm and save.

## User flow

1. Tap **Expenses** in the bottom nav.
2. Tap **+ Add Expense**.
3. Two options in the dialog:
   - **Upload screenshot** → AI reads it → fields auto-fill
   - **Type manually**
4. Fields shown (all editable before saving):
   - Item / description (e.g. "Onions", "Gas refill")
   - Amount (₹)
   - Date (defaults to today, DD-MMM-YYYY)
   - Merchant / paid to
5. Save → appears in today's list with running daily total.

## Storage

LocalStorage now (key `truckpos_expenses_v1`), matching the rest of the app. Schema designed so a future Cloud migration is a drop-in swap.

```ts
interface Expense {
  id: string;
  dateKey: string;        // YYYY-MM-DD
  item: string;
  amount: number;
  merchant?: string;
  createdAt: string;
}
```

## AI extraction

Uses Lovable AI Gateway (Gemini multimodal — reads images natively). Since the app is currently 100% client-side with no backend, the simplest path:

- Enable **Lovable Cloud** (one-time) and add a tiny Edge Function `extract-expense` that accepts a base64 image and returns `{ item, amount, date, merchant }` using `google/gemini-3-flash-preview` with a structured output schema.
- Frontend converts the uploaded image to base64, calls the function, populates the form. User reviews and saves.

Why a function: `LOVABLE_API_KEY` must stay server-side — it can't live in the browser. This is the only backend touch; expense storage itself stays in localStorage.

If you'd rather not enable Cloud yet, alternative is manual-entry-only for now and add AI later — but you'd lose the main convenience.

## Files to add/change

- `src/hooks/useExpenses.ts` — CRUD + localStorage persistence
- `src/pages/ExpensesPage.tsx` — list + daily total + Add button
- `src/components/AddExpenseDialog.tsx` — upload + form, calls edge function
- `src/App.tsx` — route `/expenses`
- `src/components/NavLink.tsx` or wherever tabs render — add Expenses tab (icon: `Receipt` from lucide)
- `supabase/functions/extract-expense/index.ts` — Gemini vision call returning structured JSON

## Out of scope (can add later)

- Expense categories/tags
- Monthly/weekly reports & charts
- Editing/deleting past expenses (will include basic delete; full edit can come later if you want)
- Cloud sync (schema is ready for it)

Confirm and I'll build it. Heads-up: this will enable **Lovable Cloud** on your project so the AI vision call can run securely.
