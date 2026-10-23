<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Ledgerline finance app: TanStack Start + Lovable Cloud. Protected pages live under `src/routes/_authenticated/` (dashboard, sales, expenses) gated by the layout's client-side auth check; data access goes through `src/functions/finance.functions.ts` server functions with `requireSupabaseAuth`, never direct browser queries.
