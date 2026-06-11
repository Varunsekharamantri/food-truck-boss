---
name: Expenses feature
description: Daily expense tracker with AI screenshot scanning that auto-fills item/amount/date/merchant
type: feature
---
Expenses live on a dedicated tab (`/expenses`) with mobile-first daily view + day total.
Storage: localStorage key `truckpos_expenses_v1`. Schema: `{ id, dateKey (YYYY-MM-DD), item, amount, merchant?, createdAt }`. Designed to migrate to Cloud later.
AI scan: `supabase/functions/extract-expense` calls Lovable AI Gateway with `google/gemini-2.5-flash` vision + tool-call schema to return `{ item, amount, date, merchant }`. User reviews fields before saving.
LOVABLE_API_KEY must stay server-side — never call the gateway from the browser.
