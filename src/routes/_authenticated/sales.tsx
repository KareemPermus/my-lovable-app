import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { financeQueryOptions } from "@/lib/finance-queries";
import { createSale, deleteSale } from "@/functions/finance.functions";
import { CURRENCIES, LICENSE_TYPES, formatMoney, formatDate, licenseLabel } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/sales")({
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQueryOptions),
  head: () => ({
    meta: [
      { title: "License sales — Ledgerline" },
      { name: "description", content: "Record and review software license sales." },
      { property: "og:title", content: "License sales — Ledgerline" },
      { property: "og:description", content: "Record and review software license sales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SalesPage,
});

const inputCls =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function SalesPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(financeQueryOptions);
  const { sales } = data;

  const [product, setProduct] = useState("");
  const [customer, setCustomer] = useState("");
  const [licenseType, setLicenseType] = useState<string>("perpetual");
  const [quantity, setQuantity] = useState("1");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [soldAt, setSoldAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = sales.reduce((s, r) => s + Number(r.amount), 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createSale({
        data: {
          product_name: product.trim(),
          customer_name: customer.trim(),
          license_type: licenseType,
          quantity: Math.max(1, parseInt(quantity, 10) || 1),
          amount: parseFloat(amount),
          currency,
          sold_at: soldAt,
          notes: notes.trim() || null,
        },
      });
      setProduct("");
      setCustomer("");
      setAmount("");
      setQuantity("1");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the sale");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await deleteSale({ data: { id } });
    await queryClient.invalidateQueries({ queryKey: ["finance"] });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-foreground">License sales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One-time licenses sold to customers.
          </p>
        </div>
        <p className="tabular text-lg font-semibold text-positive">
          {formatMoney(total, sales[0]?.currency ?? "USD")}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <label className="text-xs font-medium text-muted-foreground">Product</label>
          <input required value={product} onChange={(e) => setProduct(e.target.value)} className={inputCls} placeholder="DataSync Pro" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Customer</label>
          <input required value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls} placeholder="Acme FZ-LLC" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">License type</label>
          <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)} className={inputCls}>
            {LICENSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Seats / quantity</label>
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Amount</label>
          <input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="12000" />
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
          <input type="date" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="PO-1042" />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Record sale"}
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        {sales.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No sales yet — record your first license above.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">License</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(s.sold_at)}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{s.product_name}</td>
                  <td className="px-5 py-3">{s.customer_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {licenseLabel(s.license_type)}
                    {s.quantity > 1 ? ` × ${s.quantity}` : ""}
                  </td>
                  <td className="tabular px-5 py-3 text-right font-semibold text-positive">
                    {formatMoney(Number(s.amount), s.currency)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(s.id)}
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
