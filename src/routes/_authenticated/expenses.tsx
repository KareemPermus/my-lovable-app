import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { financeQueryOptions } from "@/lib/finance-queries";
import { createExpense, deleteExpense } from "@/functions/finance.functions";
import { CURRENCIES, EXPENSE_CATEGORIES, formatMoney, formatDate } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/expenses")({
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQueryOptions),
  head: () => ({
    meta: [
      { title: "Expenses — Ledgerline" },
      { name: "description", content: "Log and review company expenses." },
      { property: "og:title", content: "Expenses — Ledgerline" },
      { property: "og:description", content: "Log and review company expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExpensesPage,
});

const inputCls =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function ExpensesPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(financeQueryOptions);
  const { expenses } = data;

  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = expenses.reduce((s, r) => s + Number(r.amount), 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createExpense({
        data: {
          category,
          vendor: vendor.trim(),
          amount: parseFloat(amount),
          currency,
          spent_at: spentAt,
          notes: notes.trim() || null,
        },
      });
      setVendor("");
      setAmount("");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the expense");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await deleteExpense({ data: { id } });
    await queryClient.invalidateQueries({ queryKey: ["finance"] });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-foreground">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What it costs to run the business.
          </p>
        </div>
        <p className="tabular text-lg font-semibold text-negative">
          {formatMoney(total, expenses[0]?.currency ?? "USD")}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Vendor / payee</label>
          <input required value={vendor} onChange={(e) => setVendor(e.target.value)} className={inputCls} placeholder="AWS" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Amount</label>
          <input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="350" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <input type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Monthly invoice" />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Log expense"}
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        {expenses.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No expenses yet — log your first one above.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(e.spent_at)}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{e.vendor}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.category}</td>
                  <td className="max-w-40 truncate px-5 py-3 text-muted-foreground">{e.notes ?? "—"}</td>
                  <td className="tabular px-5 py-3 text-right font-semibold text-negative">
                    {formatMoney(Number(e.amount), e.currency)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(e.id)}
                      className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
