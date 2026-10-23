import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { financeQueryOptions } from "@/lib/finance-queries";
import { formatMoney, formatDate, licenseLabel } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQueryOptions),
  head: () => ({
    meta: [
      { title: "Dashboard — Ledgerline" },
      {
        name: "description",
        content: "Revenue, expenses, and profit for your software business at a glance.",
      },
      { property: "og:title", content: "Dashboard — Ledgerline" },
      {
        property: "og:description",
        content: "Revenue, expenses, and profit for your software business at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const PIE_COLORS = [
  "oklch(0.42 0.085 168)",
  "oklch(0.6 0.09 130)",
  "oklch(0.7 0.1 90)",
  "oklch(0.55 0.08 200)",
  "oklch(0.65 0.12 40)",
  "oklch(0.5 0.06 260)",
  "oklch(0.72 0.08 150)",
  "oklch(0.6 0.02 170)",
];

function Dashboard() {
  const { data } = useSuspenseQuery(financeQueryOptions);
  const { sales, expenses } = data;

  const totalRevenue = sales.reduce((s, r) => s + Number(r.amount), 0);
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0);
  const profit = totalRevenue - totalExpenses;
  const currency = sales[0]?.currency ?? expenses[0]?.currency ?? "USD";

  // Last 8 months revenue vs expense
  const months: { key: string; label: string; revenue: number; expense: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      revenue: 0,
      expense: 0,
    });
  }
  for (const s of sales) {
    const m = months.find((x) => x.key === s.sold_at.slice(0, 7));
    if (m) m.revenue += Number(s.amount);
  }
  for (const e of expenses) {
    const m = months.find((x) => x.key === e.spent_at.slice(0, 7));
    if (m) m.expense += Number(e.amount);
  }

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
  }
  const pieData = [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const recent = [
    ...sales.map((s) => ({
      id: `s-${s.id}`,
      date: s.sold_at,
      label: `${s.product_name} → ${s.customer_name}`,
      detail: licenseLabel(s.license_type),
      amount: Number(s.amount),
      currency: s.currency,
      kind: "sale" as const,
    })),
    ...expenses.map((e) => ({
      id: `e-${e.id}`,
      date: e.spent_at,
      label: e.vendor || e.category,
      detail: e.category,
      amount: Number(e.amount),
      currency: e.currency,
      kind: "expense" as const,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  const empty = sales.length === 0 && expenses.length === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-medium text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your company's money, month by month.
      </p>

      {empty ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="text-2xl font-medium text-foreground">Start your ledger</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Record your first license sale or expense and this dashboard will come to life
            with revenue, spending, and profit.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/sales"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Add a sale
            </Link>
            <Link
              to="/expenses"
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Add an expense
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total revenue
              </p>
              <p className="tabular mt-2 text-3xl font-medium text-positive">
                {formatMoney(totalRevenue, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {sales.length} license {sales.length === 1 ? "sale" : "sales"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total expenses
              </p>
              <p className="tabular mt-2 text-3xl font-medium text-negative">
                {formatMoney(totalExpenses, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Net profit
              </p>
              <p
                className={`tabular mt-2 text-3xl font-medium ${profit >= 0 ? "text-positive" : "text-negative"}`}
              >
                {formatMoney(profit, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalRevenue > 0
                  ? `${Math.round((profit / totalRevenue) * 100)}% margin`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-3">
              <h2 className="text-lg font-medium text-foreground">Revenue vs expenses</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" width={48} />
                    <Tooltip
                      formatter={(value: number) => formatMoney(value, currency)}
                      cursor={{ fill: "var(--color-muted)" }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="var(--color-positive)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="var(--color-negative)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
              <h2 className="text-lg font-medium text-foreground">Expenses by category</h2>
              {pieData.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">No expenses yet.</p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatMoney(value, currency)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-medium text-foreground">Recent activity</h2>
            <ul className="mt-3 divide-y divide-border">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.date)} · {r.detail}
                    </p>
                  </div>
                  <p
                    className={`tabular shrink-0 text-sm font-semibold ${r.kind === "sale" ? "text-positive" : "text-negative"}`}
                  >
                    {r.kind === "sale" ? "+" : "−"}
                    {formatMoney(r.amount, r.currency)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
