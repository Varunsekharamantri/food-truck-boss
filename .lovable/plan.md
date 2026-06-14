## Plan: Generate TruckPOS PRD (DOCX)

Produce a single Product Requirements Document for the TruckPOS app, formatted as a polished `.docx` file delivered as an artifact under `/mnt/documents/TruckPOS_PRD.docx`.

### Audience & Depth
- **Audience:** Product team / general stakeholders.
- **Tone:** Balanced — user flows, feature breakdowns, data model overview, screen descriptions. Not investor pitch, not raw dev spec.

### PRD Structure

1. **Document Header** — Product name (TruckPOS), version, date (14-Jun-2026), owner, status.
2. **Executive Summary** — One-paragraph product overview: mobile-first PWA POS for food trucks, India-focused (₹), real-time multi-device sync via Lovable Cloud backend.
3. **Goals & Non-Goals** — What the product solves; what is explicitly out of scope (multi-tenant, online ordering, payment gateway integration).
4. **Target Users & Personas** — Food truck owner-operator, cook, helper/cashier.
5. **Key Concepts & Glossary** — Order, Item Status, Bucket, Parcel charge, Cook To-Do, Daily Sales, Payout.
6. **Information Architecture** — 6-tab bottom-nav layout (Orders, Menu, Stock, Expenses, Staff, Profits) with header (brand, live indicator, theme toggle).
7. **Module Specifications** — One section per tab, each with:
   - Purpose
   - Primary user flows (step-by-step)
   - Screen layout & key UI elements
   - Business rules / formulas
   - Data entities involved
8. **Cross-Cutting Features** — Theme (light/dark), realtime sync, PWA installability, offline behavior, toast notifications, date navigation pattern.
9. **Data Model Overview** — Tables: `menu_items`, `orders` (JSON items), `inventory`, `expenses`, `daily_sales`, `employees`, `attendance`, `salary_payouts`. Plain-English schema, not SQL.
10. **Business Logic & Formulas** — Order status derivation, line totals with parcel charge (+₹10/unit), order auto-renumbering on delete, Master "Without Helper" wage override (₹1400), salary balance = earned − paid, weekly/monthly profit aggregation.
11. **Design System** — Saffron accent, Space Grotesk display + JetBrains Mono numeric font, bucket color tokens, mobile-first POS button sizing.
12. **Standards & Formatting** — ₹ currency, DD-MMM-YYYY dates, item categorization rules (Rice/Noodles, Starters, Shawarma, BBQ, Add-ons).
13. **AI Features** — Expense screenshot extraction via Lovable AI Gateway (Gemini multimodal) edge function.
14. **Security Model** — Authenticated-only access, RLS on all tables, single-business shared-data model.
15. **Success Metrics** — Daily orders processed, sync latency, attendance compliance, expense capture rate.
16. **Future Considerations** — Inventory deduction on order, multi-truck support, customer-facing receipts, payment gateway.

### Technical Implementation

- Use the `docx` skill (already documented in context).
- Generate via `docx-js` Node script, US Letter page size, Arial body / bold Arial headings (universally available), saffron accent for headings via custom color.
- Use proper `Heading1`/`Heading2` styles with `outlineLevel` so the TOC works.
- Include a **Table of Contents** after the executive summary.
- Use **tables** for: tab summary, data model overview, business formulas, glossary. All tables use `WidthType.DXA` with matched `columnWidths` + per-cell widths; cell margins 80/120; `ShadingType.CLEAR` for header row shading in light saffron.
- Use **bullet lists** via `LevelFormat.BULLET` numbering config (never unicode `•`).
- Run `validate_document.py` after generation.
- QA: convert to PDF via LibreOffice, render each page as JPG with `pdftoppm`, read every page image to check for overflow, broken tables, missing TOC entries; fix and re-run before delivery.

### Deliverable

- File: `/mnt/documents/TruckPOS_PRD.docx`
- Surfaced via `<presentation-artifact>` tag with `mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"`.
- Short closing note to user.
