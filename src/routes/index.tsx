import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledgerline — Finance for software companies" },
      {
        name: "description",
        content:
          "Track software license sales and company expenses, and see profit at a glance with Ledgerline.",
      },
      { property: "og:title", content: "Ledgerline — Finance for software companies" },
      {
        property: "og:description",
        content:
          "Track software license sales and company expenses, and see profit at a glance with Ledgerline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Ledgerline
        </p>
        <h1 className="mt-4 text-5xl font-medium leading-tight text-foreground md:text-6xl">
          Every license sold. Every dirham spent. One calm ledger.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          The finance home for your software company — record license sales, log expenses,
          and watch profit take shape.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/auth"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in to your ledger
          </Link>
        </div>
      </div>
    </div>
  );
}
