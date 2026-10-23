import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/sales", label: "Sales" },
  { to: "/expenses", label: "Expenses" },
] as const;

function AppLayout() {
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-6">
          <p className="font-display text-xl font-medium tracking-tight">Ledgerline</p>
          <p className="mt-1 text-xs opacity-60">Company finance</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-lg px-3 py-2 text-sm font-medium opacity-75 transition-colors hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "bg-sidebar-accent opacity-100" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4">
          <button
            onClick={signOut}
            className="w-full rounded-lg border border-sidebar-border px-3 py-2 text-xs font-medium opacity-80 transition-opacity hover:opacity-100"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}
